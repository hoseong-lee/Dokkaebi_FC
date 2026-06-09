<script setup>
import { ref, computed, onMounted } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import { usePlayersStore } from '@/stores/players'
import { POSITION_ORDER, POSITION_LABEL, POSITION_BADGE, POSITION_BADGE_STRONG } from '@/utils/stats'
import PlayerCard from '@/components/player/PlayerCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePlayersStore()
const filter = ref('ALL')

const filters = ['ALL', ...POSITION_ORDER]
function label(f) {
  return f === 'ALL' ? '전체' : POSITION_LABEL[f]
}

const visible = computed(() => {
  const list = store.sortedByPosition()
  if (filter.value === 'ALL') return list
  return list.filter((p) => p.position === filter.value)
})

// PlayerCard: p-3 + avatar 48 + gap-2 (8px) → row 약 80px
const ITEM_HEIGHT = 80
// sm breakpoint(640px) 이상 2열, 미만 1열 — window 너비 기반 반응형
const gridColumns = ref(1)
function syncGridColumns() {
  gridColumns.value = window.innerWidth >= 640 ? 2 : 1
}

onMounted(async () => {
  syncGridColumns()
  window.addEventListener('resize', syncGridColumns)
  await store.fetchAll()
})
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">선수 명단</h1>

    <div class="flex gap-1.5 mb-4 overflow-x-auto pb-1">
      <button
        v-for="f in filters"
        :key="f"
        class="px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-semibold transition-colors"
        :class="
          f === 'ALL'
            ? (filter === f ? 'bg-navy text-white' : 'bg-white text-gray-600 hover:bg-gray-100')
            : (filter === f ? POSITION_BADGE_STRONG[f] : POSITION_BADGE[f] + ' hover:opacity-80')
        "
        @click="filter = f"
      >
        {{ label(f) }}
      </button>
    </div>

    <LoadingSpinner v-if="store.loading" label="선수 불러오는 중..." />
    <EmptyState
      v-else-if="visible.length === 0"
      icon="👥"
      title="등록된 선수가 없습니다"
      description="관리자가 선수를 등록하면 이곳에 표시됩니다."
    />
    <RecycleScroller
      v-else
      class="player-scroller"
      :items="visible"
      :item-size="ITEM_HEIGHT"
      :grid-items="gridColumns"
      key-field="id"
      page-mode
      v-slot="{ item }"
    >
      <div class="px-1 pb-2">
        <PlayerCard :player="item" />
      </div>
    </RecycleScroller>
  </div>
</template>

<style scoped>
.player-scroller {
  min-height: 200px;
}
</style>
