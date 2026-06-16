<script setup>
import { RouterLink } from 'vue-router'
import PlayerAvatar from './PlayerAvatar.vue'
import TierBadge from './TierBadge.vue'
import { POSITION_LABEL, POSITION_BADGE, attackPoints } from '@/utils/stats'

const props = defineProps({
  player: { type: Object, required: true },
  link: { type: Boolean, default: true }
})
</script>

<template>
  <component
    :is="link ? RouterLink : 'div'"
    :to="link ? `/players/${player.id}` : undefined"
    class="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-3 hover:shadow transition-shadow"
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
      <p class="font-semibold text-gray-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
        <span class="truncate">{{ player.name }}</span>
        <TierBadge :player="player" :show-ovr="false" class="shrink-0" />
        <span v-if="player.active === false" class="text-xs text-gray-400 dark:text-zinc-500">(은퇴)</span>
      </p>
      <div class="flex items-center gap-1.5 mt-0.5">
        <span
          class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
          :class="POSITION_BADGE[player.position] || 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'"
        >
          {{ POSITION_LABEL[player.position] || player.position }}
        </span>
        <span v-if="player.mainPosition" class="text-[10px] text-gray-400 dark:text-zinc-500">
          {{ player.mainPosition }}<span v-if="player.subPosition"> / {{ player.subPosition }}</span>
        </span>
      </div>
    </div>
    <div class="text-right text-xs text-gray-500 dark:text-zinc-400">
      <p><span class="font-bold text-navy dark:text-zinc-100">{{ player.stats?.goals || 0 }}</span> 골</p>
      <p><span class="font-bold text-navy dark:text-zinc-100">{{ player.stats?.assists || 0 }}</span> 도움</p>
    </div>
  </component>
</template>
