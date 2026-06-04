<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { listPhotoPosts } from '@/firebase/database'
import { cldThumb } from '@/utils/cloudinary'
import { fromNow, formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const matchesStore = useMatchesStore()
const toast = useToast()
const posts = ref([])
const loading = ref(true)
const tagFilter = ref('')
const matchFilter = ref('')

const matchOptions = computed(() =>
  [...matchesStore.matches]
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .map((m) => ({ id: m.id, label: `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` }))
)

const allTags = computed(() => {
  const set = new Set()
  for (const p of posts.value) (p.tags || []).forEach((t) => set.add(t))
  return [...set].sort()
})

const visible = computed(() => {
  return posts.value.filter((p) => {
    if (matchFilter.value && p.matchId !== matchFilter.value) return false
    if (tagFilter.value && !(p.tags || []).includes(tagFilter.value)) return false
    return true
  })
})

async function load() {
  loading.value = true
  try {
    posts.value = await listPhotoPosts()
  } catch (e) {
    toast.error(`사진 불러오기 실패: ${e?.message || e}`)
    posts.value = []
  } finally {
    loading.value = false
  }
}

function matchLabel(id) {
  const m = matchesStore.getById(id)
  return m ? `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` : ''
}

function likeCount(p) {
  return p.likes ? Object.keys(p.likes).length : 0
}
function commentCount(p) {
  return p.comments ? Object.keys(p.comments).length : 0
}

onMounted(async () => {
  // 두 호출 병렬 (matchesStore 에 loaded 가드 있어 중복 안전)
  await Promise.all([matchesStore.fetchAll(), load()])
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 gap-2">
      <h1 class="text-xl font-bold text-navy">📷 사진첩</h1>
      <RouterLink to="/photos/new">
        <BaseButton size="sm">+ 글쓰기</BaseButton>
      </RouterLink>
    </div>

    <!-- 필터 -->
    <div class="bg-white rounded-xl shadow-sm p-3 mb-4 space-y-2">
      <div class="flex flex-wrap gap-1.5 items-center">
        <span class="text-[11px] text-gray-500">태그</span>
        <button
          class="text-xs px-2.5 py-1 rounded-full"
          :class="!tagFilter ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'"
          @click="tagFilter = ''"
        >전체</button>
        <button
          v-for="t in allTags"
          :key="t"
          class="text-xs px-2.5 py-1 rounded-full"
          :class="tagFilter === t ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          @click="tagFilter = (tagFilter === t ? '' : t)"
        >#{{ t }}</button>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="text-gray-500">경기</span>
        <select v-model="matchFilter" class="border rounded-lg px-2 py-1 flex-1">
          <option value="">전체</option>
          <option v-for="m in matchOptions" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState
      v-else-if="visible.length === 0"
      icon="📷"
      :title="posts.length === 0 ? '아직 게시물이 없습니다' : '조건에 맞는 게시물이 없습니다'"
    >
      <RouterLink v-if="posts.length === 0" to="/photos/new">
        <BaseButton size="sm">첫 게시물 올리기</BaseButton>
      </RouterLink>
    </EmptyState>

    <ul v-else class="space-y-4">
      <li v-for="p in visible" :key="p.id" class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <RouterLink :to="`/photos/${p.id}`" class="block">
          <div class="p-4 pb-2">
            <p class="text-xs text-gray-400">
              {{ p.authorName }} · {{ fromNow(p.createdAt) }}
              <span v-if="p.matchId" class="ml-1 text-navy">· {{ matchLabel(p.matchId) }}</span>
            </p>
            <h2 class="font-bold text-navy mt-0.5">{{ p.title || '(제목 없음)' }}</h2>
          </div>

          <!-- 첫 이미지(있으면) -->
          <div v-if="p.imageUrls?.length" class="relative bg-gray-100">
            <img
              :src="cldThumb(p.imageUrls[0], 800)"
              :alt="p.title"
              class="w-full aspect-[4/3] object-cover"
              loading="lazy"
            />
            <span
              v-if="p.imageUrls.length > 1"
              class="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full"
            >+{{ p.imageUrls.length - 1 }}</span>
          </div>

          <div class="p-4 pt-3">
            <p v-if="p.body" class="text-sm text-gray-700 line-clamp-2">{{ p.body }}</p>
            <div v-if="p.tags?.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="t in p.tags"
                :key="t"
                class="text-[10px] text-navy bg-navy/5 px-1.5 py-0.5 rounded"
              >#{{ t }}</span>
            </div>
            <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>❤️ {{ likeCount(p) }}</span>
              <span>💬 {{ commentCount(p) }}</span>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
