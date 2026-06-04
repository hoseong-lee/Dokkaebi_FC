<script setup>
import { ref, computed, watchEffect } from 'vue'
import { fetchDailyForecast, forecastForDate, iconUrl, isRainRisk, isWeatherEnabled } from '@/utils/weather'
import { isValidCoord } from '@/utils/venues'

const props = defineProps({
  venue: { type: Object, default: null },     // { lat, lng, name }
  matchDate: { type: Number, default: null }  // ms timestamp (선택 — 매치 일자만 강조)
})

const loading = ref(false)
const error = ref('')
const data = ref(null)

const enabled = computed(() => isWeatherEnabled())
const validCoord = computed(() => props.venue && isValidCoord(props.venue.lat, props.venue.lng))
const matchForecast = computed(() => {
  if (!data.value || !props.matchDate) return null
  return forecastForDate(data.value.daily, props.matchDate)
})

watchEffect(async () => {
  if (!enabled.value || !validCoord.value) return
  loading.value = true
  error.value = ''
  try {
    data.value = await fetchDailyForecast(props.venue.lat, props.venue.lng)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`
}
</script>

<template>
  <section v-if="enabled && validCoord" class="bg-white rounded-2xl shadow p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-navy flex items-center gap-2">🌤 5일 날씨</h3>
      <span v-if="venue?.name" class="text-[11px] text-gray-400 truncate ml-2">{{ venue.name }}</span>
    </div>

    <p v-if="loading" class="text-center text-xs text-gray-400 py-4">날씨 정보 불러오는 중...</p>
    <p v-else-if="error" class="text-xs text-rose-600 bg-rose-50 rounded p-2">⚠ {{ error }}</p>

    <!-- 경기일 강조 (매치 상세에서만 보임) -->
    <div
      v-if="matchForecast"
      class="rounded-xl p-3 flex items-center gap-3"
      :class="isRainRisk(matchForecast) ? 'bg-amber-50 ring-1 ring-amber-300' : 'bg-blue-50 ring-1 ring-blue-200'"
    >
      <img :src="iconUrl(matchForecast.icon)" :alt="matchForecast.desc" class="w-16 h-16" />
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-500 font-semibold">⚽ 경기일 ({{ dayLabel(matchForecast.date) }})</p>
        <p class="text-sm font-bold text-onyx truncate">{{ matchForecast.desc }}</p>
        <p class="text-xs text-gray-600 mt-0.5">
          <span class="font-bold text-rose-600">{{ matchForecast.tempMax }}°</span>
          <span class="text-gray-400 mx-1">/</span>
          <span class="font-bold text-blue-600">{{ matchForecast.tempMin }}°</span>
          <span class="mx-2">·</span>
          <span :class="isRainRisk(matchForecast) ? 'font-bold text-amber-700' : ''">
            🌧 {{ matchForecast.pop }}%
          </span>
        </p>
      </div>
      <p v-if="isRainRisk(matchForecast)" class="text-[10px] font-bold text-amber-700 shrink-0">⚠ 우천 위험</p>
    </div>

    <!-- 5일 미니 카드 -->
    <div v-if="data?.daily?.length" class="grid grid-cols-5 gap-1">
      <div
        v-for="d in data.daily" :key="d.date"
        class="bg-gray-50 rounded-lg p-1.5 text-center"
      >
        <p class="text-[9px] text-gray-500 leading-tight">{{ dayLabel(d.date) }}</p>
        <img :src="iconUrl(d.icon)" :alt="d.desc" class="w-9 h-9 mx-auto" />
        <p class="text-[10px] font-bold tabular-nums">
          <span class="text-rose-600">{{ d.tempMax }}°</span>
          <span class="text-blue-600 ml-0.5">{{ d.tempMin }}°</span>
        </p>
        <p class="text-[9px]" :class="d.pop >= 70 ? 'font-bold text-amber-700' : 'text-gray-400'">
          {{ d.pop }}%
        </p>
      </div>
    </div>
  </section>
</template>
