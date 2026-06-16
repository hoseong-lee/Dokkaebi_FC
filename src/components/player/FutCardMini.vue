<script setup>
import { computed } from 'vue'
import { computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { futTier, FUT_TIER_LABEL, FUT_TONES, SHIELD_D } from '@/utils/futCard'
import { playerSkillTags, playerPhotoSrc } from '@/utils/playerPhoto'
import { useCardTilt } from '@/composables/useCardTilt'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'

// 갤러리(도감) 그리드용 미니 FUT 카드 — 틸트/홀로/글레어 포함 (탭=전체 카드 모달)
const props = defineProps({
  player: { type: Object, required: true },
  seasonId: { type: String, default: null }
})

const skillTags = computed(() => playerSkillTags(props.player, props.seasonId))
const attrs = computed(() => computeFifaAttrs(skillTags.value))
const ovr = computed(() => overallRating(attrs.value))
const tier = computed(() => futTier(ovr.value))
const tone = computed(() => FUT_TONES[tier.value])
const meta = computed(() => FUT_TIER_LABEL[tier.value])
const posCode = computed(() => props.player?.mainPosition || props.player?.position || '—')
const photoSrc = computed(() => playerPhotoSrc(props.player))
const uid = computed(() => `mini-${props.player?.id || 'a'}`)

const CLIP_D =
  'M0.5 0.0238 L0.8733 0.0762 Q0.9067 0.081 0.9067 0.1048 L0.9067 0.7952 Q0.9067 0.8238 0.88 0.8381 L0.54 0.9714 Q0.5 0.9881 0.46 0.9714 L0.12 0.8381 Q0.0933 0.8238 0.0933 0.7952 L0.0933 0.1048 Q0.0933 0.081 0.1267 0.0762 Z'

// 도감은 카드가 많으니 각도 약하게 + 홀로는 hover/press 시에만 (상시 애니메이션 X)
const { cardEl, tiltTransform, pointer, holoStyle, glareStyle, onTiltDown, onTiltMove, onTiltEnd } =
  useCardTilt({ maxDeg: 16, scale: 1.05 })
</script>

<template>
  <div
    ref="cardEl"
    class="relative aspect-[5/7] select-none touch-none drop-shadow-md cursor-pointer transition-transform duration-150 ease-out will-change-transform"
    :style="{ transform: tiltTransform }"
    @pointerdown="onTiltDown"
    @pointermove="onTiltMove"
    @pointerup="onTiltEnd"
    @pointercancel="onTiltEnd"
    @pointerleave="onTiltEnd"
  >
    <div class="absolute inset-0" :style="{ clipPath: `url(#${uid}-cclip)` }">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 420" fill="none" aria-hidden="true">
        <defs>
          <linearGradient :id="`${uid}-bg`" x1="150" y1="0" x2="150" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" :stop-color="tone.stops[0]" />
            <stop offset="0.38" :stop-color="tone.stops[1]" />
            <stop offset="0.78" :stop-color="tone.stops[2]" />
            <stop offset="1" :stop-color="tone.stops[3]" />
          </linearGradient>
          <clipPath :id="`${uid}-cclip`" clipPathUnits="objectBoundingBox"><path :d="CLIP_D" /></clipPath>
        </defs>
        <path :d="SHIELD_D" :fill="`url(#${uid}-bg)`" />
        <g transform="translate(150,210) scale(0.952) translate(-150,-210)">
          <path :d="SHIELD_D" fill="none" :stroke="tone.line" stroke-width="1.4" />
        </g>
      </svg>

      <!-- 홀로/글레어 — 누르거나 호버할 때만 활성 (성능) -->
      <div v-show="pointer.active" class="holo-mini absolute inset-0 pointer-events-none" :style="holoStyle"></div>
      <div
        v-show="pointer.active"
        class="absolute inset-0 pointer-events-none"
        style="mix-blend-mode: overlay"
        :style="glareStyle"
      ></div>

      <!-- 좌상단 OVR/포지션 -->
      <div class="absolute left-[11%] top-[9%] flex flex-col items-center" :style="{ color: tone.text }">
        <span class="text-[26px] font-black leading-none tabular-nums">{{ ovr }}</span>
        <span class="text-[11px] font-bold tracking-wide">{{ posCode }}</span>
      </div>

      <!-- 사진/실루엣 -->
      <div class="absolute right-[7%] top-[10%] w-[56%] h-[44%] flex items-end justify-center pointer-events-none">
        <img
          v-if="photoSrc"
          :src="photoSrc"
          :alt="player.name"
          referrerpolicy="no-referrer"
          class="h-full w-auto max-w-full object-contain object-bottom"
        />
        <PlayerSilhouette v-else :player="player" class="h-[92%] w-auto opacity-90" />
      </div>

      <!-- 이름 -->
      <p
        class="absolute left-[10%] right-[10%] top-[58%] text-center font-black text-[13px] truncate border-t border-b py-1"
        :style="{ color: tone.text, borderColor: tone.line }"
      >{{ player.name }}</p>

      <!-- OVR/티어 요약 -->
      <p class="absolute left-0 right-0 top-[74%] text-center text-[10px] font-bold" :style="{ color: tone.sub }">
        {{ meta.emoji }} {{ meta.label }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.holo-mini {
  background: linear-gradient(
    115deg,
    transparent 20%,
    rgba(255, 255, 255, 0.3) 40%,
    rgba(170, 255, 238, 0.22) 48%,
    rgba(255, 170, 255, 0.2) 56%,
    transparent 78%
  );
  background-size: 220% 220%;
  mix-blend-mode: overlay;
}
</style>
