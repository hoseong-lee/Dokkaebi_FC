<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { ATTR_MAP, computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { futTier, FUT_TIER_LABEL } from '@/utils/futCard'
import { playerSkillTags } from '@/utils/playerPhoto'
import { generateVersusCard } from '@/utils/versusCard'
import { downloadBlob } from '@/utils/squadImage'
import { useToast } from '@/composables/useToast'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const players = usePlayersStore()
const seasons = useSeasonStore()
const toast = useToast()

const scope = ref('total')
const seasonId = computed(() => (scope.value === 'total' ? null : scope.value))
const aId = ref('')
const bId = ref('')

const options = computed(() =>
  [...players.players]
    .filter((p) => p.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ id: p.id, label: `${p.name}${p.number != null ? ' #' + p.number : ''}` }))
)

function build(pid) {
  const p = players.getById(pid)
  if (!p) return null
  const attrs = computeFifaAttrs(playerSkillTags(p, seasonId.value))
  const ovr = overallRating(attrs)
  return { player: p, attrs, ovr, tier: futTier(ovr) }
}
const A = computed(() => build(aId.value))
const B = computed(() => build(bId.value))

// 레이더 좌표
const VB = 320
const CX = 160, CY = 160, R = 110
function polar(i, radius) {
  const a = (i * 60 - 90) * Math.PI / 180
  return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) }
}
function poly(attrs) {
  return ATTR_MAP.map((attr, i) => {
    const v = attrs[attr.id] || 50
    const ratio = (v - 50) / 49
    const p = polar(i, R * (0.2 + ratio * 0.8))
    return `${p.x},${p.y}`
  }).join(' ')
}
const grid = computed(() =>
  [0.4, 0.7, 1.0].map((r) => ATTR_MAP.map((_, i) => {
    const p = polar(i, R * r); return `${p.x},${p.y}`
  }).join(' '))
)
const labels = computed(() =>
  ATTR_MAP.map((attr, i) => ({ ...polar(i, R + 22), ko: attr.ko }))
)

// 스탯 행 비교 (A vs B 우열)
const rows = computed(() => {
  if (!A.value || !B.value) return []
  return ATTR_MAP.map((attr) => ({
    ko: attr.ko,
    a: A.value.attrs[attr.id] || 50,
    b: B.value.attrs[attr.id] || 50
  }))
})

const loading = computed(() => players.loading || !seasons.loaded)

const seasonName = computed(() =>
  scope.value === 'total' ? '통산' : (seasons.list.find((s) => s.id === scope.value)?.name || '시즌')
)
const downloading = ref(false)
const emblemSrc = (import.meta.env.BASE_URL || '/') + 'dokkaebi-emblem-192.png'
async function downloadVs() {
  if (!A.value || !B.value) return
  downloading.value = true
  try {
    const blob = await generateVersusCard({
      playerA: A.value.player,
      playerB: B.value.player,
      seasonId: seasonId.value,
      seasonName: seasonName.value,
      emblemUrl: emblemSrc
    })
    const safe = `${A.value.player.name}-vs-${B.value.player.name}`.replace(/[^\w가-힣-]/g, '_')
    downloadBlob(blob, `dokkaebi-vs-${safe}.png`)
    toast.success('VS 카드를 저장했습니다.')
  } catch (e) {
    toast.error(`이미지 생성 실패: ${e?.message || e}`)
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  await Promise.all([seasons.ensure(), players.loaded ? null : players.fetchAll()])
  // 기본값: 첫 두 선수
  if (!aId.value && options.value[0]) aId.value = options.value[0].id
  if (!bId.value && options.value[1]) bId.value = options.value[1].id
})

const TIER_TEXT = { gold: 'text-amber-500', silver: 'text-zinc-400', bronze: 'text-orange-500' }
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100">⚔️ 능력치 1:1 비교</h1>
      <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">두 선수의 능력치를 겹쳐 비교해요</p>
    </div>

    <LoadingSpinner v-if="loading" />
    <template v-else>
      <!-- 시즌 scope -->
      <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        <button
          class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
          :class="scope === 'total' ? 'bg-navy text-white' : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'"
          @click="scope = 'total'"
        >통산</button>
        <button
          v-for="s in seasons.list" :key="s.id"
          class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
          :class="scope === s.id ? 'bg-navy text-white' : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'"
          @click="scope = s.id"
        >{{ s.name }}</button>
      </div>

      <!-- 선수 선택 -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p class="text-[11px] font-bold text-rose-500 mb-1">🔴 선수 A</p>
          <select v-model="aId" class="w-full border rounded-lg px-2 py-2 text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700">
            <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <p class="text-[11px] font-bold text-sky-500 mb-1">🔵 선수 B</p>
          <select v-model="bId" class="w-full border rounded-lg px-2 py-2 text-sm bg-white dark:bg-zinc-800 dark:border-zinc-700">
            <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
        </div>
      </div>

      <!-- 헤더: 양쪽 아바타 + OVR -->
      <div v-if="A && B" class="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 mb-3">
        <div class="flex flex-col items-center gap-1 flex-1">
          <PlayerAvatar :player="A.player" :size="48" />
          <p class="text-sm font-bold text-navy dark:text-zinc-100 truncate max-w-full">{{ A.player.name }}</p>
          <p class="text-2xl font-black tabular-nums" :class="TIER_TEXT[A.tier]">{{ A.ovr }}</p>
          <p class="text-[10px]">{{ FUT_TIER_LABEL[A.tier].emoji }} {{ FUT_TIER_LABEL[A.tier].label }}</p>
        </div>
        <span class="text-gray-300 dark:text-zinc-600 font-black text-lg px-2">VS</span>
        <div class="flex flex-col items-center gap-1 flex-1">
          <PlayerAvatar :player="B.player" :size="48" />
          <p class="text-sm font-bold text-navy dark:text-zinc-100 truncate max-w-full">{{ B.player.name }}</p>
          <p class="text-2xl font-black tabular-nums" :class="TIER_TEXT[B.tier]">{{ B.ovr }}</p>
          <p class="text-[10px]">{{ FUT_TIER_LABEL[B.tier].emoji }} {{ FUT_TIER_LABEL[B.tier].label }}</p>
        </div>
      </div>

      <!-- 겹친 레이더 -->
      <div v-if="A && B" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 mb-3 flex justify-center">
        <svg :viewBox="`0 0 ${VB} ${VB}`" class="w-[320px] max-w-full h-auto">
          <polygon v-for="(g, i) in grid" :key="i" :points="g" fill="none" stroke="#e5e7eb" stroke-width="1" />
          <!-- B (파랑, 뒤) -->
          <polygon :points="poly(B.attrs)" fill="rgba(14,165,233,0.22)" stroke="#0ea5e9" stroke-width="2" />
          <!-- A (빨강, 앞) -->
          <polygon :points="poly(A.attrs)" fill="rgba(244,63,94,0.22)" stroke="#f43f5e" stroke-width="2" />
          <g v-for="(l, i) in labels" :key="`lb${i}`" text-anchor="middle">
            <text :x="l.x" :y="l.y + 4" font-size="12" font-weight="700" class="fill-gray-500 dark:fill-zinc-400">{{ l.ko }}</text>
          </g>
        </svg>
      </div>

      <!-- 스탯 우열 표 -->
      <div v-if="A && B" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4">
        <div v-for="r in rows" :key="r.ko" class="flex items-center gap-2 py-1.5">
          <span class="w-8 text-right font-black tabular-nums" :class="r.a >= r.b ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-500'">{{ r.a }}</span>
          <!-- 좌우 바 -->
          <div class="flex-1 flex items-center gap-0.5">
            <div class="flex-1 flex justify-end">
              <div class="h-2 rounded-l bg-rose-400" :style="{ width: (r.a / (r.a + r.b) * 100) + '%' }"></div>
            </div>
            <div class="flex-1">
              <div class="h-2 rounded-r bg-sky-400" :style="{ width: (r.b / (r.a + r.b) * 100) + '%' }"></div>
            </div>
          </div>
          <span class="w-8 font-black tabular-nums" :class="r.b >= r.a ? 'text-sky-500' : 'text-gray-400 dark:text-zinc-500'">{{ r.b }}</span>
          <span class="w-12 text-[10px] text-center text-gray-400 dark:text-zinc-500">{{ r.ko }}</span>
        </div>
      </div>

      <!-- VS 카드 저장 -->
      <BaseButton
        v-if="A && B"
        variant="primary"
        block
        class="mt-3"
        :loading="downloading"
        @click="downloadVs"
      >📸 VS 카드 이미지 저장</BaseButton>
    </template>
  </div>
</template>
