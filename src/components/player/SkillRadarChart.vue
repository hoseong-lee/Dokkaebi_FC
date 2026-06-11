<script setup>
import { computed } from 'vue'
import { ATTR_MAP, computeFifaAttrs, overallRating, gradeFromOvr, recommendPositions } from '@/utils/skillMap'

const props = defineProps({
  skillTags: { type: Object, default: () => ({}) },  // 받은 스킬 평판
  name: { type: String, default: '' },
  position: { type: String, default: '' }
})

const attrs = computed(() => computeFifaAttrs(props.skillTags))
const ovr = computed(() => overallRating(attrs.value))
const grade = computed(() => gradeFromOvr(ovr.value))
const recommended = computed(() => recommendPositions(props.skillTags, 3))
const hasData = computed(() => Object.values(props.skillTags).some((v) => v > 0))

// SVG 6각형 좌표 — 라벨이 안 잘리게 캔버스에 상하/좌우 여백을 넉넉히
const VB_W = 300, VB_H = 310
const CX = 150, CY = 152, R = 104
const LABEL_R = 130
function polarToXY(angleDeg, radius) {
  const a = (angleDeg - 90) * Math.PI / 180
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) }
}
const gridLevels = [0.4, 0.7, 1.0]
function gridPath(r) {
  return ATTR_MAP.map((_, i) => {
    const p = polarToXY(i * 60, R * r)
    return `${p.x},${p.y}`
  }).join(' ')
}
const sixGonPath = computed(() => gridPath(1))
const dataPoints = computed(() =>
  ATTR_MAP.map((attr, i) => {
    const v = attrs.value[attr.id] || 50
    const ratio = (v - 50) / 49  // 50~99 → 0~1
    return polarToXY(i * 60, R * (0.2 + ratio * 0.8))  // 안쪽 20% 부터 시작 (시각적으로 잘 보이게)
  })
)
const dataPath = computed(() =>
  dataPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
)
const labelPoints = computed(() =>
  ATTR_MAP.map((attr, i) => ({
    ...polarToXY(i * 60, LABEL_R),
    label: attr.ko,
    value: attrs.value[attr.id] || 50,
    icon: attr.icon
  }))
)

// 십의 자리별 값 색상 — 50대 검정 / 60대 파랑 / 70대 보라 / 80대 빨강 / 90대 노랑
function valueColor(v) {
  if (v >= 90) return '#facc15'
  if (v >= 80) return '#ef4444'
  if (v >= 70) return '#a855f7'
  if (v >= 60) return '#3b82f6'
  return '#18181b'
}
// 외곽선 — 색 값엔 검정 테두리, 검정(50대) 값엔 흰 테두리 (배경 간섭 차단)
function valueStyle(v) {
  const c = valueColor(v)
  const o = v < 60 ? '#ffffff' : '#000000'
  return {
    color: c,
    textShadow: `1px 0 0 ${o}, -1px 0 0 ${o}, 0 1px 0 ${o}, 0 -1px 0 ${o}, 1px 1px 0 ${o}, -1px -1px 0 ${o}, 1px -1px 0 ${o}, -1px 1px 0 ${o}`
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <!-- OVR 등급 카드 -->
      <div class="rounded-2xl p-4 text-center shadow-lg w-28 shrink-0" :class="grade.tone">
        <p class="text-[10px] font-bold opacity-80 tracking-wider">OVR</p>
        <p class="text-4xl font-extrabold tabular-nums leading-none">{{ ovr }}</p>
        <p class="text-xs font-bold mt-1">{{ grade.emoji }} {{ grade.label }}</p>
      </div>

      <!-- 추천 포지션 -->
      <div class="flex-1 min-w-0">
        <p class="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-1.5">추천 포지션</p>
        <div v-if="recommended.length === 0" class="text-xs text-gray-400 dark:text-zinc-500">
          스킬 평판 데이터가 모이면 자동으로 추천돼요
        </div>
        <ul v-else class="space-y-1">
          <li v-for="(r, i) in recommended" :key="r.code" class="flex items-center gap-2 text-xs">
            <span class="font-bold text-gray-400 dark:text-zinc-500 w-5">{{ ['🥇','🥈','🥉'][i] }}</span>
            <span class="font-bold text-navy dark:text-zinc-100">{{ r.code }}</span>
            <span class="text-gray-600 dark:text-zinc-400 truncate">{{ r.label }}</span>
            <div class="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden min-w-[40px]">
              <div class="h-full bg-blue-500 rounded-full" :style="{ width: r.percent + '%' }"></div>
            </div>
            <span class="text-[10px] text-gray-500 dark:text-zinc-400 tabular-nums w-9 text-right">{{ r.percent }}%</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 6각형 차트 -->
    <div class="relative flex items-center justify-center">
      <svg :viewBox="`0 0 ${VB_W} ${VB_H}`" class="w-72 max-w-full" style="aspect-ratio: 300 / 310">
        <!-- 그리드 (40% / 70% / 100%) -->
        <polygon
          v-for="r in gridLevels" :key="r"
          :points="gridPath(r)"
          fill="none" stroke="#e5e7eb" stroke-width="1"
        />
        <!-- 6각형 외곽 -->
        <polygon :points="sixGonPath" fill="none" stroke="#cbd5e1" stroke-width="1.5" />

        <!-- 데이터 영역 -->
        <polygon
          :points="dataPath"
          fill="rgba(59,130,246,0.25)"
          stroke="#3b82f6" stroke-width="2"
        />
        <!-- 데이터 포인트 -->
        <circle v-for="(p, i) in dataPoints" :key="i" :cx="p.x" :cy="p.y" r="3.5" fill="#3b82f6" />
      </svg>
      <!-- 라벨 + 수치 (SVG 위 absolute) -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          v-for="(p, i) in labelPoints" :key="i"
          class="absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
          :style="{ left: (p.x / VB_W) * 100 + '%', top: (p.y / VB_H) * 100 + '%' }"
        >
          <p class="text-[10px] font-bold text-gray-500 dark:text-zinc-400 leading-tight">{{ p.icon }} {{ p.label }}</p>
          <p class="text-base font-extrabold tabular-nums" :style="valueStyle(p.value)">{{ p.value }}</p>
        </div>
      </div>
    </div>

    <!-- 값 색상 범례 -->
    <div class="flex items-center justify-center gap-2 text-[9px] text-gray-400 dark:text-zinc-500">
      <span v-for="l in [
        { c: '#18181b', t: '50대' },
        { c: '#3b82f6', t: '60대' },
        { c: '#a855f7', t: '70대' },
        { c: '#ef4444', t: '80대' },
        { c: '#facc15', t: '90대' }
      ]" :key="l.t" class="flex items-center gap-1">
        <span class="w-2 h-2 rounded-full ring-1 ring-black/20" :style="{ background: l.c }"></span>{{ l.t }}
      </span>
    </div>

    <p v-if="!hasData" class="text-[11px] text-gray-400 dark:text-zinc-500 text-center">
      💡 동료가 경기에서 스킬 평가를 주면 자동으로 능력치가 산정됩니다
    </p>
  </div>
</template>
