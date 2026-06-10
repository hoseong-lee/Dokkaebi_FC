<script setup>
import { computed } from 'vue'
import { getSlots } from '@/utils/formations'

const props = defineProps({
  formation: { type: String, default: '' },
  positions: { type: Object, default: () => ({}) }, // { slotId: playerId }
  players: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false }
})
const emit = defineEmits(['slot-click'])

const slots = computed(() => getSlots(props.formation))

function playerOf(slotId) {
  const pid = props.positions?.[slotId]
  if (!pid) return null
  return props.players.find((p) => p.id === pid) || null
}

const roleColor = {
  GK: 'bg-amber-400 text-amber-900',
  DF: 'bg-sky-500 text-white',
  MF: 'bg-emerald-500 text-white',
  FW: 'bg-dokkaebi text-white'
}
</script>

<template>
  <div
    class="relative w-full max-w-sm mx-auto aspect-[2/3] rounded-xl overflow-hidden select-none"
    style="background: linear-gradient(0deg, #15803d 0%, #16a34a 50%, #15803d 100%)"
  >
    <!-- 필드 라인 -->
    <div class="absolute inset-2 border-2 border-white/40 rounded"></div>
    <div class="absolute left-2 right-2 top-1/2 h-0 border-t-2 border-white/40"></div>
    <div class="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-white/40 rounded-full"></div>
    <div class="absolute left-1/2 -translate-x-1/2 bottom-2 w-28 h-14 border-2 border-white/40 border-b-0"></div>
    <div class="absolute left-1/2 -translate-x-1/2 top-2 w-28 h-14 border-2 border-white/40 border-t-0"></div>

    <!-- 슬롯 -->
    <button
      v-for="slot in slots"
      :key="slot.id"
      type="button"
      class="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      :class="editable ? 'cursor-pointer' : 'cursor-default'"
      :style="{ left: slot.x + '%', top: slot.y + '%' }"
      :disabled="!editable"
      @click="emit('slot-click', slot)"
    >
      <span
        v-if="playerOf(slot.id)"
        class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow ring-2 ring-white/70"
        :class="roleColor[slot.role]"
      >
        {{ playerOf(slot.id).number ?? playerOf(slot.id).name.charAt(0) }}
      </span>
      <span
        v-else
        class="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-dashed border-white/70 text-white/80"
        :class="editable ? 'bg-white dark:bg-zinc-800/10' : 'bg-black/10'"
      >
        {{ editable ? '+' : slot.role }}
      </span>
      <span
        v-if="playerOf(slot.id)"
        class="text-[10px] text-white font-medium leading-none max-w-[60px] truncate drop-shadow"
      >
        {{ playerOf(slot.id).name }}
      </span>
    </button>
  </div>
</template>
