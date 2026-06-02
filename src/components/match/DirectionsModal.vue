<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import {
  naverDirectionsUrl,
  naverAppUrl,
  kakaoDirectionsUrl,
  googleDirectionsUrl,
  staticMapUrl,
  isValidCoord
} from '@/utils/venues'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  venue: { type: Object, default: null }  // { name, address, lat, lng, notes }
})
const emit = defineEmits(['update:modelValue'])

const v = computed(() => props.venue || {})
const valid = computed(() => isValidCoord(v.value.lat, v.value.lng))
const mapImg = computed(() =>
  valid.value ? staticMapUrl({ lat: v.value.lat, lng: v.value.lng, zoom: 15, width: 640, height: 320 }) : ''
)
const naverWeb = computed(() => valid.value ? naverDirectionsUrl(v.value) : '')
const naverApp = computed(() => valid.value ? naverAppUrl(v.value) : '')
const kakaoWeb = computed(() => valid.value ? kakaoDirectionsUrl(v.value) : '')
const googleWeb = computed(() => valid.value ? googleDirectionsUrl(v.value) : '')
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="🗺 길찾기">
    <div v-if="!valid" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      이 구장의 좌표가 등록되어 있지 않아 길찾기를 제공할 수 없어요.
      관리자에게 구장 등록을 요청하세요.
    </div>
    <div v-else class="space-y-3">
      <!-- 구장 정보 -->
      <div class="bg-gray-50 rounded-lg p-3">
        <p class="font-bold text-navy text-base">📍 {{ v.name }}</p>
        <p v-if="v.address" class="text-xs text-gray-600 mt-0.5">{{ v.address }}</p>
        <p v-if="v.notes" class="text-[11px] text-gray-500 mt-1">💡 {{ v.notes }}</p>
      </div>

      <!-- 지도 미리보기 (OpenStreetMap 정적, API 키 X) -->
      <div class="aspect-[2/1] bg-gray-100 rounded-lg overflow-hidden ring-1 ring-gray-200">
        <img :src="mapImg" :alt="v.name" class="w-full h-full object-cover" loading="lazy" referrerpolicy="no-referrer" />
      </div>

      <!-- 길찾기 옵션 — 네이버지도 우선 -->
      <div class="space-y-2">
        <p class="text-[11px] text-gray-400 font-semibold">📲 어떤 지도 앱으로 길찾기 할까요?</p>

        <a
          :href="naverWeb" target="_blank" rel="noopener"
          class="block w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold flex items-center justify-between"
        >
          <span>🟢 네이버 지도</span>
          <span class="text-xs opacity-80">↗ 길찾기</span>
        </a>
        <a
          :href="naverApp"
          class="block w-full px-4 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700 text-sm font-semibold flex items-center justify-between"
        >
          <span>🟢 네이버 지도 앱으로</span>
          <span class="text-[10px] opacity-70">앱 설치 필요</span>
        </a>
        <a
          :href="kakaoWeb" target="_blank" rel="noopener"
          class="block w-full px-4 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 transition-colors text-onyx font-bold flex items-center justify-between"
        >
          <span>🟡 카카오 맵</span>
          <span class="text-xs opacity-80">↗ 길찾기</span>
        </a>
        <a
          :href="googleWeb" target="_blank" rel="noopener"
          class="block w-full px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-white font-bold flex items-center justify-between"
        >
          <span>🔵 Google 맵스</span>
          <span class="text-xs opacity-80">↗ 길찾기</span>
        </a>
      </div>

      <p class="text-[11px] text-gray-400 leading-relaxed">
        💡 클릭하면 출발지(현재 위치) → 경기장 길찾기가 본인 지도 앱에서 자동으로 열려요.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('update:modelValue', false)">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
