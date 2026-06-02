<script setup>
import { computed } from 'vue'
import { POSITION_CATEGORY } from '@/utils/positions'

const props = defineProps({
  player: { type: Object, default: null },
  size: { type: Number, default: 48 }
})

const initial = computed(() => (props.player?.name || '?').trim().charAt(0))
const style = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))

// 포지션 카테고리 → fallback 배경/글자 색 (사진 없을 때만 적용)
// mainPosition 우선, 없으면 subPosition, 그것도 없으면 기존 navy/10
const FALLBACK_TONE = {
  GK: 'bg-amber-400 text-white',
  DF: 'bg-sky-500 text-white',
  MF: 'bg-emerald-500 text-white',
  FW: 'bg-rose-500 text-white'
}
const fallbackClass = computed(() => {
  const p = props.player
  if (!p) return 'bg-navy/10 text-navy'
  const code = p.mainPosition || p.subPosition
  const cat = code ? POSITION_CATEGORY[code] : null
  return FALLBACK_TONE[cat] || 'bg-navy/10 text-navy'
})
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold"
    :class="player?.photoURL ? 'bg-gray-100' : fallbackClass"
    :style="style"
  >
    <img
      v-if="player?.photoURL"
      :src="player.photoURL"
      :alt="player.name"
      class="w-full h-full object-cover"
      referrerpolicy="no-referrer"
    />
    <span v-else :style="{ fontSize: `${size * 0.4}px` }">{{ initial }}</span>
  </div>
</template>
