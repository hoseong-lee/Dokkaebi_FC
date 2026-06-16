<script setup>
import { computed } from 'vue'
import { computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { futTier, FUT_TIER_LABEL } from '@/utils/futCard'
import { playerSkillTags } from '@/utils/playerPhoto'

// 선수의 OVR → 티어(골드/실버/브론즈) 뱃지. 선수 목록·카드용 작은 표시.
const props = defineProps({
  player: { type: Object, required: true },
  seasonId: { type: String, default: null },
  showOvr: { type: Boolean, default: true } // OVR 숫자도 표시
})

const ovr = computed(() => overallRating(computeFifaAttrs(playerSkillTags(props.player, props.seasonId))))
const tier = computed(() => futTier(ovr.value))
const meta = computed(() => FUT_TIER_LABEL[tier.value])

// 티어별 칩 톤
const TONE = {
  gold: 'bg-gradient-to-br from-amber-200 to-amber-500 text-amber-950 ring-amber-300',
  silver: 'bg-gradient-to-br from-zinc-100 to-zinc-400 text-zinc-800 ring-zinc-300',
  bronze: 'bg-gradient-to-br from-orange-200 to-orange-500 text-orange-950 ring-orange-300'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5 rounded-full ring-1 font-black tabular-nums shadow-sm"
    :class="[TONE[tier], showOvr ? 'px-1.5 py-0.5 text-[10px]' : 'w-5 h-5 justify-center text-[11px]']"
    :title="`${meta.label} · OVR ${ovr}`"
  >
    <span>{{ meta.emoji }}</span>
    <span v-if="showOvr">{{ ovr }}</span>
  </span>
</template>
