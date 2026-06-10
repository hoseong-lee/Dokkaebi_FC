<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { useSeasonStore } from '@/stores/season'
import { ytEmbedUrl, ytWatchUrl, ytThumbUrl, formatTime } from '@/utils/youtube'
import { copyToClipboard } from '@/utils/squadShare'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const matchesStore = useMatchesStore()
const seasonStore = useSeasonStore()
const toast = useToast()

const loading = ref(true)
const scope = ref('all') // all | seasonId
const expanded = ref(null) // 클릭한 항목 id (임베드 노출용)

const seasonOptions = computed(() => [
  { id: 'all', label: '전체 시즌' },
  ...seasonStore.list.map((s) => ({ id: s.id, label: s.name }))
])

// 모든 매치 순회 → highlight=true 영상만 flatten
const highlights = computed(() => {
  const out = []
  for (const m of matchesStore.matches) {
    if (scope.value !== 'all' && m.seasonId !== scope.value) continue
    if (!Array.isArray(m.videoUrls)) continue
    m.videoUrls.forEach((v, idx) => {
      if (!v.highlight) return
      out.push({
        id: `${m.id}:${idx}`,
        matchId: m.id,
        opponent: m.opponent,
        date: m.date,
        score: m.score,
        label: v.label || '베스트 골',
        url: v.url,
        start: v.start,
        end: v.end
      })
    })
  }
  return out.sort((a, b) => (b.date || 0) - (a.date || 0))
})

async function load() {
  loading.value = true
  try {
    await Promise.all([
      matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll(),
      seasonStore.ensure()
    ])
  } catch (e) {
    console.error('HighlightsView load failed', e)
  } finally {
    loading.value = false
  }
}
onMounted(load)

function watchLink(h) { return ytWatchUrl(h.url, { start: h.start }) }

async function copyShare(h) {
  const dateStr = h.date ? formatDate(h.date) : ''
  const scoreStr = h.score ? ` (${h.score.dokkaebi ?? '?'}:${h.score.opponent ?? '?'})` : ''
  const rangeStr = h.start != null
    ? ` · ${formatTime(h.start)}${h.end != null ? '~' + formatTime(h.end) : ''}`
    : ''
  const text = [
    `🏅 ${h.label}`,
    `vs ${h.opponent} · ${dateStr}${scoreStr}${rangeStr}`,
    watchLink(h)
  ].filter(Boolean).join('\n')
  try {
    await copyToClipboard(text)
    toast.success('단톡 공유 텍스트를 복사했습니다.')
  } catch (e) {
    toast.error(`복사 실패: ${e?.message || e}`)
  }
}
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100">🏅 베스트 골 모음</h1>
      <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">경기 영상 중 "베스트 골" 라벨 단 클립들만 모아보기</p>
    </div>

    <!-- 시즌 필터 -->
    <select v-model="scope" class="w-full border rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-zinc-800">
      <option v-for="opt in seasonOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
    </select>

    <LoadingSpinner v-if="loading" />

    <EmptyState
      v-else-if="highlights.length === 0"
      icon="🏅"
      title="아직 베스트 골이 없어요"
      :description="'경기 등록·수정 시 영상에 \\🏅 베스트 골 모음에 노출\\ 체크하면 여기 자동으로 나타납니다.'"
    />

    <div v-else class="space-y-3">
      <article
        v-for="h in highlights" :key="h.id"
        class="bg-white dark:bg-zinc-800 rounded-2xl shadow overflow-hidden"
      >
        <!-- 헤더 -->
        <div class="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-zinc-700">
          <span class="text-2xl">🏅</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-navy dark:text-zinc-100 truncate">{{ h.label }}</p>
            <p class="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
              vs {{ h.opponent }} · {{ formatDate(h.date) }}
              <span v-if="h.score">
                · {{ h.score.dokkaebi ?? '?' }}:{{ h.score.opponent ?? '?' }}
              </span>
              <span v-if="h.start != null" class="text-rose-600 font-semibold ml-1">
                ⏱ {{ formatTime(h.start) }}{{ h.end != null ? '~' + formatTime(h.end) : '' }}
              </span>
            </p>
          </div>
        </div>

        <!-- 썸네일 또는 임베드 -->
        <button
          v-if="expanded !== h.id"
          type="button"
          class="block w-full relative aspect-video bg-black overflow-hidden group"
          @click="expanded = h.id"
        >
          <img :src="ytThumbUrl(h.url)" class="w-full h-full object-cover group-hover:opacity-80 transition" alt="" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-white text-6xl drop-shadow-lg">▶</span>
          </div>
        </button>
        <div v-else class="relative aspect-video bg-black">
          <iframe
            :src="ytEmbedUrl(h.url, { start: h.start, end: h.end, autoplay: 1 })"
            class="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>

        <!-- 액션 -->
        <div class="flex gap-2 p-3 bg-gray-50 dark:bg-zinc-900">
          <RouterLink :to="`/matches/${h.matchId}`" class="flex-1 text-center text-xs py-2 rounded-lg bg-navy/10 text-navy dark:text-zinc-100 font-semibold hover:bg-navy/20">
            🏟 경기 상세
          </RouterLink>
          <a :href="watchLink(h)" target="_blank" rel="noopener" class="flex-1 text-center text-xs py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100">
            ▶ YouTube ↗
          </a>
          <button
            type="button"
            class="flex-1 text-xs py-2 rounded-lg bg-yellow-300 text-onyx dark:text-zinc-100 font-bold hover:bg-yellow-400"
            @click="copyShare(h)"
          >💬 단톡 공유
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
