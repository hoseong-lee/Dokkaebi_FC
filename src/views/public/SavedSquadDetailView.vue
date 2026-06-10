<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useSavedSquadsStore } from '@/stores/savedSquads'
import { usePlayersStore } from '@/stores/players'
import { useMatchesStore } from '@/stores/matches'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/date'
import { generateSquadImage, downloadBlob } from '@/utils/squadImage'
import { getSlots } from '@/utils/formations'
import { parsePositions } from '@/utils/squadPositions'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import SquadSocialSection from '@/components/match/SquadSocialSection.vue'

const route = useRoute()
const router = useRouter()
const store = useSavedSquadsStore()
const playersStore = usePlayersStore()
const matchesStore = useMatchesStore()
const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const squad = ref(null)
const downloading = ref(false)
const applyOpen = ref(false)
const applyMatchId = ref('')
const applying = ref(false)

const isOwner = computed(() => squad.value?.authorUid && squad.value.authorUid === auth.user?.uid)
const canEdit = computed(() => isOwner.value || auth.isAdmin)
const canApply = computed(() => auth.isAdmin) // 경기 적용은 관리자만

const lineupPlayers = computed(() =>
  (squad.value?.lineup || [])
    .map((id) => playersStore.getById(id))
    .filter(Boolean)
)

// 슬롯 → 선수 매핑 (포메이션 있을 때)
// 두 형식 모두 호환: { slotId: playerId } (신) / { playerId: { slotId } } (구)
const slotAssignments = computed(() => {
  if (!squad.value?.formation) return []
  const slots = getSlots(squad.value.formation)
  const placed = parsePositions(squad.value.positions) // slotId → playerId
  const placedPids = new Set(placed.values())
  const unmapped = (squad.value.lineup || []).filter((pid) => !placedPids.has(pid))
  let cursor = 0
  return slots.map((slot) => {
    let pid = placed.get(slot.id)
    if (!pid && cursor < unmapped.length) pid = unmapped[cursor++]
    return { slot, player: pid ? playersStore.getById(pid) : null }
  })
})

// 적용 가능 경기 (관리자: 미래 또는 결과 입력 전)
const applicableMatches = computed(() => {
  const now = Date.now()
  return matchesStore.matches
    .filter((m) => !m.quarters || m.quarters.length === 0) // 결과 입력 전
    .filter((m) => !m.date || new Date(m.date).getTime() >= now - 86400000) // 어제 이후
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    .slice(0, 10)
})

async function load() {
  loading.value = true
  await Promise.all([
    store.fetchAll(),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll(),
    canApply.value ? (matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll()) : Promise.resolve()
  ])
  // 항상 fresh fetch — 편집 후 반영 보장
  squad.value = await store.fetchOne(route.params.id, true)
  if (!squad.value) {
    toast.error('스쿼드를 찾을 수 없습니다.')
    router.replace('/squads')
    return
  }
  if (squad.value.isPublic === false && !isOwner.value && !auth.isAdmin) {
    toast.error('비공개 스쿼드입니다.')
    router.replace('/squads')
    return
  }
  loading.value = false
}
onMounted(load)

async function downloadImage() {
  if (!squad.value) return
  downloading.value = true
  try {
    const emblemUrl = (import.meta.env.BASE_URL || '/') + 'dokkaebi-emblem.png'
    const blob = await generateSquadImage({
      squad: squad.value,
      players: playersStore.players,
      emblemUrl
    })
    const safeName = (squad.value.name || 'squad').replace(/[^\w가-힣\s-]/g, '_').trim() || 'squad'
    downloadBlob(blob, `dokkaebi-${safeName}.png`)
    toast.success('이미지를 저장했습니다.')
  } catch (e) {
    toast.error(`이미지 생성 실패: ${e?.message || e}`)
  } finally {
    downloading.value = false
  }
}

async function applyToMatch() {
  if (!applyMatchId.value) return toast.error('적용할 경기를 선택하세요.')
  applying.value = true
  try {
    const match = matchesStore.matches.find((m) => m.id === applyMatchId.value)
    if (!match) throw new Error('경기를 찾을 수 없습니다.')
    // plannedSquads = 4쿼터 동일 적용 (사용자가 추후 결과 입력 시 쿼터별 수정 가능)
    const plannedQuarter = {
      lineup: [...squad.value.lineup],
      formation: squad.value.formation || '',
      positions: { ...(squad.value.positions || {}) }
    }
    await matchesStore.update(match.id, {
      plannedSquads: [plannedQuarter, plannedQuarter, plannedQuarter, plannedQuarter]
    })
    toast.success(`"${match.opponent}" 경기에 스쿼드를 적용했습니다.`)
    applyOpen.value = false
    router.push(`/matches/${match.id}`)
  } catch (e) {
    toast.error(`적용 실패: ${e?.message || e}`)
  } finally {
    applying.value = false
  }
}

async function remove() {
  if (!confirm('이 스쿼드를 삭제할까요?')) return
  try {
    await store.remove(squad.value.id)
    toast.success('삭제했습니다.')
    router.push('/squads')
  } catch (e) {
    toast.error(`삭제 실패: ${e?.message || e}`)
  }
}
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="squad" class="space-y-4">
    <!-- 헤더 -->
    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-navy dark:text-zinc-100">{{ squad.name }}</h1>
          <p class="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
            {{ squad.authorName || '익명' }} · {{ formatDate(squad.updatedAt || squad.createdAt) }}
          </p>
        </div>
        <div class="flex gap-1 shrink-0">
          <span v-if="squad.formation" class="text-xs px-2 py-1 rounded-full bg-navy/10 text-navy dark:text-zinc-100 font-bold tabular-nums">{{ squad.formation }}</span>
          <span class="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{{ lineupPlayers.length }}명</span>
          <span v-if="!squad.isPublic" class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">🔒 비공개</span>
        </div>
      </div>
      <p v-if="squad.notes" class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed bg-gray-50 dark:bg-zinc-900 rounded-lg p-3 mt-2">💬 {{ squad.notes }}</p>
    </div>

    <!-- 미니피치 (포메이션 있을 때) -->
    <section v-if="squad.formation && slotAssignments.length" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
      <p class="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-3">📐 {{ squad.formation }} 배치</p>
      <div class="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-emerald-600 to-emerald-800 ring-1 ring-emerald-700/30">
        <!-- 라인 -->
        <div class="absolute inset-2 ring-2 ring-white/40 rounded-md"></div>
        <div class="absolute left-2 right-2 top-1/2 h-px bg-white/30"></div>
        <div class="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 ring-2 ring-white/30 rounded-full"></div>
        <!-- 선수 점 -->
        <div
          v-for="(sa, i) in slotAssignments" :key="i"
          class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          :style="{ left: sa.slot.x + '%', top: sa.slot.y + '%' }"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-navy text-white"
            :class="{
              'bg-amber-400 !text-navy dark:text-zinc-100': sa.slot.role === 'GK',
              'bg-sky-500': sa.slot.role === 'DF',
              'bg-emerald-500': sa.slot.role === 'MF',
              'bg-rose-500': sa.slot.role === 'FW'
            }"
          >
            <template v-if="sa.player?.number != null">{{ sa.player.number }}</template>
            <template v-else>{{ sa.slot.role }}</template>
          </div>
          <span v-if="sa.player" class="mt-1 px-1.5 py-0.5 bg-navy/85 text-white text-[9px] rounded font-medium whitespace-nowrap">
            {{ sa.player.name }}
          </span>
        </div>
      </div>
    </section>

    <!-- 명단 -->
    <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
      <p class="text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-3">👥 출전 명단 ({{ lineupPlayers.length }}명)</p>
      <div class="grid grid-cols-2 gap-2">
        <RouterLink
          v-for="p in lineupPlayers" :key="p.id"
          :to="`/players/${p.id}`"
          class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:bg-zinc-700 transition-colors"
        >
          <PlayerAvatar :player="p" :size="32" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">
              {{ p.name }}
              <span v-if="p.number != null" class="text-dokkaebi text-xs">#{{ p.number }}</span>
            </p>
            <p v-if="p.mainPosition" class="text-[10px] text-gray-400 dark:text-zinc-500">{{ p.mainPosition }}</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 좋아요 + 이모지 반응 + 댓글 (공개 스쿼드만 의미 있지만 비공개도 본인은 볼 수 있음) -->
    <SquadSocialSection :squad-id="squad.id" />

    <!-- 액션 -->
    <div class="space-y-2">
      <BaseButton variant="primary" :loading="downloading" block @click="downloadImage">
        📷 이미지로 저장 (1080×1350)
      </BaseButton>
      <div v-if="canEdit || canApply" class="grid grid-cols-2 gap-2">
        <BaseButton v-if="canEdit" variant="secondary" block @click="router.push(`/squads/${squad.id}/edit`)">
          ✏️ 편집
        </BaseButton>
        <BaseButton v-if="canApply" variant="secondary" block @click="applyOpen = true">
          📅 경기에 적용
        </BaseButton>
      </div>
      <BaseButton v-if="canEdit" variant="ghost" block @click="remove">
        🗑 삭제
      </BaseButton>
    </div>

    <!-- 경기 적용 모달 -->
    <BaseModal v-model="applyOpen" title="경기에 적용">
      <p class="text-sm text-onyx dark:text-zinc-100 mb-3">이 스쿼드를 어느 경기의 예정 라인업으로 적용할까요?</p>
      <p class="text-[11px] text-gray-400 dark:text-zinc-500 mb-3">4쿼터 모두 동일 라인업으로 적용됩니다 (결과 입력 시 쿼터별 수정 가능).</p>
      <div v-if="applicableMatches.length === 0" class="text-sm text-gray-400 dark:text-zinc-500 py-4 text-center">
        결과 입력 전 예정 경기가 없습니다.
      </div>
      <select v-else v-model="applyMatchId" class="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">경기 선택…</option>
        <option v-for="m in applicableMatches" :key="m.id" :value="m.id">
          {{ formatDate(m.date) }} · vs {{ m.opponent }}
        </option>
      </select>
      <template #footer>
        <BaseButton variant="secondary" @click="applyOpen = false">취소</BaseButton>
        <BaseButton variant="primary" :loading="applying" :disabled="!applyMatchId" @click="applyToMatch">적용</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
