<script setup>
import { attackPoints } from '@/utils/stats'

defineProps({
  stats: { type: Object, required: true },
  footer: { type: Boolean, default: true }
})
</script>

<template>
  <div>
    <div class="grid grid-cols-4 gap-2">
      <div class="bg-gray-50 rounded-xl p-3 text-center">
        <p class="text-2xl font-bold text-navy tabular-nums">{{ stats.appearances || 0 }}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">출전</p>
      </div>
      <div class="bg-rose-50 rounded-xl p-3 text-center">
        <p class="text-2xl font-bold text-rose-700 tabular-nums">{{ stats.goals || 0 }}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">골</p>
      </div>
      <div class="bg-sky-50 rounded-xl p-3 text-center">
        <p class="text-2xl font-bold text-sky-700 tabular-nums">{{ stats.assists || 0 }}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">도움</p>
      </div>
      <div class="bg-amber-50 rounded-xl p-3 text-center">
        <p class="text-2xl font-bold text-amber-700 tabular-nums">{{ stats.momCount || 0 }}</p>
        <p class="text-[10px] text-gray-500 mt-0.5">MOM</p>
      </div>
    </div>
    <p v-if="footer" class="text-center text-xs text-gray-500 mt-2">
      공격 포인트 <span class="font-bold text-navy">{{ attackPoints(stats) }}</span>
    </p>
  </div>
</template>
