<script setup>
import { RouterLink } from 'vue-router'
import PlayerAvatar from './PlayerAvatar.vue'
import { POSITION_LABEL, attackPoints } from '@/utils/stats'

const props = defineProps({
  player: { type: Object, required: true },
  link: { type: Boolean, default: true }
})
</script>

<template>
  <component
    :is="link ? RouterLink : 'div'"
    :to="link ? `/players/${player.id}` : undefined"
    class="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3 hover:shadow transition-shadow"
    :class="{ 'opacity-60': player.active === false }"
  >
    <div class="relative">
      <PlayerAvatar :player="player" :size="48" />
      <span
        v-if="player.number != null"
        class="absolute -bottom-1 -right-1 bg-navy text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
      >
        {{ player.number }}
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-gray-900 truncate">
        {{ player.name }}
        <span v-if="player.active === false" class="text-xs text-gray-400">(은퇴)</span>
      </p>
      <p class="text-xs text-gray-500">{{ POSITION_LABEL[player.position] || player.position }}</p>
    </div>
    <div class="text-right text-xs text-gray-500">
      <p><span class="font-bold text-navy">{{ player.stats?.goals || 0 }}</span> 골</p>
      <p><span class="font-bold text-navy">{{ player.stats?.assists || 0 }}</span> 도움</p>
    </div>
  </component>
</template>
