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
    class="block relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-amber-500/40 hover:ring-amber-400/70 hover:shadow-amber-500/20 transition-all"
  >
    <!-- 미세한 금색 라디얼 highlight (사진 뒤쪽 후광) -->
    <div class="absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_right_center,rgba(245,158,11,0.18),transparent_60%)]"></div>
    </div>

    <!-- 우측 선수 큰 사진 (누끼) -->
    <div class="absolute right-0 top-0 bottom-0 w-[55%] flex items-end justify-end pointer-events-none">
      <img
        v-if="photoSrc"
        :src="photoSrc"
        :alt="player.name"
        referrerpolicy="no-referrer"
        class="h-full w-full object-contain object-bottom drop-shadow-2xl"
      />
      <div v-else class="h-full w-full flex items-end justify-center pb-4 opacity-90">
        <PlayerAvatar :player="player" :size="160" />
      </div>
      <!-- 왼쪽으로 갈수록 검정으로 페이드 (텍스트 가독성) -->
      <div class="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
    </div>

    <!-- 좌측 텍스트 -->
    <div class="relative z-10 p-5 sm:p-6 min-h-[240px] flex flex-col justify-between max-w-[60%]">
      <div>
        <p class="text-amber-400/90 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">DOKKAEBI FC</p>
        <h2 class="text-3xl sm:text-4xl font-black leading-tight mt-2 tracking-tight bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          {{ player.name }}
        </h2>
        <p class="text-zinc-300 text-sm sm:text-base font-medium mt-1">{{ positionLabel }}</p>
        <span class="inline-block mt-3 bg-amber-400/10 ring-1 ring-amber-400/40 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] text-amber-300 font-bold">
          상세 보기 →
        </span>
      </div>
      <div class="border-t border-amber-500/30 pt-3 mt-4">
        <p class="font-bold flex items-center gap-1.5 text-sm sm:text-base">
          <span class="text-lg sm:text-xl">🏆</span>
          <span class="tracking-[0.15em] uppercase text-amber-300">Man of the Match</span>
        </p>
      </div>
    </div>
  </RouterLink>
</template>
