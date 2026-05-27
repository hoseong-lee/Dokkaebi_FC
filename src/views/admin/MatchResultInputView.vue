<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import QuickResultInput from '@/components/match/QuickResultInput.vue'

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
  notes: ''
})

async function load() {
  loading.value = true
  await playersStore.fetchAll()
  match.value = await store.fetchOne(route.params.id)
  if (match.value) {
    // 기존 결과가 있으면 프리필 (수정 모드)
    result.lineup = [...(match.value.lineup || [])]
    result.events = (match.value.events || []).map((e) => ({ ...e }))
    result.momPlayerId = match.value.momPlayerId || null
    result.opponentScore = match.value.score?.opponent ?? 0
    result.notes = match.value.notes || ''
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
      notes: result.notes
    })
    // 통계가 바뀌었으니 선수 캐시 갱신
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
  </div>
</template>
