<script setup>
import { ref, computed } from 'vue'
import { parseGpsFile } from '@/utils/gpsParser'
import { computeGpsStats } from '@/utils/gpsStats'
import BaseButton from '@/components/common/BaseButton.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const fileInput = ref(null)
const parsing = ref(false)
const track = ref(null)   // { points, meta }
const stats = ref(null)

function pickFile() {
  fileInput.value?.click()
}

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  parsing.value = true
  try {
    const t = await parseGpsFile(file)
    const s = computeGpsStats(t.points)
    if (!s) throw new Error('통계 계산 실패')
    track.value = t
    stats.value = s
    toast.success(`${t.meta.source.toUpperCase()} 분석 완료 — ${t.meta.sampleCount}개 샘플`)
  } catch (err) {
    toast.error(`파일 분석 실패: ${err?.message || err}`)
    track.value = null
    stats.value = null
  } finally {
    parsing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function reset() {
  track.value = null
  stats.value = null
}

// SVG 트랙 좌표 — bounds 를 viewBox 에 맞춤 (의존성 없는 본인 트랙 시각화)
const SVG_W = 600
const SVG_H = 400
const trackPath = computed(() => {
  if (!track.value || !stats.value) return ''
  const { minLat, maxLat, minLng, maxLng } = stats.value.bounds
  const pad = 10
  const lngSpan = Math.max(maxLng - minLng, 1e-9)
  const latSpan = Math.max(maxLat - minLat, 1e-9)
  // aspect 보정 (위도 약화 보정 위해 cos(lat) 적용)
  const cosLat = Math.cos(stats.value.centroidLat * Math.PI / 180)
  const scaleX = (SVG_W - pad * 2) / (lngSpan * cosLat)
  const scaleY = (SVG_H - pad * 2) / latSpan
  const scale = Math.min(scaleX, scaleY)
  const offsetX = pad + ((SVG_W - pad * 2) - lngSpan * cosLat * scale) / 2
  const offsetY = pad + ((SVG_H - pad * 2) - latSpan * scale) / 2
  const pts = track.value.points
  let d = ''
  for (let i = 0; i < pts.length; i++) {
    const x = offsetX + (pts[i].lng - minLng) * cosLat * scale
    const y = (SVG_H - offsetY) - (pts[i].lat - minLat) * scale // Y 뒤집기
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)
  }
  return d
})

function fmtDuration(sec) {
  if (!Number.isFinite(sec)) return '-'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}분 ${s}초`
}
function fmtPace(minPerKm) {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) return '-'
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}'${String(s).padStart(2, '0')}"/km`
}

// 통계 카드 정의
const statCards = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: '총 이동거리', value: s.distanceKm.toFixed(2), unit: 'km', icon: '🏃', color: 'navy' },
    { label: '활동 면적', value: Math.round(s.hullAreaM2).toLocaleString(), unit: 'm²', icon: '📐', color: 'emerald' },
    { label: '최고 속도', value: s.maxSpeedKmh.toFixed(1), unit: 'km/h', icon: '⚡', color: 'rose' },
    { label: '스프린트 횟수', value: String(s.sprintCount), unit: '회', icon: '🔥', color: 'amber' },
    { label: '강한 가속', value: String(s.accelCount), unit: '회', icon: '💨', color: 'sky' },
    { label: '고강도 거리', value: s.hiDistanceKm.toFixed(2), unit: 'km', icon: '🎯', color: 'fuchsia' }
  ]
})

const STAT_TONE = {
  navy: 'bg-navy/5 text-navy dark:text-zinc-100',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700'
}

const zonePct = computed(() => {
  if (!stats.value) return null
  const z = stats.value.zones
  const total = z.stand + z.jog + z.run + z.sprint
  if (total <= 0) return null
  return {
    stand: (z.stand / total) * 100,
    jog: (z.jog / total) * 100,
    run: (z.run / total) * 100,
    sprint: (z.sprint / total) * 100,
    standSec: z.stand,
    jogSec: z.jog,
    runSec: z.run,
    sprintSec: z.sprint
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- 헤더 -->
    <div>
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100 flex items-center gap-2">
        🏃 <span>GPS 분석</span>
        <span class="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">🚧 개발중</span>
      </h1>
      <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
        축구 경기 중 갤럭시워치·애플워치로 기록한 GPS 트랙을 분석합니다.
        총 거리, 활동 면적, 스프린트, 가속 횟수를 한눈에.
      </p>
    </div>

    <!-- 안내 -->
    <section v-if="!track" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5 space-y-3">
      <p class="font-bold text-navy dark:text-zinc-100">📂 지원 형식</p>
      <ul class="text-sm text-onyx dark:text-zinc-100 space-y-1.5 list-disc list-inside">
        <li><span class="font-bold">.gpx</span> — 애플 건강, Strava, RunGap, HealthFit 표준</li>
        <li><span class="font-bold">.tcx</span> — Samsung Health(갤럭시워치), Garmin Connect</li>
        <li><span class="font-bold">.fit</span> — Garmin / Samsung 바이너리 (원본 그대로 가능)</li>
      </ul>
      <div class="text-xs text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 space-y-1">
        <p>📱 <b>애플워치</b>: Apple 건강 → 운동 → 해당 활동 → 공유 → .gpx</p>
        <p>📱 <b>갤럭시워치</b>: shealth.samsung.com → 운동 → 해당 활동 → 다운로드 → .tcx 또는 .fit</p>
        <p>💡 <b>Strava 연동 시</b>: 활동 페이지 → ⋯ → Export GPX/Original (가장 편함)</p>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".gpx,.tcx,.fit,.xml"
        class="hidden"
        @change="onFile"
      />
      <BaseButton variant="primary" :loading="parsing" block @click="pickFile">
        📂 GPS 파일 선택 (.gpx / .tcx / .fit)
      </BaseButton>
      <p class="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
        ⚠ 현재 MVP — 본인 분석만 가능합니다. 매치 연동·동료 비교·시즌 누적은 다음 단계.
      </p>
    </section>

    <!-- 분석 결과 -->
    <template v-if="track && stats">
      <!-- 메타 -->
      <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 flex items-center justify-between flex-wrap gap-2">
        <div class="text-xs">
          <p class="text-gray-400 dark:text-zinc-500">소스</p>
          <p class="font-bold text-navy dark:text-zinc-100">.{{ track.meta.source }} · {{ track.meta.sampleCount }} 샘플</p>
        </div>
        <div class="text-xs">
          <p class="text-gray-400 dark:text-zinc-500">활동 시간</p>
          <p class="font-bold text-navy dark:text-zinc-100">{{ fmtDuration(track.meta.durationSec) }}</p>
        </div>
        <div class="text-xs">
          <p class="text-gray-400 dark:text-zinc-500">평균 페이스</p>
          <p class="font-bold text-navy dark:text-zinc-100">{{ fmtPace(stats.avgPaceMinPerKm) }}</p>
        </div>
        <BaseButton size="sm" variant="ghost" @click="reset">다른 파일</BaseButton>
      </section>

      <!-- 6 통계 카드 -->
      <section class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div
          v-for="c in statCards" :key="c.label"
          class="rounded-2xl p-3.5"
          :class="STAT_TONE[c.color]"
        >
          <p class="text-[10px] opacity-70 font-bold tracking-wide flex items-center gap-1">
            <span>{{ c.icon }}</span><span>{{ c.label }}</span>
          </p>
          <p class="text-2xl font-bold tabular-nums leading-tight mt-1">
            {{ c.value }}<span class="text-xs font-normal opacity-70 ml-1">{{ c.unit }}</span>
          </p>
        </div>
      </section>

      <!-- 활동 시간 분포 -->
      <section v-if="zonePct" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
        <p class="text-sm font-bold text-navy dark:text-zinc-100 mb-3">⏱ 활동 시간 분포</p>
        <div class="flex h-8 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-zinc-700">
          <div class="bg-gray-300" :style="{ width: zonePct.stand + '%' }" :title="`정지 ${fmtDuration(zonePct.standSec)}`"></div>
          <div class="bg-emerald-400" :style="{ width: zonePct.jog + '%' }" :title="`조깅 ${fmtDuration(zonePct.jogSec)}`"></div>
          <div class="bg-amber-500" :style="{ width: zonePct.run + '%' }" :title="`러닝 ${fmtDuration(zonePct.runSec)}`"></div>
          <div class="bg-rose-600" :style="{ width: zonePct.sprint + '%' }" :title="`스프린트 ${fmtDuration(zonePct.sprintSec)}`"></div>
        </div>
        <div class="grid grid-cols-4 gap-2 mt-2 text-[10px]">
          <div class="text-center">
            <div class="w-2 h-2 rounded-full bg-gray-300 inline-block mr-1"></div>정지<br/>
            <span class="font-bold tabular-nums">{{ zonePct.stand.toFixed(0) }}%</span>
          </div>
          <div class="text-center">
            <div class="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></div>조깅<br/>
            <span class="font-bold tabular-nums">{{ zonePct.jog.toFixed(0) }}%</span>
          </div>
          <div class="text-center">
            <div class="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1"></div>러닝<br/>
            <span class="font-bold tabular-nums">{{ zonePct.run.toFixed(0) }}%</span>
          </div>
          <div class="text-center">
            <div class="w-2 h-2 rounded-full bg-rose-600 inline-block mr-1"></div>스프린트<br/>
            <span class="font-bold tabular-nums">{{ zonePct.sprint.toFixed(0) }}%</span>
          </div>
        </div>
      </section>

      <!-- 트랙 미리보기 (SVG, 의존성 0) -->
      <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
        <p class="text-sm font-bold text-navy dark:text-zinc-100 mb-2">🗺 트랙 미리보기</p>
        <p class="text-[10px] text-gray-400 dark:text-zinc-500 mb-2">위도/경도 정규화 (배경 지도 없음 — 다음 단계에서 추가)</p>
        <svg
          :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
          class="w-full bg-gradient-to-br from-emerald-50 to-sky-50 rounded-lg ring-1 ring-gray-200 dark:ring-zinc-700"
        >
          <path :d="trackPath" stroke="#0a2540" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </section>

      <!-- 한계 안내 -->
      <section class="bg-amber-50 ring-1 ring-amber-200 rounded-2xl p-4 text-xs space-y-1.5">
        <p class="font-bold text-amber-800">📌 MVP 단계 한계</p>
        <ul class="text-amber-700 space-y-0.5 list-disc list-inside">
          <li>본인 트랙만 — 매치 연동·동료 오버레이 다음 단계</li>
          <li>전체 활동 기준 — 쿼터별 분리 없음 (다음: matches.quarters 시간대로 자동 분리)</li>
          <li>지도 배경 없음 — 다음: 구장 boundary 등록 후 경기장 %좌표 정규화</li>
          <li>저장 안 됨 — 새로고침 시 초기화 (다음: Firebase 영속화 + 시즌 누적)</li>
        </ul>
      </section>
    </template>
  </div>
</template>
