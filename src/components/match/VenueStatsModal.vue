<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import { RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { statsForVenue } from '@/utils/venueStats'
import { formatDate } from '@/utils/date'
import { matchResult, RESULT_COLOR, RESULT_LABEL, TEAM_STATS_EXCLUDE_TYPES } from '@/utils/match'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  venue: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()

const stats = computed(() => props.venue ? statsForVenue(props.venue, matchesStore.matches) : null)

// 이 venue 의 최근 경기 5건
const recentMatches = computed(() => {
  if (!props.venue) return []
  return matchesStore.matches
    .filter((m) => {
      if (TEAM_STATS_EXCLUDE_TYPES.includes(m.type)) return false
      if (!matchResult(m)) return false
      if (m.venueId && m.venueId === props.venue.id) return true
      if (m.venueId) return false
      if (m.location && props.venue.name && m.location.includes(props.venue.name)) return true
      return false
    })
    .sort((a, b) => (b.date || 0) - (a.date || 0))
    .slice(0, 5)
})

function pct(n) { return `${Math.round((n || 0) * 100)}%` }
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="`📊 ${venue?.name || '구장'} 통계`">
    <div v-if="!stats || stats.played === 0" class="text-center py-8 text-gray-400 dark:text-zinc-500 text-sm">
      이 구장에서 진행한 정식 경기 기록이 없어요.<br>
      <span class="text-[11px]">(풋살·자체전은 통계에서 제외)</span>
    </div>

    <div v-else class="space-y-4">
      <!-- 핵심 수치 -->
      <div class="grid grid-cols-4 gap-2 text-center">
        <div><p class="text-[10px] text-gray-500 dark:text-zinc-400">경기</p><p class="text-xl font-bold text-navy dark:text-zinc-100">{{ stats.played }}</p></div>
        <div><p class="text-[10px] text-blue-500">승</p><p class="text-xl font-bold text-blue-600">{{ stats.wins }}</p></div>
        <div><p class="text-[10px] text-gray-500 dark:text-zinc-400">무</p><p class="text-xl font-bold text-gray-600 dark:text-zinc-400">{{ stats.draws }}</p></div>
        <div><p class="text-[10px] text-rose-500">패</p><p class="text-xl font-bold text-rose-600">{{ stats.losses }}</p></div>
      </div>

      <!-- 승률 막대 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-gray-500 dark:text-zinc-400 font-semibold">승률</span>
          <span class="text-lg font-bold text-navy dark:text-zinc-100">{{ pct(stats.winRate) }}</span>
        </div>
        <div class="flex h-3 rounded-full overflow-hidden">
          <div class="bg-blue-500" :style="{ width: pct(stats.winRate) }"></div>
          <div class="bg-gray-300" :style="{ width: pct(stats.drawRate) }"></div>
          <div class="bg-rose-400" :style="{ width: pct(stats.lossRate) }"></div>
        </div>
      </div>

      <!-- 득실 -->
      <div class="bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 text-center">
        <p class="text-sm text-gray-600 dark:text-zinc-400">
          평균 <span class="font-bold text-onyx dark:text-zinc-100">{{ stats.avgGf.toFixed(1) }}</span>득점 :
          <span class="font-bold text-onyx dark:text-zinc-100">{{ stats.avgGa.toFixed(1) }}</span>실점
        </p>
        <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          득실차 <span :class="stats.gd >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'">
            {{ stats.gd > 0 ? '+' : '' }}{{ stats.gd }}
          </span> · 경기당 평점 {{ stats.pointsPerGame.toFixed(2) }}점
        </p>
      </div>

      <!-- 이 구장 MOM 단골 -->
      <div v-if="stats.topMomPlayers.length">
        <p class="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-2">⭐ 이 구장 MOM 단골</p>
        <div class="space-y-1">
          <div v-for="m in stats.topMomPlayers" :key="m.playerId" class="flex items-center gap-2">
            <PlayerAvatar :player="playersStore.getById(m.playerId)" :size="28" />
            <RouterLink :to="`/players/${m.playerId}`" class="flex-1 text-sm font-medium hover:underline truncate">
              {{ playersStore.getById(m.playerId)?.name || '?' }}
            </RouterLink>
            <span class="text-xs text-amber-600 font-bold">⭐ {{ m.count }}회</span>
          </div>
        </div>
      </div>

      <!-- 최근 경기 -->
      <div v-if="recentMatches.length">
        <p class="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-2">📅 최근 경기</p>
        <ul class="space-y-1">
          <li v-for="m in recentMatches" :key="m.id" class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 w-16 shrink-0">{{ formatDate(m.date) }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" :class="RESULT_COLOR[matchResult(m)]">
              {{ RESULT_LABEL[matchResult(m)] }}
            </span>
            <RouterLink :to="`/matches/${m.id}`" class="flex-1 text-xs truncate hover:underline">
              vs {{ m.opponent }} · {{ m.score?.dokkaebi ?? '?' }}:{{ m.score?.opponent ?? '?' }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('update:modelValue', false)">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
