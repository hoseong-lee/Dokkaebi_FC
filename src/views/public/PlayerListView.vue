<script setup>
import { ref, computed, onMounted } from 'vue'
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

onMounted(async () => { await store.fetchAll() })
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
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <PlayerCard v-for="p in visible" :key="p.id" :player="p" />
    </div>
  </div>
</template>
