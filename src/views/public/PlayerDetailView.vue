<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { POSITION_LABEL, POSITION_BADGE_STRONG, FOOT_LABEL, seasonStatsOf, attackPoints } from '@/utils/stats'
import { COMPLIMENT_TAGS, COMPLIMENT_TAG_MAP } from '@/utils/compliments'
import EndorsementSection from '@/components/player/EndorsementSection.vue'
import SkillRadarChart from '@/components/player/SkillRadarChart.vue'
import { formatDate } from '@/utils/date'
import { playerMonthlySeries } from '@/utils/playerSeries'
import { computePlayerBadges, BADGE_TONE } from '@/utils/badges'
import { findClub, clubLogo } from '@/utils/clubs'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import PlayerStatsCards from '@/components/player/PlayerStatsCards.vue'
import PlayerStatsChart from '@/components/player/PlayerStatsChart.vue'
import PlayerMonthlyChart from '@/components/player/PlayerMonthlyChart.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const store = usePlayersStore()
const seasonStore = useSeasonStore()
const matchesStore = useMatchesStore()

const player = ref(null)
const loading = ref(true)
const scope = ref('total') // total | seasonId

const stats = computed(() => {
  if (!player.value) return null
  return scope.value === 'total'
    ? player.value.stats || {}
    : seasonStatsOf(player.value, scope.value)
})

// 받은 칭찬 태그 분포 (현재 scope 기준)
const complimentTagStats = computed(() => {
  const tags = stats.value?.complimentTags || {}
  return COMPLIMENT_TAGS.map((t) => ({
    ...t,
    count: tags[t.id] || 0
  })).filter((t) => t.count > 0).sort((a, b) => b.count - a.count)
})
const topComplimentTag = computed(() => complimentTagStats.value[0] || null)

const series = computed(() => {
  if (!player.value || scope.value === 'total') return []
  return playerMonthlySeries(player.value.id, matchesStore.matches, scope.value)
})

const badges = computed(() => {
  if (!player.value) return []
  return computePlayerBadges(
    player.value,
    matchesStore.matches,
    store.players,
    seasonStore.list
  )
})

const currentLabel = computed(() => {
  if (scope.value === 'total') return '통산'
  return seasonStore.seasons.find((s) => s.id === scope.value)?.name || scope.value
})

// 시즌별 비교 (최신 시즌부터 좌→우) + 통산 열
const COMPARE_ROWS = [
  { key: 'appearances', label: '출전', unit: '경기' },
  { key: 'goals', label: '골', unit: 'G' },
  { key: 'assists', label: '도움', unit: 'A' },
  { key: 'momCount', label: 'MOM', unit: '회' },
  { key: 'points', label: '공격 포인트', unit: 'P' }
]
function readMetric(stats, key) {
  return key === 'points' ? attackPoints(stats) : (stats?.[key] || 0)
}
const seasonsForCompare = computed(() =>
  // 기록이 1건이라도 있는 시즌만 노출 (없는 시즌은 비교 의미 X)
  seasonStore.list.filter((s) => {
    if (!player.value) return false
    const st = seasonStatsOf(player.value, s.id)
    return ((st.appearances || 0) + (st.goals || 0) + (st.assists || 0) + (st.momCount || 0)) > 0
  })
)
const compareTable = computed(() => {
  if (!player.value) return []
  const seasons = seasonsForCompare.value
  return COMPARE_ROWS.map((r) => {
    const cells = seasons.map((s) => ({
      seasonId: s.id,
      value: readMetric(seasonStatsOf(player.value, s.id), r.key)
    }))
    const total = readMetric(player.value.stats || {}, r.key)
    let trend = null
    if (cells.length >= 2) {
      const diff = cells[0].value - cells[1].value
      if (diff !== 0) trend = diff
    }
    return { ...r, cells, total, trend }
  })
})

async function load() {
  loading.value = true
  player.value = await store.fetchOne(route.params.id)
  loading.value = false
}

onMounted(async () => {
  await seasonStore.ensure()
  matchesStore.fetchAll()
  // 기본 = 활성 시즌
  if (seasonStore.activeId) scope.value = seasonStore.activeId
  load()
})
watch(() => route.params.id, load)
</script>

<template>
  <LoadingSpinner v-if="loading" label="불러오는 중..." />
  <EmptyState v-else-if="!player" icon="🔍" title="선수를 찾을 수 없습니다" />
  <div v-else class="space-y-4">
    <section class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center gap-4">
        <PlayerAvatar :player="player" :size="80" />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-navy">{{ player.name }}</h1>
            <span v-if="player.number != null" class="text-dokkaebi font-bold">#{{ player.number }}</span>
            <span v-if="player.isRegular" class="text-amber-500 text-xs">★</span>
          </div>
        <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span
            class="text-[11px] px-2 py-0.5 rounded font-semibold"
            :class="POSITION_BADGE_STRONG[player.position] || 'bg-gray-300 text-white'"
          >
            {{ POSITION_LABEL[player.position] || player.position }}
          </span>
          <span v-if="player.mainPosition" class="text-xs text-gray-600">
            {{ player.mainPosition }}<span v-if="player.subPosition"> / {{ player.subPosition }}</span>
          </span>
          <span v-if="player.preferredFoot" class="text-xs text-gray-500">
            · {{ FOOT_LABEL[player.preferredFoot] }}
          </span>
        </div>
          <p v-if="player.joinedAt" class="text-xs text-gray-400 mt-1">
            가입 {{ formatDate(player.joinedAt, 'YYYY.MM.DD') }}
          </p>
        </div>
      </div>
      <p
        v-if="player.bio"
        class="text-sm text-gray-700 mt-3 bg-gray-50 rounded-lg px-3 py-2 italic"
      >
        💬 {{ player.bio }}
      </p>
      <div
        v-if="player.favoriteClub || player.favoritePlayer"
        class="flex flex-wrap gap-1.5 mt-3"
      >
        <span
          v-if="player.favoriteClub"
          class="inline-flex items-center gap-1.5 text-xs pl-1 pr-2.5 py-1 rounded-full font-semibold"
          :class="findClub(player.favoriteClub)?.color || 'bg-gray-100 text-gray-700'"
        >
          <img
            v-if="findClub(player.favoriteClub)"
            :src="clubLogo(findClub(player.favoriteClub).id)"
            :alt="player.favoriteClub"
            class="w-5 h-5 object-contain bg-white rounded-full p-0.5"
          />
          <span v-else>⚽</span>
          {{ player.favoriteClub }}
        </span>
        <span
          v-if="player.favoritePlayer"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800"
        >
          ⭐ {{ player.favoritePlayer }}
        </span>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center justify-between mb-4 gap-2">
        <h2 class="font-bold text-navy">기록</h2>
        <select v-model="scope" class="border rounded-lg px-3 py-1.5 text-xs bg-white">
          <option value="total">통산</option>
          <option v-for="s in seasonStore.list" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <PlayerStatsCards :stats="stats" :footer="false" class="mb-4" />
      <PlayerStatsChart :stats="stats" />
      <p class="text-center text-sm text-gray-500 mt-3">
        공격 포인트 <span class="font-bold text-navy text-base">{{ attackPoints(stats) }}</span>
      </p>
    </section>

    <section v-if="scope !== 'total'" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">{{ currentLabel }} 월별 추이</h2>
      <PlayerMonthlyChart :series="series" />
    </section>

    <!-- FIFA 능력치 카드 (스킬 평판 기반 자동) -->
    <section v-if="player" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">🎮 능력치 카드</h2>
      <SkillRadarChart
        :skill-tags="scope === 'total' ? (player.stats?.skillTags || {}) : (player.seasonStats?.[scope]?.skillTags || {})"
        :name="player.name"
        :position="player.mainPosition"
      />
    </section>

    <!-- 스킬 평판 (Endorsement) -->
    <EndorsementSection :player="player" :season-id="scope === 'total' ? null : scope" />

    <!-- 받은 칭찬 분포 -->
    <section v-if="complimentTagStats.length" class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-navy">💝 받은 칭찬</h2>
        <span v-if="topComplimentTag" class="text-xs text-rose-600 font-semibold">
          대표 강점: {{ topComplimentTag.icon }} {{ topComplimentTag.label }}
        </span>
      </div>
      <div class="space-y-2">
        <div
          v-for="t in complimentTagStats" :key="t.id"
          class="flex items-center gap-3"
        >
          <span class="text-[11px] px-2 py-1 rounded-full ring-1 font-semibold shrink-0 w-44" :class="t.tone">
            {{ t.icon }} {{ t.label }}
          </span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="t.tone.split(' ').find(c => c.startsWith('ring-'))?.replace('ring-', 'bg-') || 'bg-rose-500'"
              :style="{ width: Math.min(100, (t.count / (complimentTagStats[0]?.count || 1)) * 100) + '%' }"
            ></div>
          </div>
          <span class="text-sm font-bold text-onyx tabular-nums shrink-0 w-8 text-right">{{ t.count }}</span>
        </div>
      </div>
    </section>

    <!-- 뱃지 -->
    <section v-if="badges.length" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">🏅 획득 뱃지 ({{ badges.length }})</h2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="b in badges"
          :key="b.id"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
          :class="BADGE_TONE[b.icon] || 'bg-gray-50 text-gray-700 border-gray-200'"
          :title="b.desc"
        >
          <span>{{ b.icon }}</span>
          {{ b.label }}
        </div>
      </div>
    </section>

    <!-- 시즌별 비교 -->
    <section v-if="seasonsForCompare.length >= 2" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">시즌별 비교</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2 text-xs text-gray-500 font-medium">지표</th>
              <th
                v-for="s in seasonsForCompare"
                :key="s.id"
                class="text-center py-2 text-xs font-bold"
                :class="s.active ? 'text-dokkaebi' : 'text-gray-700'"
              >
                {{ s.name }}
                <span v-if="s.active" class="text-[9px] align-middle bg-dokkaebi text-white rounded px-1 ml-0.5">진행</span>
              </th>
              <th class="text-center py-2 text-xs text-gray-400 font-medium">통산</th>
              <th class="text-right py-2 text-xs text-gray-400 font-medium">추세</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in compareTable" :key="r.key" class="border-b last:border-b-0">
              <td class="py-2 text-gray-600">{{ r.label }}</td>
              <td
                v-for="(c, i) in r.cells"
                :key="c.seasonId"
                class="text-center py-2 tabular-nums"
                :class="i === 0 ? 'font-bold text-navy text-base' : 'text-gray-700'"
              >
                {{ c.value }}<span class="text-[10px] text-gray-400 ml-0.5">{{ r.unit }}</span>
              </td>
              <td class="text-center py-2 tabular-nums text-gray-500">{{ r.total }}</td>
              <td class="text-right py-2 text-xs tabular-nums">
                <span
                  v-if="r.trend && r.trend > 0"
                  class="text-green-600 font-semibold"
                >↑ +{{ r.trend }}</span>
                <span
                  v-else-if="r.trend && r.trend < 0"
                  class="text-dokkaebi font-semibold"
                >↓ {{ r.trend }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-[11px] text-gray-400 mt-2">
        추세 = 최신 시즌({{ seasonsForCompare[0]?.name }}) − 직전({{ seasonsForCompare[1]?.name }})
      </p>
    </section>
  </div>
</template>
