<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { POSITION_LABEL } from '@/utils/positions'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({
  player: { type: Object, required: true }
})

// 샘플 사진 매핑 — photoURL 등록 전 임시. admin 에서 등록하면 자동 우선됨.
const SAMPLE_PHOTOS = {
  '유희창': (import.meta.env.BASE_URL || '/') + 'sample-yuheechang.png'
}

const photoSrc = computed(() => {
  if (props.player?.photoURL) return props.player.photoURL
  return SAMPLE_PHOTOS[props.player?.name] || null
})

const positionLabel = computed(() => {
  const p = props.player
  return POSITION_LABEL[p?.mainPosition] || POSITION_LABEL[p?.position] || p?.mainPosition || '선수'
})
</script>

<template>
  <RouterLink
    :to="`/players/${player.id}`"
    class="block relative bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 rounded-2xl shadow-lg overflow-hidden ring-1 ring-rose-900/30 hover:shadow-xl transition-shadow"
  >
    <!-- 우측 선수 큰 사진 -->
    <div class="absolute right-0 top-0 bottom-0 w-1/2 flex items-end justify-end pointer-events-none">
      <img
        v-if="photoSrc"
        :src="photoSrc"
        :alt="player.name"
        referrerpolicy="no-referrer"
        class="h-full w-full object-cover object-center opacity-95"
      />
      <div v-else class="h-full w-full flex items-end justify-center pb-4 opacity-90">
        <PlayerAvatar :player="player" :size="160" />
      </div>
      <!-- 왼쪽으로 갈수록 어두워지는 그라데이션 (텍스트 가독성) -->
      <div class="absolute inset-0 bg-gradient-to-r from-rose-700 via-rose-700/40 to-transparent"></div>
    </div>

    <!-- 좌측 텍스트 -->
    <div class="relative z-10 p-5 sm:p-6 min-h-[220px] flex flex-col justify-between max-w-[60%]">
      <div>
        <p class="text-white/80 text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">DOKKAEBI FC</p>
        <h2 class="text-3xl sm:text-4xl font-black text-white leading-tight mt-2 tracking-tight">
          {{ player.name }}
        </h2>
        <p class="text-white/85 text-sm sm:text-base font-medium mt-1">{{ positionLabel }}</p>
        <span class="inline-block mt-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] text-white font-bold">
          상세 보기 →
        </span>
      </div>
      <div class="border-t border-white/25 pt-3 mt-4">
        <p class="text-white font-bold flex items-center gap-1.5 text-sm sm:text-base">
          <span class="text-lg sm:text-xl">⭐</span>
          <span class="tracking-wide">Man of the Match</span>
        </p>
      </div>
    </div>
  </RouterLink>
</template>
