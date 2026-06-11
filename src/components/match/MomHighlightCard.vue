<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { POSITION_LABEL } from '@/utils/positions'
import { playerPhotoSrc } from '@/utils/playerPhoto'
import { useCardTilt } from '@/composables/useCardTilt'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'

const props = defineProps({
  player: { type: Object, required: true }
})

const photoSrc = computed(() => playerPhotoSrc(props.player))

const positionLabel = computed(() => {
  const p = props.player
  return POSITION_LABEL[p?.mainPosition] || POSITION_LABEL[p?.position] || p?.mainPosition || '선수'
})

// FUT 카드와 동일한 틸트 + 빛 추적 (가로 카드라 각도는 낮춤)
const { cardEl, tiltTransform, pointer, glareStyle, onTiltDown, onTiltMove, onTiltEnd, consumeSuppressClick } =
  useCardTilt({ maxDeg: 14, scale: 1.02 })

function onNavigate(navigate, e) {
  // 모바일에서 틸트 드래그 후 손 뗄 때 의도치 않은 이동 차단
  if (consumeSuppressClick()) return
  navigate(e)
}
</script>

<template>
  <RouterLink :to="`/players/${player.id}`" custom v-slot="{ navigate }">
    <div
      ref="cardEl"
      role="link"
      tabindex="0"
      class="block relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-2xl shadow-lg overflow-hidden ring-1 ring-amber-500/40 hover:ring-amber-400/70 hover:shadow-amber-500/20 transition-all cursor-pointer select-none touch-none will-change-transform"
      :style="{ transform: tiltTransform }"
      @click="onNavigate(navigate, $event)"
      @keyup.enter="navigate"
      @pointerdown="onTiltDown"
      @pointermove="onTiltMove"
      @pointerup="onTiltEnd"
      @pointercancel="onTiltEnd"
      @pointerleave="onTiltEnd"
    >
      <!-- 1) 배경 그라데이션 + 금색 후광 (사진 뒤) -->
      <div class="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_right_center,rgba(245,158,11,0.22),transparent_60%)]"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent"></div>
      </div>

      <!-- 2) 선수 큰 사진 (누끼, 그라데이션 위에 또렷이) -->
      <div class="absolute right-0 top-0 bottom-0 w-[55%] flex items-end justify-end pointer-events-none z-[5]">
        <img
          v-if="photoSrc"
          :src="photoSrc"
          :alt="player.name"
          referrerpolicy="no-referrer"
          class="h-full w-full object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
        />
        <div v-else class="h-full w-full flex items-end justify-center">
          <PlayerSilhouette
            :player="player"
            class="h-[92%] w-auto drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
          />
        </div>
      </div>

      <!-- 빛 효과 (스파클 + 글레어) — 사진 위 -->
      <div
        class="sparkle absolute inset-0 pointer-events-none z-[6] transition-opacity duration-300"
        :style="{ opacity: pointer.active ? 0.9 : 0.35 }"
      ></div>
      <div
        class="absolute inset-0 pointer-events-none z-[6] transition-opacity duration-300"
        style="mix-blend-mode: overlay"
        :style="glareStyle"
      ></div>

      <!-- 좌측 텍스트 -->
      <div class="relative z-10 p-5 sm:p-6 min-h-[240px] flex flex-col justify-between max-w-[60%]">
        <div>
          <p class="text-amber-400/90 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">DOKKAEBI FC</p>
          <h2 class="text-3xl sm:text-4xl font-black leading-tight mt-2 tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            {{ player.name }}
          </h2>
          <p class="text-zinc-300 text-sm sm:text-base font-medium mt-1">{{ positionLabel }}</p>
          <span class="inline-block mt-3 bg-amber-400/10 ring-1 ring-amber-400/40 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] text-amber-300 font-bold">
            상세 보기 →
          </span>
        </div>
        <div class="border-t border-amber-500/30 pt-3 mt-4">
          <p class="font-bold flex items-center gap-1.5 text-sm sm:text-base">
            <span class="text-lg sm:text-xl">🏆</span>
            <span class="tracking-[0.15em] uppercase text-amber-300">Man of the Match</span>
          </p>
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
/* 스파클 — 검정+금 배경 위 은은한 입자 */
.sparkle {
  background-image:
    radial-gradient(1.6px 1.6px at 60% 16%, rgba(255,255,255,0.95), transparent 60%),
    radial-gradient(1.2px 1.2px at 72% 58%, rgba(255,232,170,0.85), transparent 60%),
    radial-gradient(1.8px 1.8px at 84% 30%, rgba(255,255,255,0.9), transparent 60%),
    radial-gradient(1.1px 1.1px at 52% 72%, rgba(255,232,170,0.7), transparent 60%),
    radial-gradient(1.5px 1.5px at 90% 66%, rgba(255,255,255,0.85), transparent 60%),
    radial-gradient(1.2px 1.2px at 66% 42%, rgba(255,232,170,0.8), transparent 60%),
    radial-gradient(1.4px 1.4px at 78% 82%, rgba(255,255,255,0.8), transparent 60%);
  mix-blend-mode: screen;
  animation: mom-sparkle 3.2s ease-in-out infinite alternate;
}
@keyframes mom-sparkle {
  from { filter: brightness(0.7); }
  to { filter: brightness(1.4); }
}
</style>
