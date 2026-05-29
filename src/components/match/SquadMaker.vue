<script setup>
import { ref, computed } from 'vue'
import SquadEditor from './SquadEditor.vue'
import { buildSquadShareText, copyToClipboard } from '@/utils/squadShare'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  squads: { type: Array, required: true }, // 4쿼터 squad 객체 배열
  players: { type: Array, required: true },
  match: { type: Object, default: null }
})
const toast = useToast()

const activeQ = ref(0)

function lineupCount(i) {
  return props.squads[i]?.lineup?.length || 0
}

// 선수별 배정된 쿼터 수 ({playerId: count})
const playerQuarterCounts = computed(() => {
  const counts = {}
  for (const sq of props.squads) {
    for (const pid of sq.lineup || []) {
      counts[pid] = (counts[pid] || 0) + 1
    }
  }
  return counts
})

// 분포 요약
const distribution = computed(() => {
  const dist = [0, 0, 0, 0, 0] // 0~4 쿼터
  for (const cnt of Object.values(playerQuarterCounts.value)) {
    if (cnt >= 0 && cnt <= 4) dist[cnt]++
  }
  const totalPlayers = Object.keys(playerQuarterCounts.value).length
  return { dist, totalPlayers }
})

// 직전 쿼터 → 현재 쿼터 복사
function copyFromPrev() {
  if (activeQ.value === 0) return
  const src = props.squads[activeQ.value - 1]
  const dst = props.squads[activeQ.value]
  dst.lineup = [...(src.lineup || [])]
  dst.formation = src.formation || ''
  dst.positions = { ...(src.positions || {}) }
  toast.success(`${activeQ.value}쿼터에서 복사했습니다.`)
}

// 1쿼터 명단·포메이션을 모든 쿼터에 일괄 적용
function applyQ1ToAll() {
  const src = props.squads[0]
  if (!src.lineup?.length) return toast.error('1쿼터 명단이 비어 있습니다.')
  for (let i = 1; i < 4; i++) {
    const dst = props.squads[i]
    dst.lineup = [...src.lineup]
    dst.formation = src.formation || ''
    dst.positions = { ...(src.positions || {}) }
  }
  toast.success('1쿼터 스쿼드를 전 쿼터에 적용했습니다.')
}

function clearQuarter() {
  const dst = props.squads[activeQ.value]
  dst.lineup = []
  dst.formation = ''
  dst.positions = {}
}

async function shareAll() {
  const hasAny = props.squads.some((q) => q.lineup?.length)
  if (!hasAny) return toast.error('출전 명단을 먼저 작성하세요.')
  const text = buildSquadShareText({
    match: props.match,
    squads: props.squads,
    players: props.players
  })
  try {
    await copyToClipboard(text)
    toast.success('단톡 공유 텍스트를 복사했습니다.')
  } catch (e) {
    toast.error(`복사 실패: ${e?.message || e}`)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 쿼터 탭 -->
    <div class="flex bg-gray-100 rounded-xl p-1">
      <button
        v-for="(q, i) in squads"
        :key="i"
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeQ === i ? 'bg-white shadow font-bold text-navy' : 'text-gray-500'"
        @click="activeQ = i"
      >
        {{ i + 1 }}쿼터
        <span class="text-[10px] opacity-70 ml-0.5">({{ lineupCount(i) }})</span>
      </button>
    </div>

    <!-- 빠른 액션 -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-if="activeQ > 0"
        type="button"
        class="text-xs px-3 py-1.5 rounded-full bg-navy/10 text-navy font-medium hover:bg-navy/20"
        @click="copyFromPrev"
      >↻ {{ activeQ }}쿼터 복사</button>
      <button
        v-if="activeQ === 0"
        type="button"
        class="text-xs px-3 py-1.5 rounded-full bg-gold/20 text-onyx font-semibold hover:bg-gold/30"
        @click="applyQ1ToAll"
      >📋 1쿼터를 전 쿼터에 적용</button>
      <button
        type="button"
        class="text-xs px-3 py-1.5 rounded-full bg-white text-gray-500 hover:text-dokkaebi"
        @click="clearQuarter"
      >이 쿼터 비우기</button>
    </div>

    <!-- 분포 요약: 쿼터 배정 횟수별 인원 수 -->
    <div
      v-if="distribution.totalPlayers"
      class="bg-gradient-to-r from-navy/5 to-gold/10 rounded-xl p-3 text-xs space-y-1"
    >
      <div class="flex items-center justify-between font-medium">
        <span class="text-navy">출전 후보 {{ distribution.totalPlayers }}명 · 쿼터 배정 분포</span>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        <div
          v-for="n in [1, 2, 3, 4]"
          :key="n"
          class="rounded-lg px-2 py-1.5 text-center"
          :class="n === 1 ? 'bg-amber-100 text-amber-800' : n < 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-gold/30 text-onyx font-semibold'"
        >
          <p class="text-[10px] opacity-80">{{ n === 4 ? '풀쿼' : n + '쿼터' }}</p>
          <p class="font-bold tabular-nums">{{ distribution.dist[n] }}명</p>
        </div>
      </div>
      <p class="text-[10px] text-gray-500">
        ⚠ 1쿼터만 뛰는 인원이 많으면 회전이 부족할 수 있어요 · 보통 2~3쿼터씩 배정 권장
      </p>
    </div>

    <!-- 현재 쿼터 에디터 -->
    <!-- :key 로 쿼터 전환 시 SquadEditor 재생성 — const s = props.squad 캐시 문제 회피 -->
    <SquadEditor
      :key="`q${activeQ}`"
      :squad="squads[activeQ]"
      :players="players"
      :quarter-counts="playerQuarterCounts"
    />

    <!-- 단톡 공유 -->
    <div class="pt-3 border-t">
      <button
        type="button"
        class="w-full text-sm px-4 py-2.5 rounded-lg bg-yellow-300 text-onyx font-semibold hover:bg-yellow-400 transition-colors"
        @click="shareAll"
      >
        💬 단톡 공유 텍스트 복사 (전 쿼터)
      </button>
      <p class="text-[11px] text-gray-400 mt-1.5">
        작성된 쿼터만 포함되어 카카오톡 단톡방에 바로 붙여넣을 수 있는 형식으로 복사됩니다.
      </p>
    </div>
  </div>
</template>
