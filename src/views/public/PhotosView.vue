<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { listPhotos, createPhoto, deletePhoto } from '@/firebase/database'
import { uploadToCloudinary, isCloudinaryConfigured, cldThumb } from '@/utils/cloudinary'
import { formatDate, fromNow } from '@/utils/date'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const auth = useAuthStore()
const matchesStore = useMatchesStore()
const toast = useToast()

const photos = ref([])
const loading = ref(true)
const uploading = ref(false)
const filter = ref('')
const matchIdForUpload = ref('')
const fileInput = ref(null)

const lightbox = ref(null)
const lightboxOpen = computed({
  get: () => !!lightbox.value,
  set: (v) => { if (!v) lightbox.value = null }
})

const configured = isCloudinaryConfigured()

const matchOptions = computed(() =>
  [...matchesStore.matches]
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .map((m) => ({ id: m.id, label: `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` }))
)

const visible = computed(() =>
  filter.value ? photos.value.filter((p) => p.matchId === filter.value) : photos.value
)

async function load() {
  loading.value = true
  try { photos.value = await listPhotos() } finally { loading.value = false }
}
onMounted(async () => {
  matchesStore.fetchAll()
  await load()
})

function triggerPick() {
  fileInput.value?.click()
}

async function onPick(e) {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  if (!configured) {
    toast.error('Cloudinary 설정이 필요합니다.')
    e.target.value = ''
    return
  }
  uploading.value = true
  let ok = 0, fail = 0
  for (const f of files) {
    try {
      const up = await uploadToCloudinary(f, { folder: 'dokkaebi' })
      await createPhoto({
        url: up.url, publicId: up.publicId, width: up.width, height: up.height,
        caption: '', matchId: matchIdForUpload.value || null
      })
      ok++
    } catch (err) { console.error(err); fail++ }
  }
  uploading.value = false
  e.target.value = ''
  await load()
  if (ok) toast.success(`${ok}장 업로드 완료${fail ? ` · ${fail}장 실패` : ''}`)
  else toast.error('업로드 실패')
}

async function remove(p) {
  const ok = await confirm({
    title: '사진 삭제',
    message: '목록에서 삭제할까요? (Cloudinary 원본은 그대로 남습니다)',
    confirmText: '삭제'
  })
  if (!ok) return
  await deletePhoto(p.id)
  photos.value = photos.value.filter((x) => x.id !== p.id)
}

function matchLabel(id) {
  const m = matchesStore.getById(id)
  return m ? `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` : ''
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 gap-2">
      <h1 class="text-xl font-bold text-navy">사진첩</h1>
      <div>
        <BaseButton size="sm" :loading="uploading" :disabled="!configured" @click="triggerPick">
          + 사진 업로드
        </BaseButton>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onPick"
        />
      </div>
    </div>

    <div v-if="!configured" class="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-3 mb-4">
      ⚠ Cloudinary 설정이 필요합니다.<br />
      README "Cloudinary 설정"을 참고해
      <code class="text-xs">VITE_CLOUDINARY_CLOUD_NAME</code> /
      <code class="text-xs">VITE_CLOUDINARY_UPLOAD_PRESET</code>
      을 등록한 뒤 다시 빌드하세요.
    </div>

    <div class="flex flex-wrap gap-2 items-center mb-4 text-xs">
      <label class="text-gray-500">필터:</label>
      <select v-model="filter" class="border rounded-lg px-2 py-1">
        <option value="">전체</option>
        <option v-for="m in matchOptions" :key="m.id" :value="m.id">{{ m.label }}</option>
      </select>
      <span v-if="configured" class="text-gray-400 ml-auto">업로드 시 경기 태그:</span>
      <select v-if="configured" v-model="matchIdForUpload" class="border rounded-lg px-2 py-1">
        <option value="">(없음)</option>
        <option v-for="m in matchOptions" :key="m.id" :value="m.id">{{ m.label }}</option>
      </select>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="visible.length === 0" icon="📷" title="아직 사진이 없습니다" />
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      <div
        v-for="p in visible"
        :key="p.id"
        class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
        @click="lightbox = p"
      >
        <img :src="cldThumb(p.url, 400)" :alt="p.caption" class="w-full h-full object-cover" loading="lazy" />
        <button
          v-if="p.authorUid === auth.user?.uid || auth.isAdmin"
          class="absolute top-1 right-1 bg-black/50 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100"
          @click.stop="remove(p)"
        >×</button>
        <p
          v-if="p.matchId"
          class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] px-2 py-1 truncate"
        >
          {{ matchLabel(p.matchId) }}
        </p>
      </div>
    </div>

    <BaseModal v-model="lightboxOpen" :title="lightbox ? (matchLabel(lightbox.matchId) || '사진') : ''">
      <img v-if="lightbox" :src="lightbox.url" :alt="lightbox.caption" class="w-full rounded" />
      <p v-if="lightbox?.caption" class="text-sm text-gray-600 mt-3">{{ lightbox.caption }}</p>
      <p v-if="lightbox" class="text-xs text-gray-400 mt-2">
        {{ lightbox.authorName }} · {{ fromNow(lightbox.createdAt) }}
      </p>
    </BaseModal>
  </div>
</template>
