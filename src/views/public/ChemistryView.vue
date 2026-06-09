<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { computeChemistry } from '@/utils/chemistry'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()

const loading = ref(true)
const sortBy = ref('winRate') // 'winRate' | 'together' | 'goalSum'
const minTogether = ref(3)
const MIN_OPTIONS = [3, 5, 10]

async function load() {
  loading.value = true
  await Promise.all([
    matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll(),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll()
  ])
  loading.value = false
}
onMounted(load)

const playerById = computed(() => {
  const m = new Map()
  for (const p of playersStore.players || []) m.set(p.id, p)
  return m
})

const pairs = computed(() =>
  computeChemistry(matchesStore.matches, playersStore.players, {
    minTogether: minTogether.value
  })
)

const sortedPairs = computed(() => {
  const arr = [...pairs.value]
  if (sortBy.value === 'together') {
    arr.sort((a, b) => b.together - a.together || b.winRate - a.winRate)
  } else if (sortBy.value === 'goalSum') {
    arr.sort((a, b) => b.goalSum - a.goalSum || b.winRate - a.winRate)
  } else {
    arr.sort((a, b) => b.winRate - a.winRate || b.together - a.together)
  }
  return arr.slice(0, 100)
})

function pct(n) { return `${Math.round((n || 0) * 100)}%` }
function rateTone(rate) {
  if (rate >= 0.7) return 'bg-emerald-500 text-white'
  if (rate >= 0.55) return 'bg-emerald-100 text-emerald-700'
  if (rate <= 0.3) return 'bg-rose-500 text-white'
  if (rate <= 0.45) return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div class="pb-8">
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy flex items-center gap-2">
        <span>🤝</span><span>케미스트리 매트릭스</span>
      </h1>
      <p class="text-xs text-gray-500 mt-1">같이 뛴 페어별 승률·골 시너지 분석 (풋살·자체전 제외)</p>
    </div>

    <!-- 필터 카드 -->
    <div class="bg-white rounded-2xl shadow p-5 mb-4">
      <div class="mb-3">
        <p class="text-xs font-semibold text-gray-500 mb-2">정렬</p>
        <div class="flex gap-2">
          <button
            v-for="opt in [
              { v: 'winRate', l: '승률 순' },
              { v: 'together', l: '같이 뛴 경기 순' },
              { v: 'goalSum', l: '골 합산 순' }
            ]"
            :key="opt.v"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="sortBy === opt.v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-300'"
            @click="sortBy = opt.v"
          >
            {{ opt.l }}
          </button>
        </div>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 mb-2">최소 표본 (같이 뛴 경기)</p>
        <div class="flex gap-2">
          <button
            v-for="n in MIN_OPTIONS"
            :key="n"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="minTogether === n ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-300'"
            @click="minTogether = n"
          >
            {{ n }}경기+
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <EmptyState
        v-if="sortedPairs.length === 0"
        icon="🤝"
        title="표시할 페어가 없습니다"
        description="최소 표본을 낮추거나 경기·라인업 입력 후 다시 확인해보세요."
      />

      <div v-else class="bg-white rounded-2xl shadow p-5">
        <p class="text-xs text-gray-500 mb-3">총 {{ pairs.length }}개 페어 · 상위 {{ sortedPairs.length }}개 표시</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-gray-500 border-b">
                <th class="py-2 pr-2 font-medium">페어</th>
                <th class="py-2 px-2 font-medium text-center">같이 뛴 경기</th>
                <th class="py-2 px-2 font-medium text-center">승률</th>
                <th class="py-2 px-2 font-medium text-center">W/D/L</th>
                <th class="py-2 pl-2 font-medium text-center">골 합산</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in sortedPairs"
                :key="`${row.aId}|${row.bId}`"
                class="border-b last:border-b-0"
              >
                <td class="py-2 pr-2">
                  <div class="flex items-center gap-2">
                    <PlayerAvatar :player="playerById.get(row.aId)" :size="28" />
                    <span class="text-xs text-gray-800 font-medium truncate max-w-[80px]">
                      {{ playerById.get(row.aId)?.name || '?' }}
                    </span>
                    <span class="text-[10px] text-gray-400">+</span>
                    <PlayerAvatar :player="playerById.get(row.bId)" :size="28" />
                    <span class="text-xs text-gray-800 font-medium truncate max-w-[80px]">
                      {{ playerById.get(row.bId)?.name || '?' }}
                    </span>
                  </div>
                </td>
                <td class="py-2 px-2 text-center text-gray-700 font-medium">{{ row.together }}</td>
                <td class="py-2 px-2 text-center">
                  <span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold" :class="rateTone(row.winRate)">
                    {{ pct(row.winRate) }}
                  </span>
                </td>
                <td class="py-2 px-2 text-center text-[11px]">
                  <span class="text-blue-600 font-semibold">{{ row.wins }}</span>
                  <span class="text-gray-400 mx-0.5">/</span>
                  <span class="text-gray-500 font-semibold">{{ row.draws }}</span>
                  <span class="text-gray-400 mx-0.5">/</span>
                  <span class="text-rose-600 font-semibold">{{ row.losses }}</span>
                </td>
                <td class="py-2 pl-2 text-center text-gray-700 font-medium">⚽ {{ row.goalSum }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
