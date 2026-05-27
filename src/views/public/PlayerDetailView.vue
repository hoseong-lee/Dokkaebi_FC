<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { POSITION_LABEL, FOOT_LABEL, seasonStatsOf, attackPoints } from '@/utils/stats'
import { formatDate } from '@/utils/date'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import PlayerStatsChart from '@/components/player/PlayerStatsChart.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const store = usePlayersStore()
const seasonStore = useSeasonStore()

const player = ref(null)
const loading = ref(true)
const scope = ref('total') // total | season

const stats = computed(() => {
  if (!player.value) return null
  return scope.value === 'season'
    ? seasonStatsOf(player.value, seasonStore.activeId)
    : player.value.stats || {}
})

async function load() {
  loading.value = true
  player.value = await store.fetchOne(route.params.id)
  loading.value = false
}

onMounted(async () => {
  await seasonStore.ensure()
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
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ POSITION_LABEL[player.position] || player.position }}
          <span v-if="player.preferredFoot"> · {{ FOOT_LABEL[player.preferredFoot] }}</span>
        </p>
        <p v-if="player.joinedAt" class="text-xs text-gray-400 mt-1">
          가입 {{ formatDate(player.joinedAt, 'YYYY.MM.DD') }}
        </p>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-navy">기록</h2>
        <div class="flex bg-gray-100 rounded-lg p-0.5 text-xs">
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="scope === 'total' ? 'bg-white shadow font-semibold' : 'text-gray-500'"
            @click="scope = 'total'"
          >
            통산
          </button>
          <button
            class="px-3 py-1 rounded-md transition-colors"
            :class="scope === 'season' ? 'bg-white shadow font-semibold' : 'text-gray-500'"
            @click="scope = 'season'"
          >
            {{ seasonStore.activeSeason?.name || '이번 시즌' }}
          </button>
        </div>
      </div>

      <PlayerStatsChart :stats="stats" />
      <p class="text-center text-sm text-gray-500 mt-4">
        공격 포인트 <span class="font-bold text-navy text-base">{{ attackPoints(stats) }}</span>
      </p>
    </section>
  </div>
</template>
