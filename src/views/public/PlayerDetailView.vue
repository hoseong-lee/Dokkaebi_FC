<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { POSITION_LABEL, FOOT_LABEL, seasonStatsOf, attackPoints } from '@/utils/stats'
import { formatDate } from '@/utils/date'
import { playerMonthlySeries } from '@/utils/playerSeries'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import PlayerStatsChart from '@/components/player/PlayerStatsChart.vue'
import PlayerMonthlyChart from '@/components/player/PlayerMonthlyChart.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const store = usePlayersStore()
const seasonStore = useSeasonStore()
const matchesStore = useMatchesStore()

const player = ref(null)
const loading = ref(true)
const scope = ref('total') // total | seasonId

const stats = computed(() => {
  if (!player.value) return null
  return scope.value === 'total'
    ? player.value.stats || {}
    : seasonStatsOf(player.value, scope.value)
})

const series = computed(() => {
  if (!player.value || scope.value === 'total') return []
  return playerMonthlySeries(player.value.id, matchesStore.matches, scope.value)
})

const currentLabel = computed(() => {
  if (scope.value === 'total') return '통산'
  return seasonStore.seasons.find((s) => s.id === scope.value)?.name || scope.value
})

async function load() {
  loading.value = true
  player.value = await store.fetchOne(route.params.id)
  loading.value = false
}

onMounted(async () => {
  await seasonStore.ensure()
  matchesStore.fetchAll()
  // 기본 = 활성 시즌
  if (seasonStore.activeId) scope.value = seasonStore.activeId
  load()
})
watch(() => route.params.id, load)
</script>

<template>
  <LoadingSpinner v-if="loading" label="불러오는 중..." />
  <EmptyState v-else-if="!player" icon="🔍" title="선수를 찾을 수 없습니다" />
  <div v-else class="space-y-4">
    <section class="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
      <PlayerAvatar :player="player" :size="80" />
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-navy">{{ player.name }}</h1>
          <span v-if="player.number != null" class="text-dokkaebi font-bold">#{{ player.number }}</span>
          <span v-if="player.isRegular" class="text-amber-500 text-xs">★</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ player.mainPosition || POSITION_LABEL[player.position] }}<span v-if="player.subPosition"> / {{ player.subPosition }}</span>
          <span v-if="player.preferredFoot"> · {{ FOOT_LABEL[player.preferredFoot] }}</span>
        </p>
        <p v-if="player.joinedAt" class="text-xs text-gray-400 mt-1">
          가입 {{ formatDate(player.joinedAt, 'YYYY.MM.DD') }}
        </p>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center justify-between mb-4 gap-2">
        <h2 class="font-bold text-navy">기록</h2>
        <select v-model="scope" class="border rounded-lg px-3 py-1.5 text-xs bg-white">
          <option value="total">통산</option>
          <option v-for="s in seasonStore.list" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <PlayerStatsChart :stats="stats" />
      <p class="text-center text-sm text-gray-500 mt-4">
        공격 포인트 <span class="font-bold text-navy text-base">{{ attackPoints(stats) }}</span>
      </p>
    </section>

    <section v-if="scope !== 'total'" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">{{ currentLabel }} 월별 추이</h2>
      <PlayerMonthlyChart :series="series" />
    </section>
  </div>
</template>
