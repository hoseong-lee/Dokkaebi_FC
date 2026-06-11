<script setup>
import { ref, computed } from 'vue'
import { ATTR_MAP, computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { playerPhotoSrc } from '@/utils/playerPhoto'
import { generateFutCard, futTier, FUT_TIER_LABEL, SHIELD_D, FUT_TONES } from '@/utils/futCard'
import { downloadBlob } from '@/utils/squadImage'
import { useToast } from '@/composables/useToast'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'
import BaseButton from '@/components/common/BaseButton.vue'

// EA FC 스타일 선수 카드 — 곡선 방패 + 뮤트 톤 + 헤어라인 보더 (프리미엄)
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

// FUT 스탯 순서 — 좌: PAC SHO PAS / 우: DRI DEF PHY (라벨 한글)
const leftStats = computed(() => ['PAC', 'SHO', 'PAS'].map((id) => statOf(id)))
const rightStats = computed(() => ['DRI', 'DEF', 'PHY'].map((id) => statOf(id)))
function statOf(id) {
  const meta = ATTR_MAP.find((a) => a.id === id)
  return { id, label: meta?.ko || id, value: attrs.value[id] ?? 50 }
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
    <!-- 카드 본체 -->
    <div class="relative w-64 aspect-[5/7] select-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]">
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
        </defs>

        <path :d="SHIELD_D" :fill="`url(#${uid}-bg)`" />
        <path :d="SHIELD_D" :fill="`url(#${uid}-sheen)`" />

        <!-- 기요셰풍 아크 패턴 (하단, 매우 옅게) -->
        <g :clip-path="`url(#${uid}-clip)`" :stroke="tone.line" stroke-width="0.8" opacity="0.5">
          <circle cx="150" cy="500" r="190" />
          <circle cx="150" cy="500" r="215" />
          <circle cx="150" cy="500" r="240" />
        </g>

        <!-- 내부 헤어라인 보더 (살짝 안쪽으로 스케일) -->
        <g transform="translate(150,210) scale(0.952) translate(-150,-210)">
          <path :d="SHIELD_D" fill="none" :stroke="tone.line" stroke-width="1.4" />
        </g>
      </svg>

      <!-- 좌상단: OVR + 포지션 + 엠블럼 -->
      <div class="absolute left-[9%] top-[9.5%] w-[24%] flex flex-col items-center" :style="{ color: tone.text }">
        <span class="text-[44px] font-black leading-none tabular-nums tracking-tight">{{ ovr }}</span>
        <span class="text-base font-bold mt-1 tracking-[0.2em]">{{ posCode }}</span>
        <div class="w-7 border-t my-2" :style="{ borderColor: tone.line }"></div>
        <img :src="emblemSrc" alt="도깨비FC" class="w-9 h-9 rounded-full shadow-sm" />
      </div>

      <!-- 우측: 선수 사진(누끼) 또는 실루엣 -->
      <div class="absolute right-[4%] top-[7%] w-[64%] h-[47%] flex items-end justify-center pointer-events-none">
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
        class="absolute left-[11%] right-[11%] top-[56.5%] text-center border-t border-b py-1.5"
        :style="{ color: tone.text, borderColor: tone.line }"
      >
        <p class="text-lg font-black tracking-[0.12em] truncate">{{ player.name }}</p>
      </div>

      <!-- 6 스탯 (2열) -->
      <div class="absolute left-[13%] right-[13%] top-[69%] grid grid-cols-2 gap-x-3" :style="{ color: tone.text }">
        <div class="space-y-[7px]">
          <p v-for="s in leftStats" :key="s.id" class="text-[13px] leading-none flex items-baseline">
            <span class="font-black tabular-nums w-7">{{ s.value }}</span>
            <span class="text-[11px] font-medium" :style="{ color: tone.sub }">{{ s.label }}</span>
          </p>
        </div>
        <div class="space-y-[7px] border-l pl-3.5" :style="{ borderColor: tone.line }">
          <p v-for="s in rightStats" :key="s.id" class="text-[13px] leading-none flex items-baseline">
            <span class="font-black tabular-nums w-7">{{ s.value }}</span>
            <span class="text-[11px] font-medium" :style="{ color: tone.sub }">{{ s.label }}</span>
          </p>
        </div>
      </div>

      <!-- 하단 클럽 레터링 -->
      <p
        class="absolute left-0 right-0 top-[86%] text-center text-[8px] font-bold tracking-[0.42em]"
        :style="{ color: tone.sub }"
      >
        DOKKAEBI FC
      </p>
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
