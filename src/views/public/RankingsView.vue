<script setup>
import { ref, computed, onMounted, toRef } from 'vue'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { useRankings } from '@/composables/useRankings'
import { teamSummary, headToHead } from '@/utils/teamStats'
import { pickBestEleven } from '@/utils/bestEleven'
import { bestDuos } from '@/utils/duos'
import { RESULT_LABEL, RESULT_COLOR, h2hTier, TIER_LABEL, TIER_COLOR } from '@/utils/match'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import FormationPitch from '@/components/match/FormationPitch.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePlayersStore()
const seasonStore = useSeasonStore()
const matchesStore = useMatchesStore()

const tab = ref('goals')
// scope: 'total' | seasonId
const scope = ref('total')

const playersRef = toRef(store, 'players')
const seasonRef = computed(() => (scope.value === 'total' ? null : scope.value))
const { topScorers, topAssists, topPoints, topAppearances, topMom } = useRankings(
  playersRef,
  seasonRef
)

// 올해의 선수: 선택된 시즌의 MOM 1위 (없으면 공격포인트 1위로 폴백)
const playerOfSeason = computed(() => {
  if (scope.value === 'total') return null
  return topMom.value[0]?.player || topPoints.value[0]?.player || null
})
const currentSeasonName = computed(() => {
  if (scope.value === 'total') return '통산'
  return seasonStore.seasons.find((s) => s.id === scope.value)?.name || scope.value
})

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
const bestEleven = computed(() =>
  scope.value === 'total' ? null : pickBestEleven(store.players, scope.value)
)
const duos = computed(() =>
  bestDuos(matchesStore.matches, scope.value === 'total' ? null : scope.value).slice(0, 10)
)
function playerName(id) {
  return store.getById(id)?.name || '?'
}
const medal = ['🥇', '🥈', '🥉']

onMounted(async () => {
  await seasonStore.ensure()
  // 기본 보기를 활성 시즌으로 맞춰 홈의 TOP3 와 일관성 유지
  if (seasonStore.activeId) scope.value = seasonStore.activeId
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

    <!-- 시즌 베스트 11 -->
    <section v-if="bestEleven" class="bg-white rounded-2xl shadow p-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-navy">🏆 시즌 베스트 11</h2>
        <span class="text-sm font-bold text-dokkaebi">{{ bestEleven.formation }}</span>
      </div>
      <FormationPitch
        :formation="bestEleven.formation"
        :positions="bestEleven.positions"
        :players="store.players"
      />
      <p class="text-[11px] text-gray-400 mt-2">
        가중치: 골×3 + 어시×2 + MOM×5 + 출석×0.5 (포지션별 자동 배치)
      </p>
    </section>

    <!-- 올해의 선수 (시즌 선택 시) -->
    <section
      v-if="playerOfSeason"
      class="bg-gradient-to-br from-gold/90 to-gold/70 text-onyx rounded-2xl shadow p-5 flex items-center gap-4"
    >
      <div class="text-3xl">🏅</div>
      <div class="flex-1">
        <p class="text-[10px] font-semibold tracking-[0.3em] opacity-70">PLAYER OF THE SEASON</p>
        <p class="text-xs opacity-80">{{ currentSeasonName }}</p>
        <RouterLink :to="`/players/${playerOfSeason.id}`" class="text-xl font-bold hover:underline">
          {{ playerOfSeason.name }}
        </RouterLink>
        <p class="text-xs mt-0.5 opacity-80">
          {{ topMom[0]?.value || 0 }} MOM · {{ topPoints[0]?.player?.id === playerOfSeason.id ? topPoints[0].value : '' }}{{ topPoints[0]?.player?.id === playerOfSeason.id ? 'P' : '' }}
        </p>
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
        <select
          v-model="scope"
          class="border rounded-lg px-3 py-1.5 text-xs bg-white"
        >
          <option value="total">통산</option>
          <option v-for="s in seasonStore.list" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
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

    <!-- 베스트 콤비 -->
    <section v-if="duos.length">
      <h2 class="font-bold text-navy mb-2">⭐ 베스트 콤비 (어시 → 골)</h2>
      <ol class="bg-white rounded-xl shadow-sm divide-y">
        <li v-for="(d, i) in duos" :key="i" class="flex items-center gap-3 p-3 text-sm">
          <span class="w-6 text-center text-xs font-bold text-gray-400">{{ i + 1 }}</span>
          <RouterLink :to="`/players/${d.assister}`" class="font-medium hover:underline">
            {{ playerName(d.assister) }}
          </RouterLink>
          <span class="text-gray-400">→</span>
          <RouterLink :to="`/players/${d.scorer}`" class="flex-1 font-medium hover:underline">
            {{ playerName(d.scorer) }}
          </RouterLink>
          <span class="text-lg font-bold text-navy tabular-nums">{{ d.count }}</span>
          <span class="text-xs text-gray-400">회</span>
        </li>
      </ol>
    </section>

    <!-- 상대 전적 -->
    <section v-if="h2h.length">
      <h2 class="font-bold text-navy mb-2">상대 전적</h2>
      <div class="bg-white rounded-xl shadow-sm divide-y">
        <div
          v-for="h in h2h"
          :key="h.opponent"
          class="flex items-center gap-3 p-3 text-sm"
        >
          <span class="flex-1 font-medium truncate">{{ h.opponent }}</span>
          <span
            v-if="h2hTier(h)"
            class="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            :class="TIER_COLOR[h2hTier(h)]"
          >{{ TIER_LABEL[h2hTier(h)] }}</span>
          <span class="text-xs text-gray-500">{{ h.win }}승 {{ h.draw }}무 {{ h.loss }}패</span>
          <span class="text-xs text-gray-400 tabular-nums">{{ h.gf }}-{{ h.ga }}</span>
        </div>
      </div>
      <p class="text-[11px] text-gray-400 mt-2">
        🟢 우세(승률 ≥ 60%) · ⚪ 백중 · 🔴 약세 (2경기 이상)
      </p>
    </section>
  </div>
</template>
