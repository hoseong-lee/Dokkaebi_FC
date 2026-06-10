<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, required: true }
})

const rows = computed(() => [
  { key: 'appearances', label: '출전', value: props.stats.appearances || 0, color: 'bg-gray-400' },
  { key: 'goals', label: '골', value: props.stats.goals || 0, color: 'bg-dokkaebi' },
  { key: 'assists', label: '도움', value: props.stats.assists || 0, color: 'bg-navy' },
  { key: 'momCount', label: 'MOM', value: props.stats.momCount || 0, color: 'bg-amber-500' }
])

const max = computed(() => Math.max(1, ...rows.value.map((r) => r.value)))
</script>

<template>
  <div class="space-y-2">
    <div v-for="r in rows" :key="r.key" class="flex items-center gap-3">
      <span class="w-10 text-xs text-gray-500 dark:text-zinc-400 shrink-0">{{ r.label }}</span>
      <div class="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-full h-5 overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="r.color"
          :style="{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? '1.5rem' : '0' }"
        />
      </div>
      <span class="w-8 text-right text-sm font-bold text-gray-800 dark:text-zinc-200">{{ r.value }}</span>
    </div>
  </div>
</template>
