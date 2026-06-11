<script setup>
import { computed } from 'vue'
import { POSITION_CATEGORY } from '@/utils/positions'

// 사진 없는 선수의 큰 영역용 실루엣 (머리 + 어깨/몸통 윤곽)
// 포지션 카테고리 색 그라데이션으로 채워 사진처럼 영역을 채운다.
const props = defineProps({
  player: { type: Object, default: null }
})

// 카테고리별 그라데이션 (위 밝음 → 아래 어두움)
const TONE = {
  GK: { from: '#fbbf24', to: '#92400e' },  // amber-400 → amber-800
  DF: { from: '#38bdf8', to: '#075985' },  // sky-400 → sky-800
  MF: { from: '#34d399', to: '#065f46' },  // emerald-400 → emerald-800
  FW: { from: '#fb7185', to: '#9f1239' }   // rose-400 → rose-800
}
const DEFAULT_TONE = { from: '#a1a1aa', to: '#3f3f46' } // zinc-400 → zinc-700

const tone = computed(() => {
  const p = props.player
  // mainPosition(상세) → category, 폴백으로 legacy position(광역)
  const cat =
    POSITION_CATEGORY[p?.mainPosition] ||
    POSITION_CATEGORY[p?.subPosition] ||
    p?.position
  return TONE[cat] || DEFAULT_TONE
})

// 한 화면에 여러 실루엣이 있어도 gradient id 충돌 안 나게
const gradId = computed(() => `sil-grad-${props.player?.id || 'anon'}`)
</script>

<template>
  <svg viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient :id="gradId" x1="100" y1="0" x2="100" y2="230" gradientUnits="userSpaceOnUse">
        <stop offset="0" :stop-color="tone.from" />
        <stop offset="1" :stop-color="tone.to" />
      </linearGradient>
    </defs>
    <!-- 머리 -->
    <ellipse cx="100" cy="58" rx="36" ry="40" :fill="`url(#${gradId})`" />
    <!-- 목 -->
    <rect x="86" y="90" width="28" height="22" rx="8" :fill="`url(#${gradId})`" />
    <!-- 어깨 / 몸통 (유니폼 느낌으로 어깨 살짝 각지게) -->
    <path
      d="M100 106
         C 138 106 170 128 180 168
         L 186 230 L 14 230 L 20 168
         C 30 128 62 106 100 106 Z"
      :fill="`url(#${gradId})`"
    />
    <!-- 유니폼 칼라 V넥 (배경이 비치는 음각) -->
    <path d="M84 108 L100 130 L116 108 C 110 104 90 104 84 108 Z" fill="rgba(0,0,0,0.25)" />
  </svg>
</template>
