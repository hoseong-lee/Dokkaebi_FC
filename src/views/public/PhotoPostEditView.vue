<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { useAuthStore } from '@/stores/auth'
import {
  getPhotoPost, createPhotoPost, updatePhotoPost
} from '@/firebase/database'
import { uploadToCloudinary, isCloudinaryConfigured, cldThumb } from '@/utils/cloudinary'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const matchesStore = useMatchesStore()
const auth = useAuthStore()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const configured = isCloudinaryConfigured()

const form = reactive({
  title: '',
  body: '',
  tagInput: '',
  matchId: '',
  images: [] // [{url, publicId, width, height}]
})

const tags = computed(() =>
  form.tagInput
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean)
)

const matchOptions = computed(() =>
  [...matchesStore.matches]
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .map((m) => ({ id: m.id, label: `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` }))
)

async function load() {
  await matchesStore.fetchAll()
  if (!isEdit.value) return
  loading.value = true
  const p = await getPhotoPost(route.params.id)
  loading.value = false
  if (!p) { toast.error('글을 찾을 수 없습니다.'); return router.replace('/photos') }
  if (p.authorUid !== auth.user?.uid && !auth.isAdmin) {
    toast.error('수정 권한이 없습니다.')
    return router.replace(`/photos/${p.id}`)
  }
  form.title = p.title || ''
  form.body = p.body || ''
  form.tagInput = (p.tags || []).map((t) => '#' + t).join(' ')
  form.matchId = p.matchId || ''
  form.images = (p.imageUrls || []).map((url, i) => ({
    url, publicId: p.imagePublicIds?.[i] || null
  }))
}

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
  for (const f of files) {
    try {
      const up = await uploadToCloudinary(f, { folder: 'dokkaebi/posts' })
      form.images.push(up)
    } catch (err) {
      console.error(err)
      toast.error(`업로드 실패: ${err.message || err}`)
    }
  }
  uploading.value = false
  e.target.value = ''
}

function removeImage(i) {
  form.images.splice(i, 1)
}

async function save() {
  if (!form.title.trim() && !form.body.trim() && form.images.length === 0) {
    return toast.error('제목·본문·사진 중 하나는 입력해야 합니다.')
  }
  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      tags: tags.value,
      matchId: form.matchId || null,
      imageUrls: form.images.map((i) => i.url),
      imagePublicIds: form.images.map((i) => i.publicId || null)
    }
    let id = route.params.id
    if (id) await updatePhotoPost(id, payload)
    else id = await createPhotoPost(payload)
    toast.success(isEdit.value ? '글을 수정했습니다.' : '글을 게시했습니다.')
    router.push(`/photos/${id}`)
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">{{ isEdit ? '글 수정' : '글쓰기' }}</h1>
    <LoadingSpinner v-if="loading" />
    <form v-else class="bg-white rounded-2xl shadow p-5 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-xs text-gray-500 mb-1">제목</label>
        <input v-model="form.title" type="text" placeholder="제목" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">본문</label>
        <textarea
          v-model="form.body"
          rows="5"
          placeholder="내용을 작성하세요"
          class="w-full border rounded-lg px-3 py-2 text-sm"
        ></textarea>
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">태그 (공백 또는 콤마로 구분)</label>
        <input
          v-model="form.tagInput"
          type="text"
          placeholder="#국대FC #초안산 #대승"
          class="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <div v-if="tags.length" class="flex flex-wrap gap-1 mt-2">
          <span v-for="t in tags" :key="t" class="text-[10px] text-navy bg-navy/5 px-1.5 py-0.5 rounded">
            #{{ t }}
          </span>
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">관련 경기 (선택)</label>
        <select v-model="form.matchId" class="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">(없음)</option>
          <option v-for="m in matchOptions" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-500">사진 ({{ form.images.length }})</label>
          <BaseButton
            type="button" size="sm" variant="secondary"
            :loading="uploading" :disabled="!configured"
            @click="triggerPick"
          >+ 사진 추가</BaseButton>
          <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onPick" />
        </div>
        <div v-if="!configured" class="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          ⚠ Cloudinary 설정이 필요합니다.
        </div>
        <div v-if="form.images.length" class="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          <div v-for="(img, i) in form.images" :key="img.url" class="relative aspect-square rounded overflow-hidden bg-gray-100 group">
            <img :src="cldThumb(img.url, 300)" alt="" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full opacity-0 group-hover:opacity-100"
              @click="removeImage(i)"
            >×</button>
          </div>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <BaseButton type="button" variant="secondary" block @click="router.back()">취소</BaseButton>
        <BaseButton type="submit" :loading="saving" block>{{ isEdit ? '수정' : '게시' }}</BaseButton>
      </div>
    </form>
  </div>
</template>
