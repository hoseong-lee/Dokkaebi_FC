<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/date'
import {
  MATCH_TYPE_LABEL,
  MATCH_STATUS_LABEL,
  matchResult,
  RESULT_LABEL,
  RESULT_COLOR
} from '@/utils/match'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MatchEventTimeline from '@/components/match/MatchEventTimeline.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import RsvpSection from '@/components/match/RsvpSection.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const playersStore = usePlayersStore()
const auth = useAuthStore()
const toast = useToast()

const match = ref(null)
const loading = ref(true)

const playerMap = computed(() => {
  const map = {}
  for (const p of playersStore.players) map[p.id] = p.name
  return map
})

const lineupPlayers = computed(() =>
  (match.value?.lineup || []).map((id) => playersStore.getById(id)).filter(Boolean)
)

const result = computed(() => (match.value ? matchResult(match.value) : null))
const isFinished = computed(() => match.value?.status === 'finished')

async function load() {
  loading.value = true
  await playersStore.fetchAll()
  match.value = await store.fetchOne(route.params.id)
  loading.value = false
}

async function removeMatch() {
  const ok = await confirm({
    title: '경기 삭제',
    message: '이 경기를 삭제할까요? 입력된 결과 통계는 자동 롤백되지 않습니다.',
    confirmText: '삭제'
  })
  if (!ok) return
  await store.remove(match.value.id)
  toast.success('경기를 삭제했습니다.')
  router.push('/matches')
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <LoadingSpinner v-if="loading" label="불러오는 중..." />
  <EmptyState v-else-if="!match" icon="🔍" title="경기를 찾을 수 없습니다" />
  <div v-else class="space-y-4">
    <section class="bg-white rounded-2xl shadow p-6">
      <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {{ MATCH_TYPE_LABEL[match.type] }}
        </span>
        <span>{{ MATCH_STATUS_LABEL[match.status] }}</span>
      </div>

      <div class="flex items-center justify-center gap-4 py-2">
        <span class="flex-1 text-right font-bold text-navy text-lg">도깨비 FC</span>
        <span v-if="isFinished" class="text-2xl font-bold tabular-nums">
          {{ match.score.dokkaebi }} : {{ match.score.opponent }}
        </span>
        <span v-else class="text-gray-400">vs</span>
        <span class="flex-1 font-bold text-gray-700 text-lg">{{ match.opponent }}</span>
      </div>

      <div v-if="result" class="text-center mt-1">
        <span class="px-3 py-1 rounded-full text-sm font-bold" :class="RESULT_COLOR[result]">
          {{ RESULT_LABEL[result] }}
        </span>
      </div>

      <div class="mt-4 space-y-1 text-sm text-gray-600">
        <p>🕒 {{ formatDateTime(match.date) }}</p>
        <p>
          📍
          <a v-if="match.locationUrl" :href="match.locationUrl" target="_blank" class="text-navy underline">
            {{ match.location || '장소 미정' }}
          </a>
          <span v-else>{{ match.location || '장소 미정' }}</span>
        </p>
      </div>

      <div v-if="auth.isAdmin" class="flex gap-2 mt-5 pt-4 border-t">
        <RouterLink :to="`/admin/matches/${match.id}/result`" class="flex-1">
          <BaseButton variant="danger" size="sm" block>결과 입력</BaseButton>
        </RouterLink>
        <RouterLink :to="`/admin/matches/${match.id}/edit`" class="flex-1">
          <BaseButton variant="secondary" size="sm" block>수정</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" size="sm" @click="removeMatch">삭제</BaseButton>
      </div>
    </section>

    <RsvpSection :match-id="match.id" />

    <section v-if="isFinished" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">경기 이벤트</h2>
      <MatchEventTimeline :events="match.events" :player-map="playerMap" />
      <div v-if="match.momPlayerId" class="mt-4 pt-3 border-t text-sm">
        <span class="text-amber-500 font-bold">⭐ MOM</span>
        <span class="ml-2 font-medium">{{ playerMap[match.momPlayerId] }}</span>
      </div>
    </section>

    <section v-if="lineupPlayers.length" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">출전 명단 ({{ lineupPlayers.length }})</h2>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <RouterLink
          v-for="p in lineupPlayers"
          :key="p.id"
          :to="`/players/${p.id}`"
          class="flex flex-col items-center gap-1 text-center"
        >
          <PlayerAvatar :player="p" :size="44" />
          <span class="text-xs truncate w-full">{{ p.name }}</span>
        </RouterLink>
      </div>
    </section>

    <p v-if="match.notes" class="bg-white rounded-2xl shadow p-6 text-sm text-gray-700 whitespace-pre-line">
      <span class="font-bold text-navy block mb-2">경기 후기</span>{{ match.notes }}
    </p>
  </div>
</template>
