<script setup>
import { computed } from 'vue'

// EPL 스타일 최근 폼 칩 — W/D/L 색 원형, 왼쪽=과거 → 오른쪽=최신 (최신 칩 강조)
const props = defineProps({
  // teamSummary().form — 최신순 배열 ['W','L','D',...]
  form: { type: Array, default: () => [] },
  label: { type: String, default: '최근 5경기' }
})

// 표시용: 과거 → 최신 (EPL 관례)
const chips = computed(() => [...props.form].reverse())

const TONE = {
  W: 'bg-blue-500 text-white',
  D: 'bg-gray-400 dark:bg-zinc-600 text-white',
  L: 'bg-rose-500 text-white'
}
</script>

<template>
  <div v-if="chips.length" class="flex items-center gap-1.5">
    <span class="text-[10px] font-semibold opacity-70 mr-0.5">{{ label }}</span>
    <span
      v-for="(r, i) in chips"
      :key="i"
      class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
      :class="[TONE[r] || 'bg-gray-300 text-white', i === chips.length - 1 ? 'ring-2 ring-gold' : '']"
      :title="i === chips.length - 1 ? '가장 최근 경기' : ''"
    >{{ r }}</span>
  </div>
</template>
