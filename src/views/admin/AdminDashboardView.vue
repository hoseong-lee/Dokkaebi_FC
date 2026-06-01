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
import { importSeed, migrateSeasonsByYear, migrateOpponentNames, recomputeAllStats } from '@/firebase/database'
import { canonicalOpponent } from '@/utils/opponentNormalize'
import seedData from '@/data/seed.json'
import BaseButton from '@/components/common/BaseButton.vue'

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()
const seasonStore = useSeasonStore()
const toast = useToast()

const creatingSeason = ref(false)
const importing = ref(false)
const migrating = ref(false)
const normalizing = ref(false)
const recomputing = ref(false)

async function runRecomputeStats() {
  const ok = await confirm({
    title: '전체 통계 재계산',
    message:
      '모든 선수의 출전·골·어시·MOM 통계를 전체 경기로부터 처음부터 다시 계산합니다.\n경기 데이터는 그대로 유지되며, 잘못 누적된 통계가 정정됩니다.\n진행할까요?',
    confirmText: '재계산',
    variant: 'primary'
  })
  if (!ok) return
  recomputing.value = true
  try {
    const res = await recomputeAllStats()
    await playersStore.fetchAll(true)
    toast.success(`재계산 완료: 선수 ${res.players}명 · 경기 ${res.matches}개`)
  } catch (e) {
    toast.error(`재계산 실패: ${e?.code || e?.message || e}`)
  } finally {
    recomputing.value = false
  }
}

// 상대팀명 동의어(국대FC/FC국대 등) 자동 감지
const opponentVariants = computed(() => {
  const seen = new Map() // canonical → Set(variants)
  for (const m of matchesStore.matches) {
    if (!m.opponent) continue
    const c = canonicalOpponent(m.opponent)
    if (c !== m.opponent) {
      if (!seen.has(c)) seen.set(c, new Set())
      seen.get(c).add(m.opponent)
    }
  }
  return [...seen.entries()].map(([canonical, variants]) => ({
    canonical, variants: [...variants]
  }))
})
const needsOpponentNormalize = computed(() => opponentVariants.value.length > 0)

async function runNormalize() {
  const ok = await confirm({
    title: '상대팀명 정규화',
    message:
      '동의어로 분류된 상대팀명을 통일합니다.\n예: 국대FC / FC국대 → 국대FC.\n경기 데이터는 그대로 유지됩니다.',
    confirmText: '정규화',
    variant: 'primary'
  })
  if (!ok) return
  normalizing.value = true
  try {
    const res = await migrateOpponentNames()
    await matchesStore.fetchAll({}, true)
    toast.success(`${res.changed}건의 상대팀명을 통일했습니다.`)
  } catch (e) {
    toast.error(`정규화 실패: ${e?.code || e?.message || e}`)
  } finally {
    normalizing.value = false
  }
}

// 옛 시즌(s{YYYY} 패턴이 아닌 것 — 예: s2526)이 있으면 분리 마이그레이션 권장
const legacySeasons = computed(() =>
  seasonStore.seasons.filter((s) => !/^s\d{4}$/.test(s.id))
)
const needsMigration = computed(() => legacySeasons.value.length > 0)

async function runMigration() {
  const ok = await confirm({
    title: '시즌 연도별 분리',
    message:
      '옛 단일 시즌을 일시 연도 기준으로 분리합니다.\n경기·선수 데이터는 그대로 두고 seasonId 와 시즌별 통계만 재계산됩니다.\n진행할까요?',
    confirmText: '분리 실행',
    variant: 'primary'
  })
  if (!ok) return
  migrating.value = true
  try {
    const res = await migrateSeasonsByYear()
    await Promise.all([
      seasonStore.refresh(),
      playersStore.fetchAll(true),
      matchesStore.fetchAll({}, true)
    ])
    toast.success(
      `시즌을 ${res.years.join(', ')}년으로 분리했습니다.${res.legacyRemoved.length ? ` (옛 시즌 ${res.legacyRemoved.length}개 정리)` : ''}`
    )
  } catch (e) {
    console.error(e)
    toast.error(`마이그레이션 실패: ${e?.code || e?.message || e}`)
  } finally {
    migrating.value = false
  }
}

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
    <!-- 상대팀명 정규화 안내 -->
    <div
      v-if="needsOpponentNormalize"
      class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-sm"
    >
      <p class="font-bold text-amber-800">🏷 상대팀명 정규화 필요</p>
      <p class="text-gray-700 mt-1">
        같은 팀이 다른 이름으로 분류된 경우가 있어요:
      </p>
      <ul class="text-xs text-gray-600 mt-1 ml-3 list-disc">
        <li v-for="v in opponentVariants" :key="v.canonical">
          <span class="font-semibold text-amber-700">{{ v.canonical }}</span>
          ← {{ v.variants.join(', ') }}
        </li>
      </ul>
      <BaseButton size="sm" variant="primary" class="mt-3" :loading="normalizing" @click="runNormalize">
        상대팀명 통일 실행
      </BaseButton>
    </div>

    <!-- 통계 재계산 (안전망 / 정정용) -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
      <p class="font-bold text-emerald-800">📊 전체 통계 재계산</p>
      <p class="text-gray-700 mt-1">
        모든 선수의 <span class="font-semibold">출전·골·어시·MOM</span> 통계를 전체 경기로부터 처음부터 다시 계산합니다.
        경기 삭제 후 통계가 안 맞거나, 누적된 수치에 의심이 들 때 실행하세요.
      </p>
      <p class="text-xs text-gray-500 mt-1">경기 데이터는 그대로 유지됩니다.</p>
      <BaseButton size="sm" variant="primary" class="mt-3" :loading="recomputing" @click="runRecomputeStats">
        🔁 통계 재계산 실행
      </BaseButton>
    </div>

    <!-- 시즌 연도별 분리 안내 (옛 시즌 감지 시) -->
    <div
      v-if="needsMigration"
      class="bg-dokkaebi/10 border-2 border-dokkaebi/40 rounded-xl p-4 text-sm"
    >
      <p class="font-bold text-dokkaebi">⚠ 시즌 분리 필요</p>
      <p class="text-gray-700 mt-1">
        옛 단일 시즌(<span class="font-mono text-xs">{{ legacySeasons.map(s => s.name).join(', ') }}</span>)이
        남아 있어 시즌 드롭다운에 한 옵션만 보입니다.
        연도별(2025년·2026년)로 분리하면 각 연도만 따로 볼 수 있게 됩니다.
        <br>경기·선수 데이터는 그대로 두고 시즌 정보·통계만 재계산됩니다.
      </p>
      <BaseButton size="sm" variant="danger" class="mt-3" :loading="migrating" @click="runMigration">
        시즌 연도별 분리 실행
      </BaseButton>
    </div>

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

    <!-- 초기 데이터 가져오기 / 다시 가져오기 -->
    <div
      v-if="playersStore.loaded"
      class="bg-navy/5 border border-navy/20 rounded-xl p-4 text-sm"
    >
      <p class="font-medium text-navy">
        {{ playersStore.players.length === 0 ? '초기 데이터 가져오기' : '데이터 다시 가져오기' }}
      </p>
      <p class="text-gray-500 mt-1">
        카카오톡 기록 기반 선수 {{ seedCounts.players }}명 · 경기 {{ seedCounts.matches }}건(4쿼터 기록 포함)을 등록합니다.
        <span v-if="playersStore.players.length > 0" class="text-dokkaebi">기존 선수·경기·시즌을 덮어씁니다.</span>
      </p>
      <BaseButton size="sm" class="mt-2" :loading="importing" @click="runImport">
        {{ playersStore.players.length === 0 ? '데이터 가져오기' : '다시 가져오기' }}
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
