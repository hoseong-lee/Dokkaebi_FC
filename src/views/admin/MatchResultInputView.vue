<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { formatDateTime } from '@/utils/date'
import { FORMATION_NAMES, getSlots } from '@/utils/formations'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import QuickResultInput from '@/components/match/QuickResultInput.vue'
import FormationPitch from '@/components/match/FormationPitch.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const playersStore = usePlayersStore()
const toast = useToast()

const match = ref(null)
const loading = ref(true)
const saving = ref(false)

const result = reactive({
  lineup: [],
  events: [],
  momPlayerId: null,
  opponentScore: 0,
  notes: '',
  formation: '',
  positions: {}
})

// 슬롯 배치 모달
const slotModalOpen = ref(false)
const activeSlot = ref(null)

const formationNames = FORMATION_NAMES

function openSlot(slot) {
  activeSlot.value = slot
  slotModalOpen.value = true
}

// 한 선수는 한 슬롯에만. 배치 시 기존 슬롯에서 제거하고 lineup 에 추가.
function assignToSlot(playerId) {
  if (!activeSlot.value) return
  const next = { ...result.positions }
  for (const [sid, pid] of Object.entries(next)) {
    if (pid === playerId) delete next[sid]
  }
  next[activeSlot.value.id] = playerId
  result.positions = next
  if (!result.lineup.includes(playerId)) result.lineup = [...result.lineup, playerId]
  slotModalOpen.value = false
}

function clearSlot() {
  if (!activeSlot.value) return
  const next = { ...result.positions }
  delete next[activeSlot.value.id]
  result.positions = next
  slotModalOpen.value = false
}

// 포메이션 변경 시 현재 포메이션에 없는 슬롯 배치는 정리
function onFormationChange() {
  const validIds = new Set(getSlots(result.formation).map((s) => s.id))
  const next = {}
  for (const [sid, pid] of Object.entries(result.positions)) {
    if (validIds.has(sid)) next[sid] = pid
  }
  result.positions = next
}

const assignedCount = computed(() => Object.keys(result.positions).length)

async function load() {
  loading.value = true
  await playersStore.fetchAll()
  match.value = await store.fetchOne(route.params.id)
  if (match.value) {
    result.lineup = [...(match.value.lineup || [])]
    result.events = (match.value.events || []).map((e) => ({ ...e }))
    result.momPlayerId = match.value.momPlayerId || null
    result.opponentScore = match.value.score?.opponent ?? 0
    result.notes = match.value.notes || ''
    result.formation = match.value.formation || ''
    result.positions = { ...(match.value.positions || {}) }
  }
  loading.value = false
}

async function submit() {
  if (result.lineup.length === 0) {
    return toast.error('출전 선수를 1명 이상 선택하세요.')
  }
  saving.value = true
  try {
    await store.submitResult(match.value.id, {
      lineup: result.lineup,
      events: result.events.map((e) => ({
        minute: Number(e.minute) || 0,
        type: e.type,
        playerId: e.playerId,
        assistPlayerId: e.assistPlayerId || null
      })),
      momPlayerId: result.momPlayerId,
      score: {
        dokkaebi: result.events.filter((e) => e.type === 'goal').length,
        opponent: Number(result.opponentScore) || 0
      },
      notes: result.notes,
      formation: result.formation || null,
      positions: result.positions || {}
    })
    await playersStore.fetchAll(true)
    toast.success('경기 결과를 저장했습니다.')
    router.push(`/matches/${match.value.id}`)
  } catch (e) {
    console.error(e)
    toast.error('결과 저장 중 오류가 발생했습니다.')
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
      <h2 class="font-bold text-navy">결과 입력</h2>
      <p class="text-sm text-gray-500">
        vs {{ match.opponent }} · {{ formatDateTime(match.date) }}
      </p>
    </div>

    <div class="bg-white rounded-2xl shadow p-5">
      <QuickResultInput
        :players="playersStore.activePlayers"
        v-model:lineup="result.lineup"
        v-model:events="result.events"
        v-model:mom-player-id="result.momPlayerId"
        v-model:opponent-score="result.opponentScore"
      />

      <!-- 포메이션 -->
      <div class="mt-6 pt-5 border-t">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-navy">포메이션</h3>
          <select
            v-model="result.formation"
            class="border rounded-lg px-3 py-1.5 text-sm"
            @change="onFormationChange"
          >
            <option value="">선택 안 함</option>
            <option v-for="f in formationNames" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <template v-if="result.formation">
          <p class="text-xs text-gray-400 mb-2">
            슬롯을 탭해서 출전 선수를 배치하세요. ({{ assignedCount }}/11)
          </p>
          <FormationPitch
            :formation="result.formation"
            :positions="result.positions"
            :players="playersStore.players"
            editable
            @slot-click="openSlot"
          />
        </template>
        <p v-else class="text-xs text-gray-400">포메이션을 선택하면 선수를 배치할 수 있습니다.</p>
      </div>

      <div class="mt-5">
        <label class="block text-xs text-gray-500 mb-1">경기 후기 (선택)</label>
        <textarea
          v-model="result.notes"
          rows="3"
          class="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="경기 후기를 남겨보세요."
        />
      </div>
    </div>

    <div class="flex gap-2 mt-4">
      <BaseButton variant="secondary" block @click="router.back()">취소</BaseButton>
      <BaseButton variant="danger" :loading="saving" block @click="submit">결과 저장</BaseButton>
    </div>

    <!-- 슬롯 배치 모달 -->
    <BaseModal v-model="slotModalOpen" :title="`${activeSlot?.role || ''} 자리에 배치`">
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="p in playersStore.activePlayers"
          :key="p.id"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-lg border text-center hover:bg-gray-50"
          @click="assignToSlot(p.id)"
        >
          <span class="w-9 h-9 rounded-full bg-navy/10 text-navy flex items-center justify-center text-xs font-bold">
            {{ p.number ?? p.name.charAt(0) }}
          </span>
          <span class="text-[11px] truncate w-full">{{ p.name }}</span>
        </button>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="clearSlot">이 자리 비우기</BaseButton>
        <BaseButton variant="secondary" @click="slotModalOpen = false">닫기</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
