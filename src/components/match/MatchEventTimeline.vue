<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: { type: Array, default: () => [] },
  playerMap: { type: Object, default: () => ({}) } // { playerId: name }
})

const sorted = computed(() =>
  [...props.events].sort((a, b) => (a.minute || 0) - (b.minute || 0))
)

const ICON = { goal: '⚽', own_goal: '🥅', yellow: '🟨', red: '🟥' }

function name(id) {
  return props.playerMap[id] || '알 수 없음'
}
</script>

<template>
  <ol v-if="sorted.length" class="space-y-3">
    <li v-for="(ev, i) in sorted" :key="i" class="flex items-start gap-3">
      <span class="text-xs font-mono text-gray-400 dark:text-zinc-500 w-8 text-right pt-0.5">{{ ev.minute }}'</span>
      <span class="text-lg leading-none">{{ ICON[ev.type] || '•' }}</span>
      <div class="text-sm">
        <p class="font-medium text-gray-900">
          {{ name(ev.playerId) }}
          <span v-if="ev.type === 'own_goal'" class="text-dokkaebi text-xs">(자책)</span>
        </p>
        <p v-if="ev.type === 'goal' && ev.assistPlayerId" class="text-xs text-gray-500 dark:text-zinc-400">
          도움 {{ name(ev.assistPlayerId) }}
        </p>
      </div>
    </li>
  </ol>
  <p v-else class="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">기록된 이벤트가 없습니다.</p>
</template>
