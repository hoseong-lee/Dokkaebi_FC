<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { updateMatch } from '@/firebase/database'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SquadMaker from '@/components/match/SquadMaker.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const playersStore = usePlayersStore()
const toast = useToast()

const match = ref(null)
const loading = ref(true)
const saving = ref(false)

function emptySquad() {
  return { lineup: [], formation: '', positions: {} }
}
const squads = reactive([emptySquad(), emptySquad(), emptySquad(), emptySquad()])

function loadInto(i, src) {
  squads[i].lineup = [...(src?.lineup || [])]
  squads[i].formation = src?.formation || ''
  squads[i].positions = { ...(src?.positions || {}) }
}

async function load() {
  loading.value = true
  await playersStore.fetchAll()
  match.value = await store.fetchOne(route.params.id)
  if (match.value) {
    if (Array.isArray(match.value.plannedSquads)) {
      for (let i = 0; i < 4; i++) loadInto(i, match.value.plannedSquads[i])
    } else if (match.value.plannedSquad) {
      // legacy: 단일 plannedSquad → 1쿼터로
      loadInto(0, match.value.plannedSquad)
    }
  }
  loading.value = false
}
onMounted(load)

async function save() {
  saving.value = true
  try {
    await updateMatch(match.value.id, {
      plannedSquads: squads.map((s) => ({
        lineup: s.lineup,
        formation: s.formation || null,
        positions: s.positions || {}
      })),
      plannedSquad: null // legacy 정리
    })
    toast.success('스쿼드를 저장했습니다.')
    router.push(`/matches/${match.value.id}`)
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingSpinner v-if="loading" label="불러오는 중..." />
  <div v-else-if="!match" class="text-center text-gray-400 dark:text-zinc-500 py-10">경기를 찾을 수 없습니다.</div>
  <div v-else>
    <div class="mb-4">
      <h2 class="font-bold text-navy dark:text-zinc-100">스쿼드 메이커</h2>
      <p class="text-sm text-gray-500 dark:text-zinc-400">vs {{ match.opponent }} · {{ formatDateTime(match.date) }}</p>
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
      <SquadMaker :squads="squads" :players="playersStore.activePlayers" :match="match" />
    </div>

    <div class="flex gap-2 mt-4">
      <BaseButton variant="secondary" block @click="router.back()">취소</BaseButton>
      <BaseButton :loading="saving" block @click="save">스쿼드 저장</BaseButton>
    </div>
  </div>
</template>
