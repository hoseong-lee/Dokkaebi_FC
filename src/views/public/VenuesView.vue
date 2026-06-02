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

const store = useVenuesStore()
const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const seeding = ref(false)
const directionsOpen = ref(false)
const selectedVenue = ref(null)

async function load() {
  loading.value = true
  await store.fetchAll(true)
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
      <BaseButton v-if="auth.isAdmin" size="sm" variant="secondary" :loading="seeding" @click="importSeed">
        🌱 초기 구장 가져오기
      </BaseButton>
    </div>

    <LoadingSpinner v-if="loading" />

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
        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            class="flex-1 text-xs py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50"
            :disabled="!isValidCoord(v.lat, v.lng)"
            @click="openDirections(v)"
          >🗺 길찾기</button>
        </div>
      </article>
    </div>

    <DirectionsModal v-model="directionsOpen" :venue="selectedVenue" />
  </div>
</template>
