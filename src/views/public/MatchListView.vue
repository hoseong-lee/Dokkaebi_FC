<script setup>
import { ref, computed, onMounted } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import { useMatchesStore } from '@/stores/matches'
import { teamSummary } from '@/utils/teamStats'
import MatchCard from '@/components/match/MatchCard.vue'
import FormGuideChips from '@/components/match/FormGuideChips.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useMatchesStore()
const tab = ref('upcoming') // upcoming | finished

const list = computed(() => (tab.value === 'upcoming' ? store.upcoming : store.finished))
const teamForm = computed(() => teamSummary(store.matches).form)

// MatchCard: p-4 + 3 row + mt-2 + space-y-3 (12px) → 약 112px
const ITEM_HEIGHT = 112

onMounted(async () => { await store.fetchAll() })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100">경기</h1>
      <FormGuideChips :form="teamForm" class="text-gray-500 dark:text-zinc-400" />
    </div>

    <div class="flex bg-white dark:bg-zinc-800 rounded-xl p-1 mb-4 shadow-sm">
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'upcoming' ? 'bg-navy text-white' : 'text-gray-500 dark:text-zinc-400'"
        @click="tab = 'upcoming'"
      >
        예정 ({{ store.upcoming.length }})
      </button>
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'finished' ? 'bg-navy text-white' : 'text-gray-500 dark:text-zinc-400'"
        @click="tab = 'finished'"
      >
        완료 ({{ store.finished.length }})
      </button>
    </div>

    <LoadingSpinner v-if="store.loading" label="경기 불러오는 중..." />
    <EmptyState
      v-else-if="list.length === 0"
      icon="📅"
      :title="tab === 'upcoming' ? '예정된 경기가 없습니다' : '완료된 경기가 없습니다'"
    />
    <RecycleScroller
      v-else
      class="match-scroller"
      :items="list"
      :item-size="ITEM_HEIGHT"
      key-field="id"
      page-mode
      v-slot="{ item }"
    >
      <div class="pb-3">
        <MatchCard :match="item" />
      </div>
    </RecycleScroller>
  </div>
</template>

<style scoped>
.match-scroller {
  min-height: 200px;
}
</style>
