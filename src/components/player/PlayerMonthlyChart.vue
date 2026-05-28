<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, required: true } // [{ym,label,appearances,goals,assists}]
})

// SVG 크기
const W = 360
const H = 180
const PADL = 28
const PADR = 12
const PADT = 18
const PADB = 28

const innerW = W - PADL - PADR
const innerH = H - PADT - PADB

const maxY = computed(() => {
  let m = 1
  for (const r of props.series) {
    m = Math.max(m, r.goals, r.assists, r.appearances)
  }
  return Math.max(m, 3)
})

function xOf(i) {
  if (props.series.length <= 1) return PADL + innerW / 2
  return PADL + (i * innerW) / (props.series.length - 1)
}
function yOf(v) {
  return PADT + innerH - (v / maxY.value) * innerH
}

function pathFor(key) {
  return props.series
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(r[key])}`)
    .join(' ')
}

const yTicks = computed(() => {
  const m = maxY.value
  const steps = m <= 3 ? m : m <= 6 ? 3 : 4
  const out = []
  for (let i = 0; i <= steps; i++) out.push(Math.round((m * i) / steps))
  return out
})

const SERIES = [
  { key: 'goals', label: '골', color: '#DC2626' },
  { key: 'assists', label: '도움', color: '#1E3A8A' },
  { key: 'appearances', label: '출석', color: '#10B981' }
]
</script>

<template>
  <div v-if="series.length === 0" class="text-xs text-gray-400 text-center py-6">
    이 시즌 기록이 없습니다.
  </div>
  <div v-else>
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full">
      <!-- y 그리드 -->
      <g>
        <line
          v-for="(t, i) in yTicks"
          :key="i"
          :x1="PADL" :x2="W - PADR"
          :y1="yOf(t)" :y2="yOf(t)"
          stroke="#e5e7eb" stroke-width="1"
        />
        <text
          v-for="(t, i) in yTicks"
          :key="'l'+i"
          :x="PADL - 4" :y="yOf(t)"
          text-anchor="end" dominant-baseline="middle"
          font-size="10" fill="#9ca3af"
        >{{ t }}</text>
      </g>
      <!-- x 라벨 -->
      <g>
        <text
          v-for="(r, i) in series"
          :key="r.ym"
          :x="xOf(i)" :y="H - 8"
          text-anchor="middle"
          font-size="10" fill="#6b7280"
        >{{ r.label }}</text>
      </g>
      <!-- 라인 -->
      <path
        v-for="s in SERIES"
        :key="s.key"
        :d="pathFor(s.key)"
        :stroke="s.color"
        fill="none"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <!-- 점 -->
      <g v-for="s in SERIES" :key="'d'+s.key">
        <circle
          v-for="(r, i) in series"
          :key="r.ym + s.key"
          :cx="xOf(i)" :cy="yOf(r[s.key])"
          r="3" :fill="s.color"
        />
      </g>
    </svg>
    <!-- 범례 -->
    <div class="flex justify-center gap-3 mt-1 text-[11px]">
      <span v-for="s in SERIES" :key="s.key" class="flex items-center gap-1 text-gray-600">
        <span class="w-3 h-1 rounded" :style="{ background: s.color }"></span>
        {{ s.label }}
      </span>
    </div>
  </div>
</template>
