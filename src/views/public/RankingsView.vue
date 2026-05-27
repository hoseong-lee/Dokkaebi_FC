<script setup>
import { ref, computed, onMounted, toRef } from 'vue'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useRankings } from '@/composables/useRankings'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePlayersStore()
const seasonStore = useSeasonStore()

const tab = ref('goals') // goals | assists | points
const scope = ref('total') // total | season

const playersRef = toRef(store, 'players')
const seasonIdRef = computed(() => seasonStore.activeId)
const { topScorers, topAssists, topPoints } = useRankings(playersRef, seasonIdRef, scope)

const tabs = [
  { key: 'goals', label: '득점왕', unit: '골' },
  { key: 'assists', label: '도움왕', unit: '도움' },
  { key: 'points', label: '공격포인트', unit: 'P' }
]

const current = computed(() => {
  if (tab.value === 'goals') return { rows: topScorers.value, unit: '골' }
  if (tab.value === 'assists') return { rows: topAssists.value, unit: '도움' }
  return { rows: topPoints.value, unit: 'P' }
})

const medal = ['🥇', '🥈', '🥉']

onMounted(async () => {
  await seasonStore.ensure()
  store.fetchAll()
})
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">랭킹</h1>

    <div class="flex items-center justify-between gap-2 mb-4">
      <div class="flex bg-white rounded-xl p-1 shadow-sm flex-1">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="tab === t.key ? 'bg-navy text-white' : 'text-gray-500'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="flex justify-end mb-3">
      <div class="flex bg-gray-100 rounded-lg p-0.5 text-xs">
        <button
          class="px-3 py-1 rounded-md"
          :class="scope === 'total' ? 'bg-white shadow font-semibold' : 'text-gray-500'"
          @click="scope = 'total'"
        >
          통산
        </button>
        <button
          class="px-3 py-1 rounded-md"
          :class="scope === 'season' ? 'bg-white shadow font-semibold' : 'text-gray-500'"
          @click="scope = 'season'"
        >
          {{ seasonStore.activeSeason?.name || '이번 시즌' }}
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="store.loading" label="집계 중..." />
    <EmptyState v-else-if="current.rows.length === 0" icon="🏆" title="아직 기록이 없습니다" />
    <ol v-else class="space-y-2">
      <li
        v-for="(r, i) in current.rows"
        :key="r.player.id"
        class="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3"
        :class="{ 'ring-1 ring-amber-300': i === 0 }"
      >
        <span class="w-7 text-center font-bold text-gray-400">
          {{ medal[i] || i + 1 }}
        </span>
        <PlayerAvatar :player="r.player" :size="40" />
        <RouterLink :to="`/players/${r.player.id}`" class="flex-1 font-semibold truncate hover:underline">
          {{ r.player.name }}
        </RouterLink>
        <span class="text-lg font-bold text-navy tabular-nums">{{ r.value }}</span>
        <span class="text-xs text-gray-400">{{ current.unit }}</span>
      </li>
    </ol>
  </div>
</template>
