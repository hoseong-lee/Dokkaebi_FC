<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import {
  listMatchFees, setMatchFee,
  listMonthlyDues, setMonthlyDues,
  DEFAULT_MATCH_FEE
} from '@/firebase/database'
import { formatDate, dayjs } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()
const toast = useToast()

const tab = ref('match') // 'match' | 'dues'
const loading = ref(false)

// 매치비 상태
const selectedMatchId = ref('')
const matchFeeAmount = ref(DEFAULT_MATCH_FEE)
const matchPayments = ref({}) // { playerId: { paid, paidAt, amount } }

// 회비 상태
const selectedMonth = ref(dayjs().format('YYYYMM'))
const duesAmount = ref(0)
const duesPayments = ref({})

const finishedMatches = computed(() =>
  [...matchesStore.matches]
    .filter((m) => m.status === 'finished')
    .sort((a, b) => (b.date || 0) - (a.date || 0))
)

const selectedMatch = computed(() =>
  matchesStore.getById(selectedMatchId.value) || null
)

// 매치비 명단 = 해당 경기 lineup(union)
const matchAttendees = computed(() => {
  const m = selectedMatch.value
  if (!m) return []
  return (m.lineup || [])
    .map((id) => playersStore.getById(id))
    .filter(Boolean)
})

const regulars = computed(() => playersStore.activePlayers.filter((p) => p.isRegular))

const monthOptions = computed(() => {
  const now = dayjs()
  const arr = []
  for (let i = 0; i < 12; i++) arr.push(now.subtract(i, 'month').format('YYYYMM'))
  return arr
})

function monthLabel(yyyymm) {
  return `${yyyymm.slice(0, 4)}년 ${parseInt(yyyymm.slice(4))}월`
}

async function loadMatch() {
  if (!selectedMatchId.value) return
  loading.value = true
  try {
    matchPayments.value = await listMatchFees(selectedMatchId.value)
  } finally {
    loading.value = false
  }
}
async function loadDues() {
  loading.value = true
  try {
    duesPayments.value = await listMonthlyDues(selectedMonth.value)
  } finally {
    loading.value = false
  }
}

async function toggleMatchPaid(playerId) {
  const cur = matchPayments.value[playerId]
  const next = cur?.paid
    ? null
    : { paid: true, paidAt: Date.now(), amount: Number(matchFeeAmount.value) || 0 }
  matchPayments.value = { ...matchPayments.value, [playerId]: next || undefined }
  try {
    await setMatchFee(selectedMatchId.value, playerId, next)
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
    // 롤백
    matchPayments.value = { ...matchPayments.value, [playerId]: cur }
  }
}

async function toggleDuesPaid(playerId) {
  const cur = duesPayments.value[playerId]
  const next = cur?.paid
    ? null
    : { paid: true, paidAt: Date.now(), amount: Number(duesAmount.value) || 0 }
  duesPayments.value = { ...duesPayments.value, [playerId]: next || undefined }
  try {
    await setMonthlyDues(selectedMonth.value, playerId, next)
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
    duesPayments.value = { ...duesPayments.value, [playerId]: cur }
  }
}

async function markAllMatch(paid) {
  for (const p of matchAttendees.value) {
    const cur = matchPayments.value[p.id]
    if (!!cur?.paid === paid) continue
    await toggleMatchPaid(p.id)
  }
}

async function markAllDues(paid) {
  for (const p of regulars.value) {
    const cur = duesPayments.value[p.id]
    if (!!cur?.paid === paid) continue
    await toggleDuesPaid(p.id)
  }
}

const matchStats = computed(() => {
  const total = matchAttendees.value.length
  const paid = matchAttendees.value.filter((p) => matchPayments.value[p.id]?.paid).length
  return { total, paid, unpaid: total - paid }
})
const duesStats = computed(() => {
  const total = regulars.value.length
  const paid = regulars.value.filter((p) => duesPayments.value[p.id]?.paid).length
  return { total, paid, unpaid: total - paid }
})

onMounted(async () => {
  await Promise.all([matchesStore.fetchAll(), playersStore.fetchAll()])
  if (finishedMatches.value.length) selectedMatchId.value = finishedMatches.value[0].id
  await loadMatch()
})
watch(selectedMatchId, loadMatch)
watch([tab, selectedMonth], ([t]) => { if (t === 'dues') loadDues() })
</script>

<template>
  <div>
    <h2 class="font-bold text-navy mb-4">회비 관리</h2>

    <div class="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'match' ? 'bg-navy text-white' : 'text-gray-500'"
        @click="tab = 'match'"
      >매치비</button>
      <button
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'dues' ? 'bg-navy text-white' : 'text-gray-500'"
        @click="tab = 'dues'"
      >월회비</button>
    </div>

    <!-- 매치비 -->
    <div v-if="tab === 'match'" class="space-y-3">
      <div class="bg-white rounded-2xl shadow p-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <label class="text-xs text-gray-500 block">
            경기 선택
            <select v-model="selectedMatchId" class="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm">
              <option v-for="m in finishedMatches" :key="m.id" :value="m.id">
                {{ formatDate(m.date, 'YYYY.MM.DD') }} vs {{ m.opponent }}
              </option>
            </select>
          </label>
          <label class="text-xs text-gray-500 block">
            매치비 금액
            <input
              v-model.number="matchFeeAmount"
              type="number"
              min="0"
              class="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">
            출전 {{ matchStats.total }}명 ·
            <span class="text-green-600 font-semibold">납부 {{ matchStats.paid }}</span> ·
            <span class="text-dokkaebi font-semibold">미납 {{ matchStats.unpaid }}</span>
          </span>
          <span class="flex gap-1">
            <button class="px-2 py-1 rounded bg-green-100 text-green-700" @click="markAllMatch(true)">전체 납부</button>
            <button class="px-2 py-1 rounded bg-gray-100 text-gray-600" @click="markAllMatch(false)">전체 초기화</button>
          </span>
        </div>
      </div>

      <LoadingSpinner v-if="loading" />
      <EmptyState v-else-if="!selectedMatch" icon="💸" title="경기를 선택하세요" />
      <EmptyState v-else-if="matchAttendees.length === 0" icon="👥" title="출전 명단이 비어 있습니다" />
      <ul v-else class="space-y-2">
        <li
          v-for="p in matchAttendees"
          :key="p.id"
          class="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3"
          :class="{ 'opacity-100': matchPayments[p.id]?.paid, 'opacity-90': !matchPayments[p.id]?.paid }"
        >
          <PlayerAvatar :player="p" :size="36" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              <span v-if="p.isRegular" class="text-amber-500">★</span>
              {{ p.name }}
              <span class="text-xs text-gray-400">#{{ p.number ?? '-' }}</span>
            </p>
            <p v-if="matchPayments[p.id]?.paidAt" class="text-[11px] text-gray-400">
              {{ formatDate(matchPayments[p.id].paidAt, 'YYYY.MM.DD HH:mm') }} ·
              {{ matchPayments[p.id].amount?.toLocaleString() }}원
            </p>
          </div>
          <button
            class="text-xs px-3 py-1.5 rounded-full font-semibold"
            :class="matchPayments[p.id]?.paid ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="toggleMatchPaid(p.id)"
          >
            {{ matchPayments[p.id]?.paid ? '납부 완료' : '미납' }}
          </button>
        </li>
      </ul>
    </div>

    <!-- 월회비 -->
    <div v-else class="space-y-3">
      <div class="bg-white rounded-2xl shadow p-4 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <label class="text-xs text-gray-500 block">
            월 선택
            <select v-model="selectedMonth" class="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm">
              <option v-for="m in monthOptions" :key="m" :value="m">{{ monthLabel(m) }}</option>
            </select>
          </label>
          <label class="text-xs text-gray-500 block">
            회비 금액
            <input
              v-model.number="duesAmount"
              type="number"
              min="0"
              class="w-full mt-1 border rounded-lg px-2 py-1.5 text-sm"
              placeholder="예: 30000"
            />
          </label>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">
            고정멤버 {{ duesStats.total }}명 ·
            <span class="text-green-600 font-semibold">납부 {{ duesStats.paid }}</span> ·
            <span class="text-dokkaebi font-semibold">미납 {{ duesStats.unpaid }}</span>
          </span>
          <span class="flex gap-1">
            <button class="px-2 py-1 rounded bg-green-100 text-green-700" @click="markAllDues(true)">전체 납부</button>
            <button class="px-2 py-1 rounded bg-gray-100 text-gray-600" @click="markAllDues(false)">전체 초기화</button>
          </span>
        </div>
      </div>

      <LoadingSpinner v-if="loading" />
      <ul v-else class="space-y-2">
        <li
          v-for="p in regulars"
          :key="p.id"
          class="flex items-center gap-3 bg-white rounded-xl shadow-sm p-3"
        >
          <PlayerAvatar :player="p" :size="36" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              <span class="text-amber-500">★</span> {{ p.name }}
              <span class="text-xs text-gray-400">#{{ p.number ?? '-' }}</span>
            </p>
            <p v-if="duesPayments[p.id]?.paidAt" class="text-[11px] text-gray-400">
              {{ formatDate(duesPayments[p.id].paidAt, 'YYYY.MM.DD HH:mm') }} ·
              {{ duesPayments[p.id].amount?.toLocaleString() }}원
            </p>
          </div>
          <button
            class="text-xs px-3 py-1.5 rounded-full font-semibold"
            :class="duesPayments[p.id]?.paid ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            @click="toggleDuesPaid(p.id)"
          >
            {{ duesPayments[p.id]?.paid ? '납부 완료' : '미납' }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
