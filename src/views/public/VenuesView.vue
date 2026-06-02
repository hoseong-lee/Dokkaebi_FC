<script setup>
import { ref, onMounted } from 'vue'
import { useVenuesStore } from '@/stores/venues'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { VENUE_TYPE_LABEL, isValidCoord } from '@/utils/venues'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import DirectionsModal from '@/components/match/DirectionsModal.vue'
import VenueEditModal from '@/components/match/VenueEditModal.vue'
import VenueStatsModal from '@/components/match/VenueStatsModal.vue'
import { confirm } from '@/composables/useConfirm'
import { computed } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import { statsForVenue, pickLuckyVenue } from '@/utils/venueStats'

const store = useVenuesStore()
const auth = useAuthStore()
const matchesStore = useMatchesStore()
const toast = useToast()

function venueStats(v) {
  return statsForVenue(v, matchesStore.matches)
}

const luckyVenue = computed(() => pickLuckyVenue(store.venues, matchesStore.matches))

const loading = ref(true)
const seeding = ref(false)
const linking = ref(false)
const directionsOpen = ref(false)
const editOpen = ref(false)
const editingVenue = ref(null)
const selectedVenue = ref(null)
const statsOpen = ref(false)
const statsVenue = ref(null)

async function runAutolink() {
  if (linking.value) return
  linking.value = true
  try {
    const res = await store.autolink()
    await matchesStore.fetchAll({}, true)
    toast.success(`기존 경기 ${res.linked}건을 구장에 자동 연결했습니다.`)
  } catch (e) {
    toast.error(`자동 연결 실패: ${e?.message || e}`)
  } finally {
    linking.value = false
  }
}

function openStats(v) {
  statsVenue.value = v
  statsOpen.value = true
}

function openEdit(v = null) {
  editingVenue.value = v
  editOpen.value = true
}

async function removeVenue(v) {
  const ok = await confirm({
    title: '구장 삭제',
    message: `"${v.name}" 구장을 삭제할까요?\n해당 구장의 누적 경기 통계는 그대로 유지됩니다.`,
    confirmText: '삭제',
    variant: 'danger'
  })
  if (!ok) return
  try {
    await store.remove(v.id)
    toast.success('삭제했습니다.')
  } catch (e) {
    toast.error(`삭제 실패: ${e?.message || e}`)
  }
}

async function load() {
  loading.value = true
  await Promise.all([
    store.fetchAll(true),
    matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll()
  ])
  loading.value = false
}
onMounted(load)

function openDirections(v) {
  selectedVenue.value = v
  directionsOpen.value = true
}

async function importSeed() {
  if (seeding.value) return
  seeding.value = true
  try {
    const res = await store.seed()
    toast.success(`초기 구장 ${res.added}개 등록 완료 (이미 있는 ${res.skipped}개 건너뜀)`)
  } catch (e) {
    toast.error(`초기화 실패: ${e?.message || e}`)
  } finally {
    seeding.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-navy">🗺 우리 구장</h1>
        <p class="text-xs text-gray-500 mt-1">자주 가는 구장 + 길찾기</p>
      </div>
      <div v-if="auth.isAdmin" class="flex gap-1.5 flex-wrap">
        <BaseButton size="sm" variant="secondary" :loading="seeding" @click="importSeed" title="다락원·초안산·창골·수락산·불암산 5개 시드">
          🌱 시드
        </BaseButton>
        <BaseButton size="sm" variant="secondary" :loading="linking" @click="runAutolink" title="기존 경기의 'location' 텍스트와 구장명 매칭 → venueId 자동 연결 + usageCount 갱신">
          🔗 자동 연결
        </BaseButton>
        <BaseButton size="sm" variant="primary" @click="openEdit(null)">+ 구장 등록</BaseButton>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <!-- 행운의 구장 (자동 시상) -->
    <section v-if="!loading && luckyVenue" class="mb-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-2xl shadow-md p-4">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🍀</span>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] font-bold opacity-80 tracking-[0.2em]">LUCKY VENUE</p>
          <p class="font-bold text-base">🏆 행운의 구장 — {{ luckyVenue.venue.name }}</p>
          <p class="text-xs opacity-90 mt-0.5">
            {{ luckyVenue.stats.played }}경기 ·
            {{ luckyVenue.stats.wins }}승 {{ luckyVenue.stats.draws }}무 {{ luckyVenue.stats.losses }}패
            · 승률 <span class="font-bold">{{ Math.round(luckyVenue.stats.winRate * 100) }}%</span>
          </p>
        </div>
      </div>
    </section>

    <EmptyState
      v-else-if="store.venues.length === 0"
      icon="🗺"
      title="등록된 구장이 없어요"
      description="관리자가 '🌱 초기 구장 가져오기' 버튼을 누르면 5개 구장(다락원·초안산·창골·수락산·불암산)이 자동 등록됩니다."
    />

    <div v-else class="space-y-3">
      <article
        v-for="v in store.venues" :key="v.id"
        class="bg-white rounded-2xl shadow p-4"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl shrink-0">{{ VENUE_TYPE_LABEL[v.type]?.split(' ')[0] || '📍' }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-bold text-navy text-base truncate">{{ v.name }}</p>
              <span v-if="v.usageCount" class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                {{ v.usageCount }}경기
              </span>
            </div>
            <p v-if="v.address" class="text-xs text-gray-600">{{ v.address }}</p>
            <p v-if="v.notes" class="text-[11px] text-gray-500 mt-1 leading-relaxed">💡 {{ v.notes }}</p>
            <p v-if="!isValidCoord(v.lat, v.lng)" class="text-[11px] text-amber-600 mt-1">
              ⚠ 좌표가 등록되어 있지 않아 길찾기가 제한됩니다
            </p>
          </div>
        </div>

        <!-- 미니 통계 (정식 경기 기록 있을 때) -->
        <div v-if="venueStats(v).played > 0" class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
          <span class="text-gray-400 shrink-0">📊</span>
          <span class="text-onyx font-semibold">{{ venueStats(v).played }}경기</span>
          <span class="text-blue-600 font-bold">{{ venueStats(v).wins }}승</span>
          <span class="text-gray-500">{{ venueStats(v).draws }}무</span>
          <span class="text-rose-600 font-bold">{{ venueStats(v).losses }}패</span>
          <span class="ml-auto px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold tabular-nums">
            {{ Math.round(venueStats(v).winRate * 100) }}%
          </span>
        </div>
        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            class="flex-1 text-xs py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50"
            :disabled="!isValidCoord(v.lat, v.lng)"
            @click="openDirections(v)"
          >🗺 길찾기</button>
          <button
            v-if="venueStats(v).played > 0"
            type="button"
            class="text-xs px-3 py-2 rounded-lg bg-navy/10 text-navy font-semibold hover:bg-navy/20"
            @click="openStats(v)"
          >📊 상세</button>
          <template v-if="auth.isAdmin">
            <button
              type="button"
              class="text-xs px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              @click="openEdit(v)"
            >✏️</button>
            <button
              type="button"
              class="text-xs px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50"
              @click="removeVenue(v)"
            >🗑</button>
          </template>
        </div>
      </article>
    </div>

    <DirectionsModal v-model="directionsOpen" :venue="selectedVenue" />
    <VenueEditModal v-model="editOpen" :venue="editingVenue" />
    <VenueStatsModal v-model="statsOpen" :venue="statsVenue" />
  </div>
</template>
