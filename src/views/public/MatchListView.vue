<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import MatchCard from '@/components/match/MatchCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useMatchesStore()
const tab = ref('upcoming') // upcoming | finished

const list = computed(() => (tab.value === 'upcoming' ? store.upcoming : store.finished))

onMounted(() => store.fetchAll())
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">경기</h1>

    <div class="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'upcoming' ? 'bg-navy text-white' : 'text-gray-500'"
        @click="tab = 'upcoming'"
      >
        예정 ({{ store.upcoming.length }})
      </button>
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'finished' ? 'bg-navy text-white' : 'text-gray-500'"
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
    <div v-else class="space-y-3">
      <MatchCard v-for="m in list" :key="m.id" :match="m" />
    </div>
  </div>
</template>
