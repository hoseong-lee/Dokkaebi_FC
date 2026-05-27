<script setup>
import { computed } from 'vue'

const props = defineProps({
  player: { type: Object, default: null },
  size: { type: Number, default: 48 }
})

const initial = computed(() => (props.player?.name || '?').trim().charAt(0))
const style = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
</script>

<template>
  <div
    class="rounded-full bg-navy/10 text-navy flex items-center justify-center overflow-hidden shrink-0 font-bold"
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
