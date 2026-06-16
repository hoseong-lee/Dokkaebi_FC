<script setup>
import { ref, computed, onMounted, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useRankings } from '@/composables/useRankings'
import { teamSummary } from '@/utils/teamStats'
import MatchCard from '@/components/match/MatchCard.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import FormGuideChips from '@/components/match/FormGuideChips.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LinkPlayerModal from '@/components/layout/LinkPlayerModal.vue'

const auth = useAuthStore()
const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()
const seasonStore = useSeasonStore()
const emblemSrc = import.meta.env.BASE_URL + 'dokkaebi-emblem-192.png'

// 온보딩: 선수 미연결 사용자 안내
const linkModalOpen = ref(false)
const needsLink = computed(() => auth.isAuthed && !auth.myPlayerId && !playersStore.loading)

const playersRef = toRef(playersStore, 'players')
const seasonRef = computed(() => seasonStore.activeId)
const { topPoints } = useRankings(playersRef, seasonRef)

const recentFinished = computed(() => matchesStore.finished.slice(0, 3))
const top3 = computed(() => topPoints.value.slice(0, 3))
const loading = computed(() => matchesStore.loading || playersStore.loading)
// 최근 5경기 폼 (EPL Form Guide)
const teamForm = computed(() => teamSummary(matchesStore.matches).form)

onMounted(async () => {
  await seasonStore.ensure()
  matchesStore.fetchAll()
  playersStore.fetchAll()
})
</script>

<template>
  <div class="space-y-5">
    <section class="relative overflow-hidden bg-gradient-to-br from-onyx via-onyx to-onyx/90 text-white rounded-2xl shadow p-6">
      <img
        :src="emblemSrc"
        alt=""
        aria-hidden="true"
        class="absolute -right-6 -bottom-6 w-40 h-40 opacity-30 pointer-events-none"
        style="mix-blend-mode: luminosity"
      />
      <div class="relative">
        <p class="text-[10px] text-gold font-semibold tracking-[0.35em]">DOKKEBY FOOTBALL CLUB</p>
        <h1 class="text-lg font-bold mt-1">
          안녕하세요, <span class="text-gold">{{ auth.user?.displayName }}</span>님 👋
        </h1>
        <p class="text-sm text-white/70 mt-1">
          도깨비 FC<span v-if="seasonStore.activeSeason"> · {{ seasonStore.activeSeason.name }}</span>
        </p>
        <FormGuideChips :form="teamForm" class="mt-3" />
      </div>
    </section>

    <!-- 온보딩: 선수 연결 안내 배너 (연결은 관리자만 가능) -->
    <component
      :is="auth.isAdmin ? 'button' : 'div'"
      v-if="needsLink"
      :type="auth.isAdmin ? 'button' : undefined"
      class="w-full flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-300/60 rounded-2xl p-4 text-left"
      :class="auth.isAdmin ? 'hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors' : ''"
      @click="auth.isAdmin && (linkModalOpen = true)"
    >
      <span class="text-2xl shrink-0">👋</span>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-amber-900 dark:text-amber-200 text-sm">아직 본인 선수가 연결되지 않았어요</p>
        <p class="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
          <template v-if="auth.isAdmin">탭해서 본인 선수를 연결하세요 — 내 통계·능력치 카드에 사용돼요</template>
          <template v-else>관리자에게 선수 연결을 요청하세요. 연결되면 내 통계·능력치 카드를 볼 수 있어요</template>
        </p>
      </div>
      <span v-if="auth.isAdmin" class="text-amber-500 text-lg shrink-0">→</span>
    </component>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- 다가오는 경기 -->
      <section>
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-bold text-navy dark:text-zinc-100">다가오는 경기</h2>
          <RouterLink to="/matches" class="text-xs text-gray-400 dark:text-zinc-500 hover:text-navy dark:hover:text-zinc-200">전체 보기</RouterLink>
        </div>
        <MatchCard v-if="matchesStore.nextMatch" :match="matchesStore.nextMatch" />
        <div v-else class="text-sm text-gray-400 dark:text-zinc-400 bg-white dark:bg-zinc-800 rounded-xl p-5 text-center">
          <p>예정된 경기가 없습니다.</p>
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin/matches/new"
            class="inline-flex mt-3 px-4 py-2 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90"
          >+ 경기 등록</RouterLink>
        </div>
      </section>

      <!-- 최근 결과 -->
      <section v-if="recentFinished.length">
        <h2 class="font-bold text-navy dark:text-zinc-100 mb-2">최근 결과</h2>
        <div class="space-y-2">
          <MatchCard v-for="m in recentFinished" :key="m.id" :match="m" />
        </div>
      </section>

      <!-- 랭킹 TOP 3 -->
      <section v-if="top3.length">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-bold text-navy dark:text-zinc-100">공격포인트 TOP 3</h2>
          <RouterLink to="/rankings" class="text-xs text-gray-400 dark:text-zinc-500 hover:text-navy dark:hover:text-zinc-200">랭킹 보기</RouterLink>
        </div>
        <ol class="bg-white dark:bg-zinc-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-zinc-700">
          <li
            v-for="(r, i) in top3"
            :key="r.player.id"
            class="flex items-center gap-3 p-3"
          >
            <span class="w-6 text-center">{{ ['🥇', '🥈', '🥉'][i] }}</span>
            <PlayerAvatar :player="r.player" :size="36" />
            <RouterLink :to="`/players/${r.player.id}`" class="flex-1 font-medium truncate hover:underline dark:text-zinc-100">
              {{ r.player.name }}
            </RouterLink>
            <span class="font-bold text-navy dark:text-zinc-100">{{ r.value }}P</span>
          </li>
        </ol>
      </section>
    </template>

    <LinkPlayerModal v-model="linkModalOpen" />
  </div>
</template>
