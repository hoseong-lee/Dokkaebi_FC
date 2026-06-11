<script setup>
import { ref, computed } from 'vue'
import { ATTR_MAP, computeFifaAttrs, overallRating, statDecadeColor, statDecadeStroke } from '@/utils/skillMap'
import { playerPhotoSrc } from '@/utils/playerPhoto'
import { generateFutCard, futTier, FUT_TIER_LABEL, SHIELD_D, FUT_TONES } from '@/utils/futCard'
import { downloadBlob } from '@/utils/squadImage'
import { useToast } from '@/composables/useToast'
import { useCardTilt } from '@/composables/useCardTilt'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'
import BaseButton from '@/components/common/BaseButton.vue'

// EA FC 스타일 선수 카드 — 곡선 방패 + 뮤트 톤 + 홀로/글레어/스파클 + 3D 틸트
const props = defineProps({
  player: { type: Object, required: true },
  skillTags: { type: Object, default: () => ({}) }
})

const toast = useToast()
const downloading = ref(false)
const emblemSrc = (import.meta.env.BASE_URL || '/') + 'dokkaebi-emblem-192.png'

const attrs = computed(() => computeFifaAttrs(props.skillTags))
const ovr = computed(() => overallRating(attrs.value))
const posCode = computed(() => props.player?.mainPosition || props.player?.position || '—')
const photoSrc = computed(() => playerPhotoSrc(props.player))

const tier = computed(() => futTier(ovr.value))
const tone = computed(() => FUT_TONES[tier.value])
const tierMeta = computed(() => FUT_TIER_LABEL[tier.value])

// SVG defs id 충돌 방지 (한 화면 다중 카드)
const uid = computed(() => `fut-${props.player?.id || 'anon'}`)

// 방패 실루엣 클립 (objectBoundingBox 0~1 — SHIELD_D 의 /300, /420)
// 몸통 직선 구간 y=0.838 까지 — 스탯 3행이 테이퍼에 안 걸림
const CLIP_D =
  'M0.5 0.0238 L0.8733 0.0762 Q0.9067 0.081 0.9067 0.1048 L0.9067 0.7952 Q0.9067 0.8238 0.88 0.8381 L0.54 0.9714 Q0.5 0.9881 0.46 0.9714 L0.12 0.8381 Q0.0933 0.8238 0.0933 0.7952 L0.0933 0.1048 Q0.0933 0.081 0.1267 0.0762 Z'

// FUT 스탯 순서 — 좌: PAC SHO PAS / 우: DRI DEF PHY (라벨 한글)
const leftStats = computed(() => ['PAC', 'SHO', 'PAS'].map((id) => statOf(id)))
const rightStats = computed(() => ['DRI', 'DEF', 'PHY'].map((id) => statOf(id)))
function statOf(id) {
  const meta = ATTR_MAP.find((a) => a.id === id)
  return { id, label: meta?.ko || id, value: attrs.value[id] ?? 50 }
}
// 십의 자리 색상 + 외곽선 (레이더 차트와 동일 체계)
function statStyle(v) {
  const o = statDecadeStroke(v)
  return {
    color: statDecadeColor(v),
    textShadow: `1px 0 0 ${o}, -1px 0 0 ${o}, 0 1px 0 ${o}, 0 -1px 0 ${o}, 1px 1px 0 ${o}, -1px -1px 0 ${o}, 1px -1px 0 ${o}, -1px 1px 0 ${o}`
  }
}

// 3D 틸트 + 포인터 추적 빛 (공용 composable)
const { cardEl, tiltTransform, pointer, holoStyle, glareStyle, onTiltDown, onTiltMove, onTiltEnd } =
  useCardTilt({ maxDeg: 25, scale: 1.05 })

async function download() {
  downloading.value = true
  try {
    const blob = await generateFutCard({
      player: props.player,
      skillTags: props.skillTags,
      emblemUrl: emblemSrc
    })
    const safe = (props.player.name || 'player').replace(/[^\w가-힣\s-]/g, '_').trim() || 'player'
    downloadBlob(blob, `dokkaebi-fut-${safe}.png`)
    toast.success('카드 이미지를 저장했습니다.')
  } catch (e) {
    toast.error(`이미지 생성 실패: ${e?.message || e}`)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <!-- 틸트 래퍼 (그림자는 여기 — 클립과 분리해야 그림자 안 잘림) -->
    <div
      ref="cardEl"
      class="relative w-72 aspect-[5/7] select-none touch-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out will-change-transform"
      :style="{ transform: tiltTransform }"
      @pointerdown="onTiltDown"
      @pointermove="onTiltMove"
      @pointerup="onTiltEnd"
      @pointercancel="onTiltEnd"
      @pointerleave="onTiltEnd"
    >
      <!-- 방패 실루엣으로 전체 클립 — 콘텐츠 삐져나옴 방지 -->
      <div class="absolute inset-0" :style="{ clipPath: `url(#${uid}-cclip)` }">
        <!-- 배경: 곡선 방패 SVG -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 300 420" fill="none" aria-hidden="true">
          <defs>
            <linearGradient :id="`${uid}-bg`" x1="150" y1="0" x2="150" y2="420" gradientUnits="userSpaceOnUse">
              <stop offset="0" :stop-color="tone.stops[0]" />
              <stop offset="0.38" :stop-color="tone.stops[1]" />
              <stop offset="0.78" :stop-color="tone.stops[2]" />
              <stop offset="1" :stop-color="tone.stops[3]" />
            </linearGradient>
            <linearGradient :id="`${uid}-sheen`" x1="40" y1="20" x2="260" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="rgba(255,255,255,0.32)" />
              <stop offset="0.4" stop-color="rgba(255,255,255,0.06)" />
              <stop offset="1" stop-color="rgba(255,255,255,0)" />
            </linearGradient>
            <clipPath :id="`${uid}-clip`"><path :d="SHIELD_D" /></clipPath>
            <clipPath :id="`${uid}-cclip`" clipPathUnits="objectBoundingBox"><path :d="CLIP_D" /></clipPath>
          </defs>

          <path :d="SHIELD_D" :fill="`url(#${uid}-bg)`" />
          <path :d="SHIELD_D" :fill="`url(#${uid}-sheen)`" />

          <!-- 기요셰풍 아크 패턴 (하단, 매우 옅게) -->
          <g :clip-path="`url(#${uid}-clip)`" :stroke="tone.line" stroke-width="0.8" opacity="0.5">
            <circle cx="150" cy="500" r="190" />
            <circle cx="150" cy="500" r="215" />
            <circle cx="150" cy="500" r="240" />
          </g>

          <!-- 내부 헤어라인 보더 -->
          <g transform="translate(150,210) scale(0.952) translate(-150,-210)">
            <path :d="SHIELD_D" fill="none" :stroke="tone.line" stroke-width="1.4" />
          </g>
        </svg>

        <!-- 홀로그래픽 sweep — 틸트 중엔 포인터 위치를 따라감 -->
        <div class="holo absolute inset-0 pointer-events-none" :style="holoStyle"></div>
        <!-- 스파클 입자 (틸트 중 더 밝게) -->
        <div
          class="sparkle absolute inset-0 pointer-events-none transition-opacity duration-300"
          :style="{ opacity: pointer.active ? 0.95 : 0.45 }"
        ></div>
        <!-- 빛 반사 글레어 — 포인터 지점 스팟 -->
        <div
          class="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style="mix-blend-mode: overlay"
          :style="glareStyle"
        ></div>

        <!-- 좌상단: OVR + 포지션 + 엠블럼 -->
        <div class="absolute left-[10%] top-[10%] w-[23%] flex flex-col items-center" :style="{ color: tone.text }">
          <span class="text-[42px] font-black leading-none tabular-nums tracking-tight">{{ ovr }}</span>
          <span class="text-sm font-bold mt-1 tracking-[0.18em]">{{ posCode }}</span>
          <div class="w-7 border-t my-2" :style="{ borderColor: tone.line }"></div>
          <img :src="emblemSrc" alt="도깨비FC" class="w-9 h-9 rounded-full shadow-sm" />
        </div>

        <!-- 우측: 선수 사진(누끼) 또는 실루엣 -->
        <div class="absolute right-[6%] top-[9%] w-[60%] h-[45%] flex items-end justify-center pointer-events-none">
          <img
            v-if="photoSrc"
            :src="photoSrc"
            :alt="player.name"
            referrerpolicy="no-referrer"
            class="h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
          />
          <PlayerSilhouette v-else :player="player" class="h-[92%] w-auto opacity-90" />
        </div>

        <!-- 이름 바 -->
        <div
          class="absolute left-[12%] right-[12%] top-[56.5%] text-center border-t border-b py-1.5"
          :style="{ color: tone.text, borderColor: tone.line }"
        >
          <p class="text-lg font-black tracking-[0.1em] truncate">{{ player.name }}</p>
        </div>

        <!-- 6 스탯 (2열) — 십의 자리 색상 + 외곽선 -->
        <div class="absolute left-[14%] right-[14%] top-[69%] grid grid-cols-2 gap-x-3">
          <div class="space-y-[7px]">
            <p v-for="s in leftStats" :key="s.id" class="text-[14px] leading-none flex items-baseline">
              <span class="font-black tabular-nums w-7 shrink-0" :style="statStyle(s.value)">{{ s.value }}</span>
              <span class="text-[10px] font-medium truncate" :style="{ color: tone.sub }">{{ s.label }}</span>
            </p>
          </div>
          <div class="space-y-[7px] border-l pl-3" :style="{ borderColor: tone.line }">
            <p v-for="s in rightStats" :key="s.id" class="text-[14px] leading-none flex items-baseline">
              <span class="font-black tabular-nums w-7 shrink-0" :style="statStyle(s.value)">{{ s.value }}</span>
              <span class="text-[10px] font-medium truncate" :style="{ color: tone.sub }">{{ s.label }}</span>
            </p>
          </div>
        </div>

        <!-- 하단 클럽 레터링 (방패 테이퍼 안쪽) -->
        <p
          class="absolute left-[22%] right-[22%] top-[86.5%] text-center text-[7px] font-bold tracking-[0.34em] whitespace-nowrap"
          :style="{ color: tone.sub }"
        >
          DOKKAEBI FC
        </p>
      </div>
    </div>

    <p class="text-[11px] font-bold text-gray-500 dark:text-zinc-400 tracking-wide">
      {{ tierMeta.emoji }} {{ tierMeta.label }} CARD
      <span class="font-normal opacity-70">· 골드 70+ / 실버 65+</span>
    </p>
    <BaseButton size="sm" variant="secondary" :loading="downloading" @click="download">
      📸 카드 이미지 저장
    </BaseButton>
  </div>
</template>

<style scoped>
/* 홀로그래픽 sweep — 무지개빛 띠가 대각선으로 천천히 훑고 지나감 */
.holo {
  background: linear-gradient(
    115deg,
    transparent 18%,
    rgba(255, 255, 255, 0.28) 36%,
    rgba(170, 255, 238, 0.22) 44%,
    rgba(255, 170, 255, 0.2) 52%,
    rgba(255, 255, 255, 0.26) 60%,
    transparent 80%
  );
  background-size: 240% 240%;
  mix-blend-mode: overlay;
  animation: holo-sweep 5s ease-in-out infinite alternate;
}
@keyframes holo-sweep {
  from { background-position: 0% 0%; }
  to { background-position: 100% 100%; }
}

/* 스파클 — 고정 위치 입자들이 은은히 깜빡임 */
.sparkle {
  background-image:
    radial-gradient(1.6px 1.6px at 14% 18%, rgba(255,255,255,0.95), transparent 60%),
    radial-gradient(1.2px 1.2px at 26% 64%, rgba(255,255,255,0.8), transparent 60%),
    radial-gradient(1.8px 1.8px at 38% 32%, rgba(255,255,255,0.9), transparent 60%),
    radial-gradient(1.1px 1.1px at 52% 76%, rgba(255,255,255,0.75), transparent 60%),
    radial-gradient(1.5px 1.5px at 64% 22%, rgba(255,255,255,0.9), transparent 60%),
    radial-gradient(1.2px 1.2px at 72% 55%, rgba(255,255,255,0.8), transparent 60%),
    radial-gradient(1.7px 1.7px at 84% 38%, rgba(255,255,255,0.92), transparent 60%),
    radial-gradient(1.1px 1.1px at 45% 12%, rgba(255,255,255,0.7), transparent 60%),
    radial-gradient(1.4px 1.4px at 18% 44%, rgba(255,255,255,0.85), transparent 60%),
    radial-gradient(1.2px 1.2px at 58% 48%, rgba(255,255,255,0.75), transparent 60%),
    radial-gradient(1.6px 1.6px at 78% 72%, rgba(255,255,255,0.9), transparent 60%),
    radial-gradient(1.1px 1.1px at 32% 82%, rgba(255,255,255,0.7), transparent 60%);
  mix-blend-mode: screen;
  animation: sparkle-tw 3.2s ease-in-out infinite alternate;
}
@keyframes sparkle-tw {
  from { filter: brightness(0.7); }
  to { filter: brightness(1.4); }
}
</style>
