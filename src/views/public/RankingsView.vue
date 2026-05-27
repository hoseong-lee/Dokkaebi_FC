<script setup>
import { ref, computed, onMounted, toRef } from 'vue'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { useRankings } from '@/composables/useRankings'
import { teamSummary, headToHead } from '@/utils/teamStats'
import { RESULT_LABEL, RESULT_COLOR } from '@/utils/match'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePlayersStore()
const seasonStore = useSeasonStore()
const matchesStore = useMatchesStore()

const tab = ref('goals')
const scope = ref('total')

const playersRef = toRef(store, 'players')
const seasonIdRef = computed(() => seasonStore.activeId)
const { topScorers, topAssists, topPoints, topAppearances, topMom } = useRankings(
  playersRef,
  seasonIdRef,
  scope
)

const tabs = [
  { key: 'goals', label: '득점', unit: '골' },
  { key: 'assists', label: '도움', unit: '도움' },
  { key: 'points', label: '공격P', unit: 'P' },
  { key: 'appearances', label: '출석', unit: '경기' },
  { key: 'mom', label: 'MOM', unit: '회' }
]

const current = computed(() => {
  const map = {
    goals: { rows: topScorers.value, unit: '골' },
    assists: { rows: topAssists.value, unit: '도움' },
    points: { rows: topPoints.value, unit: 'P' },
    appearances: { rows: topAppearances.value, unit: '경기' },
    mom: { rows: topMom.value, unit: '회' }
  }
  return map[tab.value]
})

const summary = computed(() => teamSummary(matchesStore.matches))
const h2h = computed(() => headToHead(matchesStore.matches))
const medal = ['🥇', '🥈', '🥉']

onMounted(async () => {
  await seasonStore.ensure()
  store.fetchAll()
  matchesStore.fetchAll()
})
</script>

<template>
  <div class="space-y-5">
    <h1 class="text-xl font-bold text-navy">랭킹 · 기록</h1>

    <!-- 팀 전적 요약 -->
    <section v-if="summary.played" class="bg-gradient-to-br from-navy to-navy/80 text-white rounded-2xl shadow p-5">
      <div class="flex items-center justify-between">
        <h2 class="font-bold">시즌 전적</h2>
        <span class="text-sm text-white/70">{{ summary.played }}경기</span>
      </div>
      <div class="flex items-end gap-4 mt-3">
        <p class="text-2xl font-bold">
          {{ summary.win }}<span class="text-sm font-normal text-white/70">승 </span>{{ summary.draw }}<span class="text-sm font-normal text-white/70">무 </span>{{ summary.loss }}<span class="text-sm font-normal text-white/70">패</span>
        </p>
        <div class="ml-auto text-right">
          <p class="text-2xl font-bold">{{ summary.winRate }}%</p>
          <p class="text-xs text-white/70">승률</p>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-3 text-sm text-white/80">
        <span>득점 {{ summary.gf }}</span>
        <span>실점 {{ summary.ga }}</span>
        <span>득실 {{ summary.diff > 0 ? '+' : '' }}{{ summary.diff }}</span>
        <span class="ml-auto flex gap-1">
          <span
            v-for="(r, i) in summary.form"
            :key="i"
            class="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            :class="RESULT_COLOR[r]"
          >
            {{ RESULT_LABEL[r] }}
          </span>
        </span>
      </div>
    </section>

    <!-- 선수 랭킹 -->
    <section>
      <div class="flex bg-white rounded-xl p-1 shadow-sm mb-3 overflow-x-auto">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="flex-1 min-w-[56px] py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          :class="tab === t.key ? 'bg-navy text-white' : 'text-gray-500'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
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
          <span class="w-7 text-center font-bold text-gray-400">{{ medal[i] || i + 1 }}</span>
          <PlayerAvatar :player="r.player" :size="40" />
          <RouterLink :to="`/players/${r.player.id}`" class="flex-1 font-semibold truncate hover:underline">
            {{ r.player.name }}
          </RouterLink>
          <span class="text-lg font-bold text-navy tabular-nums">{{ r.value }}</span>
          <span class="text-xs text-gray-400">{{ current.unit }}</span>
        </li>
      </ol>
    </section>

    <!-- 상대 전적 -->
    <section v-if="h2h.length">
      <h2 class="font-bold text-navy mb-2">상대 전적</h2>
      <div class="bg-white rounded-xl shadow-sm divide-y">
        <div v-for="h in h2h" :key="h.opponent" class="flex items-center gap-3 p-3 text-sm">
          <span class="flex-1 font-medium truncate">{{ h.opponent }}</span>
          <span class="text-xs text-gray-500">{{ h.win }}승 {{ h.draw }}무 {{ h.loss }}패</span>
          <span class="text-xs text-gray-400 tabular-nums">{{ h.gf }}-{{ h.ga }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
