<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { dayjs } from '@/utils/date'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'
import { importSeed } from '@/firebase/database'
import seedData from '@/data/seed.json'
import BaseButton from '@/components/common/BaseButton.vue'

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()
const seasonStore = useSeasonStore()
const toast = useToast()

const creatingSeason = ref(false)
const importing = ref(false)

// 결과 미입력: 경기 일시가 지났는데 아직 scheduled 인 경기
const pendingResults = computed(() =>
  matchesStore.matches.filter(
    (m) => m.status === 'scheduled' && dayjs(m.date?.toDate?.() || m.date).isBefore(dayjs())
  )
)

const thisWeek = computed(() => {
  const end = dayjs().add(7, 'day')
  return matchesStore.upcoming.filter((m) => dayjs(m.date?.toDate?.() || m.date).isBefore(end))
})

async function createSeason() {
  creatingSeason.value = true
  try {
    const year = dayjs().year()
    await seasonStore.create({
      name: `${year} 시즌`,
      startDate: dayjs(`${year}-01-01`).valueOf(),
      endDate: dayjs(`${year}-12-31`).valueOf(),
      active: true
    })
    toast.success(`${year} 시즌을 생성했습니다.`)
  } catch {
    toast.error('시즌 생성 중 오류가 발생했습니다.')
  } finally {
    creatingSeason.value = false
  }
}

const seedCounts = {
  players: Object.keys(seedData.players || {}).length,
  matches: Object.keys(seedData.matches || {}).length
}

async function runImport() {
  const ok = await confirm({
    title: '초기 데이터 가져오기',
    message: `카카오톡 기록 기반 선수 ${seedCounts.players}명 · 경기 ${seedCounts.matches}건을 가져옵니다.\n기존 선수/경기/시즌 데이터를 덮어씁니다. 계속할까요?`,
    confirmText: '가져오기',
    variant: 'primary'
  })
  if (!ok) return
  importing.value = true
  try {
    await importSeed(seedData)
    await Promise.all([
      seasonStore.refresh(),
      playersStore.fetchAll(true),
      matchesStore.fetchAll({}, true)
    ])
    toast.success('초기 데이터를 가져왔습니다.')
  } catch (e) {
    console.error(e)
    toast.error(`가져오기 실패: ${e?.code || e?.message || e}`)
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  await seasonStore.ensure()
  matchesStore.fetchAll()
  playersStore.fetchAll()
})
</script>

<template>
  <div class="space-y-5">
    <!-- 시즌 부트스트랩 -->
    <div
      v-if="!seasonStore.activeSeason"
      class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm"
    >
      <p class="font-medium text-amber-800">활성 시즌이 없습니다.</p>
      <p class="text-amber-700 mt-1">통계 집계를 위해 시즌을 먼저 생성하세요.</p>
      <BaseButton size="sm" class="mt-2" :loading="creatingSeason" @click="createSeason">
        올해 시즌 생성
      </BaseButton>
    </div>

    <!-- 초기 데이터 가져오기 (선수가 없을 때) -->
    <div
      v-if="playersStore.loaded && playersStore.players.length === 0"
      class="bg-navy/5 border border-navy/20 rounded-xl p-4 text-sm"
    >
      <p class="font-medium text-navy">초기 데이터 가져오기</p>
      <p class="text-gray-500 mt-1">
        카카오톡 기록 기반 선수 {{ seedCounts.players }}명 · 경기 {{ seedCounts.matches }}건을 한 번에 등록합니다.
      </p>
      <BaseButton size="sm" class="mt-2" :loading="importing" @click="runImport">
        데이터 가져오기
      </BaseButton>
    </div>

    <!-- 요약 카드 -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-navy">{{ playersStore.players.length }}</p>
        <p class="text-xs text-gray-400 mt-1">선수</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-navy">{{ matchesStore.upcoming.length }}</p>
        <p class="text-xs text-gray-400 mt-1">예정 경기</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-dokkaebi">{{ pendingResults.length }}</p>
        <p class="text-xs text-gray-400 mt-1">결과 미입력</p>
      </div>
    </div>

    <!-- 빠른 액션 -->
    <div class="flex gap-2">
      <RouterLink to="/admin/matches/new" class="flex-1">
        <BaseButton block>+ 경기 등록</BaseButton>
      </RouterLink>
      <RouterLink to="/admin/players" class="flex-1">
        <BaseButton variant="secondary" block>선수 관리</BaseButton>
      </RouterLink>
    </div>

    <!-- 결과 미입력 -->
    <section v-if="pendingResults.length">
      <h2 class="font-bold text-navy mb-2">결과 입력 필요</h2>
      <ul class="space-y-2">
        <li
          v-for="m in pendingResults"
          :key="m.id"
          class="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium truncate">vs {{ m.opponent }}</p>
            <p class="text-xs text-gray-400">{{ formatDateTime(m.date) }}</p>
          </div>
          <RouterLink :to="`/admin/matches/${m.id}/result`">
            <BaseButton variant="danger" size="sm">결과 입력</BaseButton>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- 이번 주 경기 -->
    <section v-if="thisWeek.length">
      <h2 class="font-bold text-navy mb-2">이번 주 경기</h2>
      <ul class="space-y-2">
        <li
          v-for="m in thisWeek"
          :key="m.id"
          class="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium truncate">vs {{ m.opponent }}</p>
            <p class="text-xs text-gray-400">{{ formatDateTime(m.date) }}</p>
          </div>
          <RouterLink :to="`/matches/${m.id}`" class="text-xs text-navy">상세</RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
