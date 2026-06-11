<script setup>
import { ref, computed } from 'vue'
import { ATTR_MAP, computeFifaAttrs, overallRating, gradeFromOvr } from '@/utils/skillMap'
import { playerPhotoSrc } from '@/utils/playerPhoto'
import { generateFutCard } from '@/utils/futCard'
import { downloadBlob } from '@/utils/squadImage'
import { useToast } from '@/composables/useToast'
import PlayerSilhouette from '@/components/player/PlayerSilhouette.vue'
import BaseButton from '@/components/common/BaseButton.vue'

// EA FC(FUT) 정통 스타일 선수 카드 — 방패형 + 등급별 톤 + OVR/포지션/6스탯
const props = defineProps({
  player: { type: Object, required: true },
  skillTags: { type: Object, default: () => ({}) }
})

const toast = useToast()
const downloading = ref(false)
const emblemSrc = (import.meta.env.BASE_URL || '/') + 'dokkaebi-emblem-192.png'

const attrs = computed(() => computeFifaAttrs(props.skillTags))
const ovr = computed(() => overallRating(attrs.value))
const grade = computed(() => gradeFromOvr(ovr.value))
const posCode = computed(() => props.player?.mainPosition || props.player?.position || '—')
const photoSrc = computed(() => playerPhotoSrc(props.player))

// 등급별 카드 톤 — FUT 골드/스페셜 느낌. text 는 밝은 톤 위 진갈색, 어두운 톤 위 흰색.
const FUT_TONE = {
  SS: { bg: 'from-amber-200 via-yellow-400 to-amber-600', text: 'text-amber-950', line: 'border-amber-900/30', sub: 'text-amber-900/80' },
  S:  { bg: 'from-rose-300 via-rose-500 to-rose-800',     text: 'text-white',     line: 'border-white/30',     sub: 'text-white/80' },
  A:  { bg: 'from-violet-300 via-violet-500 to-violet-800', text: 'text-white',   line: 'border-white/30',     sub: 'text-white/80' },
  B:  { bg: 'from-emerald-300 via-emerald-500 to-emerald-800', text: 'text-white', line: 'border-white/30',    sub: 'text-white/80' },
  C:  { bg: 'from-zinc-300 via-zinc-400 to-zinc-600',     text: 'text-zinc-900',  line: 'border-zinc-900/25',  sub: 'text-zinc-800/80' }
}
const tone = computed(() => FUT_TONE[grade.value.label] || FUT_TONE.C)

// FUT 스탯 순서 — 좌: PAC SHO PAS / 우: DRI DEF PHY
const leftStats = computed(() => ['PAC', 'SHO', 'PAS'].map((id) => statOf(id)))
const rightStats = computed(() => ['DRI', 'DEF', 'PHY'].map((id) => statOf(id)))
function statOf(id) {
  const meta = ATTR_MAP.find((a) => a.id === id)
  return { id, label: meta?.label || id, value: attrs.value[id] ?? 50 }
}

async function download() {
  downloading.value = true
  try {
    const blob = await generateFutCard({
      player: props.player,
      skillTags: props.skillTags,
      emblemUrl: emblemSrc
    })
    const safe = (props.player.name || 'player').replace(/[^\w가-힣\s-]/g, '_').trim() || 'player'
    downloadBlob(blob, `dokkaebi-fut-${safe}.png`)
    toast.success('카드 이미지를 저장했습니다.')
  } catch (e) {
    toast.error(`이미지 생성 실패: ${e?.message || e}`)
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <!-- 카드 본체 (방패형 clip-path) -->
    <div
      class="relative w-64 aspect-[5/7] bg-gradient-to-b shadow-xl select-none"
      :class="tone.bg"
      style="clip-path: polygon(50% 0%, 100% 7%, 100% 82%, 50% 100%, 0% 82%, 0% 7%)"
    >
      <!-- 좌상단: OVR + 포지션 + 엠블럼 -->
      <div class="absolute left-[10%] top-[9%] flex flex-col items-center" :class="tone.text">
        <span class="text-5xl font-black leading-none tabular-nums">{{ ovr }}</span>
        <span class="text-lg font-bold mt-0.5 tracking-wide">{{ posCode }}</span>
        <div class="w-8 border-t my-1.5" :class="tone.line"></div>
        <img :src="emblemSrc" alt="도깨비FC" class="w-9 h-9 rounded-full ring-1 ring-black/10" />
      </div>

      <!-- 우측: 선수 사진(누끼) 또는 실루엣 -->
      <div class="absolute right-0 top-[6%] w-[68%] h-[48%] flex items-end justify-center pointer-events-none">
        <img
          v-if="photoSrc"
          :src="photoSrc"
          :alt="player.name"
          referrerpolicy="no-referrer"
          class="h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
        />
        <PlayerSilhouette v-else :player="player" class="h-[94%] w-auto opacity-90" />
      </div>

      <!-- 이름 바 -->
      <div class="absolute left-[8%] right-[8%] top-[56%] text-center border-t border-b py-1.5" :class="[tone.line, tone.text]">
        <p class="text-xl font-black tracking-wide truncate">{{ player.name }}</p>
      </div>

      <!-- 6 스탯 (2열) -->
      <div class="absolute left-[10%] right-[10%] top-[68%] grid grid-cols-2 gap-x-2" :class="tone.text">
        <div class="space-y-1">
          <p v-for="s in leftStats" :key="s.id" class="text-sm leading-tight">
            <span class="font-black tabular-nums">{{ s.value }}</span>
            <span class="ml-1.5 text-xs font-semibold" :class="tone.sub">{{ s.id }}</span>
          </p>
        </div>
        <div class="space-y-1 border-l pl-3" :class="tone.line">
          <p v-for="s in rightStats" :key="s.id" class="text-sm leading-tight">
            <span class="font-black tabular-nums">{{ s.value }}</span>
            <span class="ml-1.5 text-xs font-semibold" :class="tone.sub">{{ s.id }}</span>
          </p>
        </div>
      </div>

      <!-- 하단 클럽명 (방패 꼭짓점 위) -->
      <p class="absolute left-0 right-0 top-[86.5%] text-center text-[9px] font-bold tracking-[0.3em]" :class="tone.sub">
        DOKKAEBI FC
      </p>
    </div>

    <BaseButton size="sm" variant="secondary" :loading="downloading" @click="download">
      📸 카드 이미지 저장
    </BaseButton>
  </div>
</template>
