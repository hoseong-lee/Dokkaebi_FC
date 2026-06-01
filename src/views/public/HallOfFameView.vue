<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { seasonStatsOf, attackPoints } from '@/utils/stats'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const players = usePlayersStore()
const seasons = useSeasonStore()

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

const seasonAwards = computed(() =>
  seasons.list.map((season) => ({
    season,
    mvp: pickTop('momCount', season.id),
    scorer: pickTop('goals', season.id),
    assister: pickTop('assists', season.id),
    appearance: pickTop('appearances', season.id),
    points: pickTop('points', season.id),
    manner: pickTop('complimentCount', season.id)
  }))
)

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
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy">🏆 명예의 전당</h1>
      <p class="text-xs text-gray-500 mt-1">시즌별 자동 시상 (MOM 투표·통계 기준)</p>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState
      v-else-if="seasonAwards.length === 0"
      icon="🏆"
      title="아직 시즌이 없습니다"
    />

    <div v-else class="space-y-6">
      <section v-for="sa in seasonAwards" :key="sa.season.id">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-bold text-navy">{{ sa.season.name }}</h2>
          <span v-if="sa.season.active" class="text-[10px] bg-dokkaebi text-white px-2 py-0.5 rounded-full">진행중</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div v-if="sa[t.key]" class="mt-3 flex items-center gap-3">
              <PlayerAvatar :player="sa[t.key].player" :size="48" />
              <div class="flex-1 min-w-0">
                <RouterLink
                  :to="`/players/${sa[t.key].player.id}`"
                  class="font-bold text-lg truncate hover:underline block"
                >
                  {{ sa[t.key].player.name }}
                </RouterLink>
                <p class="text-xs opacity-80">
                  <span class="font-bold text-base">{{ sa[t.key].value }}</span>
                  {{ t.key === 'appearance' ? '경기' : t.key === 'mvp' ? '회' : t.key === 'points' ? 'P' : t.key === 'scorer' ? '골' : t.key === 'manner' ? '점' : '도움' }}
                </p>
              </div>
            </div>
            <p v-else class="mt-3 text-xs opacity-80">아직 수상자가 없습니다</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
