<script setup>
import { ref, computed } from 'vue'
import { ATTR_MAP, computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { playerPhotoSrc } from '@/utils/playerPhoto'
import { generateFutCard, futTier, FUT_TIER_LABEL, SHIELD_D, FUT_TONES } from '@/utils/futCard'
import { downloadBlob } from '@/utils/squadImage'
import { useToast } from '@/composables/useToast'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'
import BaseButton from '@/components/common/BaseButton.vue'

// EA FC 스타일 선수 카드 — 곡선 방패 + 뮤트 톤 + 홀로그래픽 + 3D 틸트
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

// 방패 실루엣 클립 (objectBoundingBox 0~1 좌표 — SHIELD_D 의 /300, /420 스케일)
const CLIP_D =
  'M0.5 0.0238 L0.8733 0.0762 Q0.9067 0.081 0.9067 0.1048 L0.9067 0.7571 Q0.9067 0.7857 0.88 0.8 L0.54 0.9619 Q0.5 0.981 0.46 0.9619 L0.12 0.8 Q0.0933 0.7857 0.0933 0.7571 L0.0933 0.1048 Q0.0933 0.081 0.1267 0.0762 Z'

// FUT 스탯 순서 — 좌: PAC SHO PAS / 우: DRI DEF PHY (라벨 한글)
const leftStats = computed(() => ['PAC', 'SHO', 'PAS'].map((id) => statOf(id)))
const rightStats = computed(() => ['DRI', 'DEF', 'PHY'].map((id) => statOf(id)))
function statOf(id) {
  const meta = ATTR_MAP.find((a) => a.id === id)
  return { id, label: meta?.ko || id, value: attrs.value[id] ?? 50 }
}

// 3D 틸트 (데스크탑 마우스 전용 — 터치는 스크롤 방해라 제외)
const cardEl = ref(null)
const tiltTransform = ref('')
function onTiltMove(e) {
  if (e.pointerType !== 'mouse') return
  const el = cardEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  tiltTransform.value =
    `perspective(700px) rotateY(${(px * 12).toFixed(2)}deg) rotateX(${(-py * 12).toFixed(2)}deg) scale(1.02)`
}
function onTiltLeave() {
  tiltTransform.value = ''
}

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
      class="relative w-64 aspect-[5/7] select-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out will-change-transform"
      :style="{ transform: tiltTransform }"
      @pointermove="onTiltMove"
      @pointerleave="onTiltLeave"
    >
      <!-- 방패 실루엣으로 전체 클립 — 콘텐츠 삐져나옴 방지 -->
      <div class="absolute inset-0" :style="{ clipPath: `url(#${uid}-cclip)` }">
        <!-- 배경: 곡선 방패 SVG (그라데이션 + 광택 + 헤어라인 + 아크 패턴) -->
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

        <!-- 홀로그래픽 sweep (골드 전용) -->
        <div v-if="tier === 'gold'" class="holo absolute inset-0 pointer-events-none"></div>

        <!-- 좌상단: OVR + 포지션 + 엠블럼 -->
        <div class="absolute left-[10%] top-[10%] w-[23%] flex flex-col items-center" :style="{ color: tone.text }">
          <span class="text-[38px] font-black leading-none tabular-nums tracking-tight">{{ ovr }}</span>
          <span class="text-sm font-bold mt-1 tracking-[0.18em]">{{ posCode }}</span>
          <div class="w-7 border-t my-2" :style="{ borderColor: tone.line }"></div>
          <img :src="emblemSrc" alt="도깨비FC" class="w-8 h-8 rounded-full shadow-sm" />
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

        <!-- 6 스탯 (2열) -->
        <div class="absolute left-[14%] right-[14%] top-[69%] grid grid-cols-2 gap-x-3" :style="{ color: tone.text }">
          <div class="space-y-[7px]">
            <p v-for="s in leftStats" :key="s.id" class="text-[13px] leading-none flex items-baseline">
              <span class="font-black tabular-nums w-6 shrink-0">{{ s.value }}</span>
              <span class="text-[10px] font-medium truncate" :style="{ color: tone.sub }">{{ s.label }}</span>
            </p>
          </div>
          <div class="space-y-[7px] border-l pl-3" :style="{ borderColor: tone.line }">
            <p v-for="s in rightStats" :key="s.id" class="text-[13px] leading-none flex items-baseline">
              <span class="font-black tabular-nums w-6 shrink-0">{{ s.value }}</span>
              <span class="text-[10px] font-medium truncate" :style="{ color: tone.sub }">{{ s.label }}</span>
            </p>
          </div>
        </div>

        <!-- 하단 클럽 레터링 (방패 테이퍼 안쪽) -->
        <p
          class="absolute left-[25%] right-[25%] top-[85.5%] text-center text-[7px] font-bold tracking-[0.34em] whitespace-nowrap"
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
</style>
