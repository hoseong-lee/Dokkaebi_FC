<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import QuarterEditor from '@/components/match/QuarterEditor.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const playersStore = usePlayersStore()
const toast = useToast()

const match = ref(null)
const loading = ref(true)
const saving = ref(false)
const activeQ = ref(0)

function emptyQuarter() {
  return { opponentScore: 0, lineup: [], events: [], formation: '', positions: {} }
}

const quarters = reactive([emptyQuarter(), emptyQuarter(), emptyQuarter(), emptyQuarter()])
const momPlayerId = ref(null)
const notes = ref('')

// 쿼터별 도깨비 득점
function qDok(i) {
  return quarters[i].events.filter((e) => e.type === 'goal').length
}
const totalDok = computed(() => quarters.reduce((s, q) => s + q.events.filter((e) => e.type === 'goal').length, 0))
const totalOpp = computed(() => quarters.reduce((s, q) => s + (Number(q.opponentScore) || 0), 0))

// 직전 쿼터 명단을 현재 쿼터로 복사 (포메이션/포지션도 함께)
function copyFromPrev() {
  if (activeQ.value === 0) return
  const src = quarters[activeQ.value - 1]
  const dst = quarters[activeQ.value]
  dst.lineup = [...src.lineup]
  dst.formation = src.formation
  dst.positions = { ...src.positions }
  toast.success(`${activeQ.value}쿼터 명단을 복사했습니다.`)
}

// 미리 짠 스쿼드(plannedSquad) 를 현재 쿼터로 가져오기
function copyFromPlanned() {
  const planned = match.value?.plannedSquad
  if (!planned || !planned.lineup?.length) {
    return toast.error('미리 짠 스쿼드가 없습니다.')
  }
  const dst = quarters[activeQ.value]
  dst.lineup = [...planned.lineup]
  dst.formation = planned.formation || ''
  dst.positions = { ...(planned.positions || {}) }
  toast.success(`${activeQ.value + 1}쿼터에 예정 스쿼드를 가져왔습니다.`)
}

// MOM 후보 = 전 쿼터 출전 명단 합집합
const lineupUnion = computed(() => {
  const set = new Set()
  quarters.forEach((q) => q.lineup.forEach((id) => set.add(id)))
  return [...set].map((id) => playersStore.getById(id)).filter(Boolean)
})

async function load() {
  loading.value = true
  await playersStore.fetchAll()
  match.value = await store.fetchOne(route.params.id)
  if (match.value) {
    momPlayerId.value = match.value.momPlayerId || null
    notes.value = match.value.notes || ''
    const existing = match.value.quarters
    if (Array.isArray(existing) && existing.length) {
      for (let i = 0; i < 4; i++) {
        const e = existing[i]
        quarters[i] = e
          ? {
              opponentScore: e.opponentScore ?? e.score?.opponent ?? 0,
              lineup: [...(e.lineup || [])],
              events: (e.events || []).map((x) => ({ ...x })),
              formation: e.formation || '',
              positions: { ...(e.positions || {}) }
            }
          : emptyQuarter()
      }
    }
  }
  loading.value = false
}

async function submit() {
  const anyLineup = quarters.some((q) => q.lineup.length > 0)
  if (!anyLineup) return toast.error('최소 한 쿼터에 출전 선수를 선택하세요.')

  saving.value = true
  try {
    await store.submitResult(match.value.id, {
      quarters: quarters.map((q) => ({
        opponentScore: Number(q.opponentScore) || 0,
        lineup: q.lineup,
        events: q.events,
        formation: q.formation || null,
        positions: q.positions || {}
      })),
      momPlayerId: momPlayerId.value,
      notes: notes.value
    })
    await playersStore.fetchAll(true)
    toast.success('경기 결과를 저장했습니다.')
    router.push(`/matches/${match.value.id}`)
  } catch (e) {
    console.error(e)
    toast.error(`결과 저장 중 오류: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <LoadingSpinner v-if="loading" label="불러오는 중..." />
  <div v-else-if="!match" class="text-center text-gray-400 py-10">경기를 찾을 수 없습니다.</div>
  <div v-else>
    <div class="mb-4">
      <h2 class="font-bold text-navy">결과 입력 (4쿼터)</h2>
      <p class="text-sm text-gray-500">vs {{ match.opponent }} · {{ formatDateTime(match.date) }}</p>
    </div>

    <!-- 합계 스코어 -->
    <div class="bg-white rounded-2xl shadow p-4 mb-4 flex items-center justify-center gap-4">
      <span class="flex-1 text-right font-bold text-navy">도깨비</span>
      <span class="text-3xl font-bold tabular-nums">{{ totalDok }} : {{ totalOpp }}</span>
      <span class="flex-1 font-bold text-gray-700">{{ match.opponent }}</span>
    </div>

    <!-- 쿼터 탭 -->
    <div class="flex bg-white rounded-xl p-1 mb-3 shadow-sm">
      <button
        v-for="(q, i) in quarters"
        :key="i"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeQ === i ? 'bg-navy text-white' : 'text-gray-500'"
        @click="activeQ = i"
      >
        {{ i + 1 }}쿼터
        <span class="text-xs opacity-70">({{ qDok(i) }}:{{ q.opponentScore || 0 }})</span>
      </button>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-3">
      <button
        v-if="match.plannedSquad && match.plannedSquad.lineup?.length"
        type="button"
        class="text-xs px-3 py-1.5 rounded-full bg-gold/20 text-onyx font-semibold hover:bg-gold/30"
        @click="copyFromPlanned"
      >
        📋 예정 스쿼드 가져오기
      </button>
      <button
        v-if="activeQ > 0"
        type="button"
        class="text-xs px-3 py-1.5 rounded-full bg-navy/10 text-navy font-medium hover:bg-navy/20"
        @click="copyFromPrev"
      >
        ↻ {{ activeQ }}쿼터 명단 복사
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow p-5">
      <QuarterEditor :quarter="quarters[activeQ]" :players="playersStore.activePlayers" />
    </div>

    <!-- 매치 레벨 -->
    <div class="bg-white rounded-2xl shadow p-5 mt-4 space-y-4">
      <div>
        <h3 class="text-sm font-bold text-navy mb-2">⭐ MOM (선택)</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="p in lineupUnion"
            :key="p.id"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs transition-colors"
            :class="momPlayerId === p.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'"
            @click="momPlayerId = momPlayerId === p.id ? null : p.id"
          >
            {{ p.name }}
          </button>
          <span v-if="lineupUnion.length === 0" class="text-xs text-gray-400 py-1.5">출전 선수를 먼저 선택하세요.</span>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">경기 후기 (선택)</label>
        <textarea v-model="notes" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="경기 후기를 남겨보세요." />
      </div>
    </div>

    <div class="flex gap-2 mt-4">
      <BaseButton variant="secondary" block @click="router.back()">취소</BaseButton>
      <BaseButton variant="danger" :loading="saving" block @click="submit">결과 저장</BaseButton>
    </div>
  </div>
</template>
