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
import { ytEmbedUrl, ytWatchUrl, ytThumbUrl, formatTime } from '@/utils/youtube'
import { downloadMatchICS, googleCalendarUrl, naverCalendarUrl } from '@/utils/calendar'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import RsvpSection from '@/components/match/RsvpSection.vue'
import FormationPitch from '@/components/match/FormationPitch.vue'
import MomVotingSection from '@/components/match/MomVotingSection.vue'
import ResultCardModal from '@/components/match/ResultCardModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'

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

const quarters = computed(() => match.value?.quarters || [])
const resultCardOpen = ref(false)

// 영상 (videoUrls 배열)
const videos = computed(() => Array.isArray(match.value?.videoUrls) ? match.value.videoUrls : [])
const activeVideoIdx = ref(0)
const activeVideo = computed(() => videos.value[activeVideoIdx.value] || null)

// 캘린더 추가 모달
const calendarOpen = ref(false)
function downloadIcs() {
  if (!match.value) return
  downloadMatchICS(match.value)
  toast.success('일정 파일을 다운로드했습니다.')
  calendarOpen.value = false
}

// 예정 스쿼드 목록 (쿼터 배열 우선, legacy 단일 스쿼드 폴백)
const plannedSquadList = computed(() => {
  const m = match.value
  if (!m) return []
  if (Array.isArray(m.plannedSquads)) {
    return m.plannedSquads
      .map((s, i) => ({ idx: i, label: `${i + 1}쿼터`, ...(s || {}) }))
      .filter((s) => s.lineup?.length)
  }
  if (m.plannedSquad?.lineup?.length) {
    return [{ idx: 0, label: '명단', ...m.plannedSquad }]
  }
  return []
})
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

      <div class="mt-5 pt-4 border-t flex flex-wrap gap-2">
        <BaseButton variant="ghost" size="sm" @click="calendarOpen = true">
          📅 내 캘린더에 추가
        </BaseButton>
        <BaseButton v-if="isFinished" variant="ghost" size="sm" @click="resultCardOpen = true">
          📸 결과 카드 만들기
        </BaseButton>
      </div>

      <div v-if="auth.isAdmin" class="flex flex-wrap gap-2 mt-5 pt-4 border-t">
        <RouterLink :to="`/admin/matches/${match.id}/squad`" class="flex-1 min-w-[6rem]">
          <BaseButton variant="primary" size="sm" block>스쿼드 메이커</BaseButton>
        </RouterLink>
        <RouterLink :to="`/admin/matches/${match.id}/result`" class="flex-1 min-w-[6rem]">
          <BaseButton variant="danger" size="sm" block>결과 입력</BaseButton>
        </RouterLink>
        <RouterLink :to="`/admin/matches/${match.id}/edit`" class="flex-1 min-w-[6rem]">
          <BaseButton variant="secondary" size="sm" block>수정</BaseButton>
        </RouterLink>
        <BaseButton variant="ghost" size="sm" @click="removeMatch">삭제</BaseButton>
      </div>
    </section>

    <RsvpSection :match-id="match.id" />

    <MomVotingSection v-if="isFinished" :match="match" />

    <!-- 예정 경기: 쿼터별 미리 짠 스쿼드 -->
    <section
      v-if="!isFinished && plannedSquadList.length"
      class="bg-white rounded-2xl shadow p-6 space-y-5"
    >
      <h2 class="font-bold text-navy">예정 스쿼드</h2>
      <div
        v-for="ps in plannedSquadList"
        :key="ps.idx"
        class="border-t first:border-t-0 pt-4 first:pt-0"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-sm text-gray-700">
            {{ ps.label }} <span class="text-xs text-gray-400">({{ ps.lineup.length }}명)</span>
          </span>
          <span v-if="ps.formation" class="text-sm font-bold text-dokkaebi">{{ ps.formation }}</span>
        </div>
        <FormationPitch
          v-if="ps.formation"
          :formation="ps.formation"
          :positions="ps.positions || {}"
          :players="playersStore.players"
        />
        <div class="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
          <RouterLink
            v-for="pid in ps.lineup"
            :key="pid"
            :to="`/players/${pid}`"
            class="flex flex-col items-center gap-1 text-center"
          >
            <PlayerAvatar :player="playersStore.getById(pid)" :size="36" />
            <span class="text-[11px] truncate w-full">{{ playersStore.getById(pid)?.name }}</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 쿼터별 기록 -->
    <section v-if="quarters.length" class="bg-white rounded-2xl shadow p-6 space-y-5">
      <h2 class="font-bold text-navy">쿼터별 기록</h2>
      <div v-for="(q, i) in quarters" :key="i" class="border-t first:border-t-0 pt-4 first:pt-0">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold text-sm text-gray-700">{{ i + 1 }}쿼터</span>
          <span class="text-sm font-bold tabular-nums">
            {{ q.score?.dokkaebi ?? 0 }} : {{ q.score?.opponent ?? 0 }}
          </span>
        </div>
        <MatchEventTimeline :events="q.events || []" :player-map="playerMap" />
        <FormationPitch
          v-if="q.formation"
          class="mt-3"
          :formation="q.formation"
          :positions="q.positions || {}"
          :players="playersStore.players"
        />
      </div>
      <div v-if="match.momPlayerId" class="pt-3 border-t text-sm">
        <span class="text-amber-500 font-bold">⭐ MOM</span>
        <span class="ml-2 font-medium">{{ playerMap[match.momPlayerId] }}</span>
      </div>
    </section>

    <!-- 레거시(쿼터 없는) 경기 -->
    <section v-else-if="isFinished" class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-navy mb-3">경기 이벤트</h2>
      <MatchEventTimeline :events="match.events || []" :player-map="playerMap" />
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

    <!-- 경기 영상 (YouTube 임베드) -->
    <section v-if="videos.length" class="bg-white rounded-2xl shadow p-5 space-y-3">
      <div class="flex items-center gap-2">
        <h3 class="font-bold text-navy">📹 경기 영상</h3>
        <span class="text-xs text-gray-400">{{ videos.length }}개</span>
      </div>

      <!-- 영상 탭 (2개 이상일 때) -->
      <div v-if="videos.length > 1" class="flex gap-1.5 flex-wrap">
        <button
          v-for="(v, i) in videos" :key="i"
          type="button"
          class="text-xs px-3 py-1.5 rounded-full ring-1 transition-colors"
          :class="activeVideoIdx === i ? 'bg-rose-500 text-white ring-rose-500 shadow' : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'"
          @click="activeVideoIdx = i"
        >▶ {{ v.label || `영상 ${i + 1}` }}</button>
      </div>

      <!-- 선택된 영상 임베드 -->
      <div v-if="activeVideo" class="space-y-2">
        <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-gray-200">
          <iframe
            :key="activeVideoIdx"
            :src="ytEmbedUrl(activeVideo.url, { start: activeVideo.start, end: activeVideo.end })"
            class="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-500">
            <span v-if="activeVideo.start != null || activeVideo.end != null" class="text-rose-600 font-semibold">
              ⏱ 구간:
              {{ activeVideo.start != null ? formatTime(activeVideo.start) : '0:00' }}
              ~ {{ activeVideo.end != null ? formatTime(activeVideo.end) : '끝' }}
            </span>
            <span v-else>전체 재생</span>
          </span>
          <a :href="ytWatchUrl(activeVideo.url, { start: activeVideo.start })" target="_blank" rel="noopener" class="text-rose-600 hover:underline">
            YouTube 에서 보기 ↗
          </a>
        </div>
      </div>
    </section>

    <p v-if="match.notes" class="bg-white rounded-2xl shadow p-6 text-sm text-gray-700 whitespace-pre-line">
      <span class="font-bold text-navy block mb-2">경기 후기</span>{{ match.notes }}
    </p>

    <ResultCardModal v-if="isFinished" v-model="resultCardOpen" :match="match" />

    <!-- 캘린더 추가 모달 -->
    <BaseModal v-model="calendarOpen" title="📅 내 캘린더에 추가">
      <p class="text-sm text-gray-600 mb-3 leading-relaxed">
        본인 캘린더에 추가하면 <span class="font-semibold text-navy">자동으로 일정 알림</span>이 옵니다.
        <span class="block text-xs text-gray-400 mt-1">기본 알림: 1일 전 + 1시간 전 (캘린더 앱에서 변경 가능)</span>
      </p>
      <div class="space-y-2">
        <a
          :href="googleCalendarUrl(match)"
          target="_blank" rel="noopener"
          class="block w-full px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 font-semibold flex items-center justify-between"
          @click="calendarOpen = false"
        >
          <span>📅 Google 캘린더에 추가</span>
          <span class="text-xs opacity-60">↗ 새 탭</span>
        </a>
        <a
          :href="naverCalendarUrl(match)"
          target="_blank" rel="noopener"
          class="block w-full px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700 font-semibold flex items-center justify-between"
          @click="calendarOpen = false"
        >
          <span>📅 네이버 캘린더에 추가</span>
          <span class="text-xs opacity-60">↗ 새 탭</span>
        </a>
        <button
          type="button"
          class="block w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-semibold flex items-center justify-between"
          @click="downloadIcs"
        >
          <span>📥 .ics 파일 다운로드</span>
          <span class="text-xs opacity-60">iOS · 아웃룩 등</span>
        </button>
      </div>
      <p class="text-[11px] text-gray-400 mt-3 leading-relaxed">
        💡 iOS 는 .ics 파일을 다운로드 후 캘린더 앱이 자동으로 열립니다.<br>
        💡 알림이 안 오면 캘린더 앱 설정에서 "이벤트 알림" 권한 확인.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="calendarOpen = false">닫기</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
