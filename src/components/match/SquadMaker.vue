<script setup>
import { ref } from 'vue'
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

    <!-- 현재 쿼터 에디터 -->
    <SquadEditor :squad="squads[activeQ]" :players="players" />

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
