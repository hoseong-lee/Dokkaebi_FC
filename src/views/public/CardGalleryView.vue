<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { computeFifaAttrs, overallRating } from '@/utils/skillMap'
import { futTier, FUT_TIER_LABEL } from '@/utils/futCard'
import { playerSkillTags } from '@/utils/playerPhoto'
import { POSITION_CATEGORY } from '@/utils/positions'
import FutCardMini from '@/components/player/FutCardMini.vue'
import FutPlayerCard from '@/components/player/FutPlayerCard.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const players = usePlayersStore()
const seasons = useSeasonStore()

const scope = ref('total')           // total | seasonId
const tierFilter = ref('all')        // all | gold | silver | bronze
const posFilter = ref('all')         // all | GK | DF | MF | FW
const sortBy = ref('ovr')            // ovr | name | number
const search = ref('')

const seasonId = computed(() => (scope.value === 'total' ? null : scope.value))

// 선수별 카드 메타 (OVR/티어) 미리 계산
const cards = computed(() =>
  players.players
    .filter((p) => p.active !== false)
    .map((p) => {
      const ovr = overallRating(computeFifaAttrs(playerSkillTags(p, seasonId.value)))
      return { player: p, ovr, tier: futTier(ovr), cat: POSITION_CATEGORY[p.mainPosition] || POSITION_CATEGORY[p.subPosition] || p.position }
    })
)

const POS_CATS = ['GK', 'DF', 'MF', 'FW']
const TIERS = [
  { key: 'gold', ...FUT_TIER_LABEL.gold },
  { key: 'silver', ...FUT_TIER_LABEL.silver },
  { key: 'bronze', ...FUT_TIER_LABEL.bronze }
]

// 티어별 인원수
const tierCounts = computed(() => {
  const c = { gold: 0, silver: 0, bronze: 0 }
  for (const card of cards.value) c[card.tier]++
  return c
})

const visible = computed(() => {
  let list = cards.value
  if (tierFilter.value !== 'all') list = list.filter((c) => c.tier === tierFilter.value)
  if (posFilter.value !== 'all') list = list.filter((c) => c.cat === posFilter.value)
  const q = search.value.trim()
  if (q) list = list.filter((c) => (c.player.name || '').includes(q) || String(c.player.number ?? '').includes(q))
  const arr = [...list]
  if (sortBy.value === 'ovr') arr.sort((a, b) => b.ovr - a.ovr || a.player.name.localeCompare(b.player.name))
  else if (sortBy.value === 'name') arr.sort((a, b) => a.player.name.localeCompare(b.player.name))
  else arr.sort((a, b) => (a.player.number ?? 999) - (b.player.number ?? 999))
  return arr
})

const loading = computed(() => players.loading || !seasons.loaded)

// 상세 카드 모달
const detailOpen = ref(false)
const detailPlayer = ref(null)
function openDetail(card) {
  detailPlayer.value = card.player
  detailOpen.value = true
}
const detailSkillTags = computed(() => playerSkillTags(detailPlayer.value, seasonId.value))

onMounted(() => {
  seasons.ensure()
  players.fetchAll()
})
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-4 gap-2">
      <div>
        <h1 class="text-xl font-bold text-navy dark:text-zinc-100">🃏 카드 도감</h1>
        <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          전 선수 능력치 카드 — 탭하면 전체 카드를 볼 수 있어요
        </p>
      </div>
      <RouterLink
        to="/cards/compare"
        class="shrink-0 text-xs px-3 py-1.5 rounded-full bg-navy text-white font-semibold hover:bg-navy/90"
      >⚔️ 1:1 비교</RouterLink>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- 시즌 scope -->
      <div class="flex gap-1.5 mb-2 overflow-x-auto pb-1">
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

      <!-- 티어 필터 -->
      <div class="flex gap-1.5 mb-2 flex-wrap">
        <button
          class="px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="tierFilter === 'all' ? 'bg-navy text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'"
          @click="tierFilter = 'all'"
        >전체 {{ cards.length }}</button>
        <button
          v-for="t in TIERS" :key="t.key"
          class="px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="tierFilter === t.key ? 'bg-navy text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'"
          @click="tierFilter = t.key"
        >{{ t.emoji }} {{ tierCounts[t.key] }}</button>
      </div>

      <!-- 포지션 + 정렬 + 검색 -->
      <div class="flex gap-1.5 mb-3 flex-wrap items-center">
        <button
          class="px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="posFilter === 'all' ? 'bg-navy text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'"
          @click="posFilter = 'all'"
        >전 포지션</button>
        <button
          v-for="cat in POS_CATS" :key="cat"
          class="px-2.5 py-1 rounded-full text-[11px] font-bold"
          :class="posFilter === cat ? 'bg-navy text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'"
          @click="posFilter = cat"
        >{{ cat }}</button>
        <select v-model="sortBy" class="ml-auto border rounded-lg px-2 py-1 text-[11px] bg-white dark:bg-zinc-800 dark:border-zinc-700">
          <option value="ovr">OVR 높은순</option>
          <option value="name">이름순</option>
          <option value="number">등번호순</option>
        </select>
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="이름·등번호 검색"
        class="w-full border rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-zinc-800 dark:border-zinc-700"
      />

      <EmptyState v-if="visible.length === 0" icon="🃏" title="조건에 맞는 카드가 없습니다" />
      <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        <FutCardMini
          v-for="c in visible" :key="c.player.id"
          :player="c.player"
          :season-id="seasonId"
          @click="openDetail(c)"
        />
      </div>
    </template>

    <!-- 전체 카드 모달 -->
    <BaseModal v-model="detailOpen" :title="detailPlayer?.name || '카드'">
      <div v-if="detailPlayer" class="flex justify-center py-2">
        <FutPlayerCard :player="detailPlayer" :skill-tags="detailSkillTags" />
      </div>
    </BaseModal>
  </div>
</template>
