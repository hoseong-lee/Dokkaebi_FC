<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { seasonStatsOf, attackPoints } from '@/utils/stats'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SeasonReviewModal from '@/components/match/SeasonReviewModal.vue'

const players = usePlayersStore()
const seasons = useSeasonStore()
const matchesStore = useMatchesStore()

const reviewOpen = ref(false)
const reviewSeason = ref(null)

function openReview(season) {
  reviewSeason.value = season
  reviewOpen.value = true
}

function pickTop(metric, seasonId) {
  let best = null
  let max = -1
  for (const p of players.players) {
    if (p.active === false) continue
    const s = seasonStatsOf(p, seasonId)
    const v = metric === 'points' ? attackPoints(s) : s[metric] || 0
    if (v > max) { max = v; best = { player: p, value: v } }
  }
  return max > 0 ? best : null
}

// 올해의 선수 — 코드 고정 매핑 (연도 → 선수 이름). DB 의존 없이 항상 표시.
const PLAYER_OF_YEAR = {
  2024: '마진섭',
  2025: '문종일'
}
// 시즌 이름/연도에서 4자리 연도 추출
function seasonYear(season) {
  const m = String(season.name || season.year || '').match(/(20\d{2})/)
  return m ? Number(m[1]) : null
}
function findPlayerByName(name) {
  if (!name) return null
  return players.players.find((p) => (p.name || '').trim() === name.trim()) || null
}
function pickPlayerOfYear(season) {
  const name = PLAYER_OF_YEAR[seasonYear(season)]
  if (!name) return null
  // 선수 데이터가 있으면 아바타·링크까지, 없으면 이름만이라도 표시
  return { player: findPlayerByName(name), name }
}

const seasonAwards = computed(() =>
  seasons.list.map((season) => ({
    season,
    poty: pickPlayerOfYear(season),
    mvp: pickTop('momCount', season.id),
    scorer: pickTop('goals', season.id),
    assister: pickTop('assists', season.id),
    appearance: pickTop('appearances', season.id),
    points: pickTop('points', season.id),
    manner: pickTop('complimentCount', season.id)
  }))
)

// 등록된 시즌이 커버하지 못한 고정 올해의 선수 연도 → 별도 카드
const legacyPoty = computed(() => {
  const coveredYears = new Set(seasons.list.map((s) => seasonYear(s)).filter(Boolean))
  return Object.entries(PLAYER_OF_YEAR)
    .map(([year, name]) => ({ year: Number(year), name, player: findPlayerByName(name) }))
    .filter((e) => !coveredYears.has(e.year))
})

// 등록 시즌 + 고정 POTY 를 연도 기준 내림차순(최신 위) 통합
const timeline = computed(() => {
  const seasonEntries = seasonAwards.value.map((sa) => ({
    id: `season-${sa.season.id}`,
    kind: 'season',
    title: sa.season.name,
    year: seasonYear(sa.season) ?? -1,
    active: !!sa.season.active,
    season: sa.season,
    poty: sa.poty,            // { player, name } | null
    awards: sa               // 자동 6트로피 접근용
  }))
  const legacyEntries = legacyPoty.value.map((e) => ({
    id: `legacy-${e.year}`,
    kind: 'legacy',
    title: `${e.year} 시즌`,
    year: e.year,
    active: false,
    season: null,
    poty: { player: e.player, name: e.name },
    awards: null
  }))
  return [...seasonEntries, ...legacyEntries].sort((a, b) => {
    // 진행중 시즌 최상단, 그 외 연도 내림차순
    if (a.active !== b.active) return a.active ? -1 : 1
    return b.year - a.year
  })
})

// 올해의 선수는 별도 강조 카드, 나머지는 자동 통계 트로피
const trophies = [
  { key: 'mvp', label: '시즌 MVP', icon: '👑', color: 'from-amber-400 to-amber-600' },
  { key: 'scorer', label: '득점왕', icon: '⚽', color: 'from-dokkaebi to-red-700' },
  { key: 'assister', label: '도움왕', icon: '🎯', color: 'from-blue-500 to-navy' },
  { key: 'appearance', label: '출석왕', icon: '🏃', color: 'from-emerald-500 to-emerald-700' },
  { key: 'points', label: '공격 포인트', icon: '⚡', color: 'from-purple-500 to-purple-700' },
  { key: 'manner', label: '매너왕', icon: '💝', color: 'from-pink-500 to-rose-600' }
]

const loading = computed(() => players.loading || (!seasons.loaded))

onMounted(() => {
  seasons.ensure()
  players.fetchAll()
  matchesStore.loaded ? null : matchesStore.fetchAll()
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100">🏆 명예의 전당</h1>
      <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">시즌별 자동 시상 (MOM 투표·통계 기준)</p>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState
      v-else-if="seasonAwards.length === 0 && legacyPoty.length === 0"
      icon="🏆"
      title="아직 시즌이 없습니다"
    />

    <div v-else class="space-y-6">
      <section v-for="entry in timeline" :key="entry.id">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-bold text-navy dark:text-zinc-100">{{ entry.title }}</h2>
          <span v-if="entry.active" class="text-[10px] bg-dokkaebi text-white px-2 py-0.5 rounded-full">진행중</span>
          <button
            v-if="entry.kind === 'season'"
            type="button"
            class="ml-auto text-xs px-3 py-1.5 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600"
            @click="openReview(entry.season)"
          >📸 결산 카드</button>
        </div>

        <!-- 🏆 올해의 선수 — 강조 와이드 카드 (선수 데이터 없어도 이름 표시) -->
        <div
          v-if="entry.poty"
          class="relative overflow-hidden rounded-2xl shadow-lg p-5 mb-3 text-white bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 ring-2 ring-amber-300/60"
        >
          <span class="absolute -right-3 -top-2 text-8xl opacity-20 pointer-events-none">🏆</span>
          <p class="text-[10px] font-bold opacity-90 tracking-[0.3em]">PLAYER OF THE YEAR</p>
          <div class="flex items-center gap-4 mt-2">
            <PlayerAvatar v-if="entry.poty.player" :player="entry.poty.player" :size="64" />
            <div
              v-else
              class="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-2xl font-black shrink-0"
            >{{ entry.poty.name.charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <RouterLink
                v-if="entry.poty.player"
                :to="`/players/${entry.poty.player.id}`"
                class="font-black text-2xl truncate hover:underline block drop-shadow"
              >{{ entry.poty.player.name }}</RouterLink>
              <p v-else class="font-black text-2xl truncate drop-shadow">{{ entry.poty.name }}</p>
              <p class="text-sm font-semibold opacity-90">🏆 올해의 선수</p>
            </div>
          </div>
        </div>

        <!-- 자동 통계 트로피 (등록 시즌만) -->
        <div v-if="entry.awards" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="t in trophies"
            :key="t.key"
            class="relative overflow-hidden rounded-2xl shadow p-4 text-white bg-gradient-to-br"
            :class="t.color"
          >
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ t.icon }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-semibold opacity-80 tracking-[0.2em]">{{ t.label.toUpperCase() }}</p>
                <p class="text-sm font-medium opacity-90">{{ t.label }}</p>
              </div>
            </div>
            <div v-if="entry.awards[t.key]" class="mt-3 flex items-center gap-3">
              <PlayerAvatar :player="entry.awards[t.key].player" :size="48" />
              <div class="flex-1 min-w-0">
                <RouterLink
                  :to="`/players/${entry.awards[t.key].player.id}`"
                  class="font-bold text-lg truncate hover:underline block"
                >
                  {{ entry.awards[t.key].player.name }}
                </RouterLink>
                <p class="text-xs opacity-80">
                  <span class="font-bold text-base">{{ entry.awards[t.key].value }}</span>
                  {{ t.key === 'appearance' ? '경기' : t.key === 'mvp' ? '회' : t.key === 'points' ? 'P' : t.key === 'scorer' ? '골' : t.key === 'manner' ? '점' : '도움' }}
                </p>
              </div>
            </div>
            <p v-else class="mt-3 text-xs opacity-80">아직 수상자가 없습니다</p>
          </div>
        </div>
      </section>
    </div>

    <SeasonReviewModal
      v-model="reviewOpen"
      :players="players.players"
      :matches="matchesStore.matches"
      :season-id="reviewSeason?.id || null"
      :season-name="reviewSeason?.name || ''"
    />
  </div>
</template>
