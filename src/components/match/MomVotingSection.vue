<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useMatchVotes } from '@/composables/useMatchVotes'
import { useToast } from '@/composables/useToast'
import { confirm } from '@/composables/useConfirm'
import { finalizeMomVoting } from '@/firebase/database'
import BaseButton from '@/components/common/BaseButton.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({ match: { type: Object, required: true } })
const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()
const { votesMap, tally, totalVotes, saving, vote } = useMatchVotes(props.match.id)

const candidates = computed(() =>
  (props.match.lineup || [])
    .map((id) => playersStore.getById(id))
    .filter(Boolean)
)

const myUid = computed(() => auth.user?.uid || null)
const myVote = computed(() => (myUid.value ? votesMap.value[myUid.value] : null))

const eligible = computed(() => {
  const pid = auth.myPlayerId
  if (!pid) return false
  return (props.match.lineup || []).includes(pid)
})

const closed = computed(() => !!props.match.votingClosed)

async function pick(playerId) {
  if (!eligible.value) return toast.error('이 경기에 참여한 선수만 투표할 수 있습니다.')
  if (closed.value) return
  try {
    const next = myVote.value === playerId ? null : playerId
    await vote(next)
    toast.success(next ? '투표 완료' : '투표 취소')
  } catch (e) {
    toast.error(`투표 실패: ${e?.code || e?.message || e}`)
  }
}

const leader = computed(() => {
  let best = null, max = 0
  for (const [pid, cnt] of Object.entries(tally.value)) {
    if (cnt > max) { max = cnt; best = pid }
  }
  return best
})

async function close() {
  if (!leader.value) return toast.error('아직 투표가 없습니다.')
  const winner = playersStore.getById(leader.value)
  const ok = await confirm({
    title: '투표 마감',
    message: `${winner?.name}을(를) MOM 으로 확정하고 투표를 마감합니다. 통계가 갱신됩니다.`,
    confirmText: '마감',
    variant: 'primary'
  })
  if (!ok) return
  try {
    await finalizeMomVoting(props.match.id, leader.value)
    await playersStore.fetchAll(true)
    toast.success('MOM 이 확정되었습니다.')
  } catch (e) {
    toast.error(`마감 실패: ${e?.code || e?.message || e}`)
  }
}
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-navy">⭐ MOM 투표</h2>
      <span class="text-xs text-gray-400">{{ totalVotes }}표</span>
    </div>

    <p v-if="closed" class="text-xs text-gray-500 mb-3">
      투표가 마감되었습니다. MOM:
      <span v-if="match.momPlayerId" class="font-semibold text-amber-600">
        {{ playersStore.getById(match.momPlayerId)?.name }}
      </span>
      <span v-else>없음</span>
    </p>
    <p v-else-if="!eligible" class="text-xs text-gray-500 mb-3">
      <template v-if="!auth.myPlayerId">
        먼저 헤더의 "내 선수 연결"에서 본인 선수를 지정하세요.
      </template>
      <template v-else>이 경기에 참여한 선수만 투표할 수 있습니다.</template>
    </p>
    <p v-else class="text-xs text-gray-500 mb-3">자신을 제외한 출전 선수에게 투표하세요.</p>

    <ul class="space-y-1">
      <li
        v-for="c in candidates"
        :key="c.id"
        class="flex items-center gap-3 p-2 rounded-lg transition-colors"
        :class="myVote === c.id ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-gray-50'"
      >
        <PlayerAvatar :player="c" :size="32" />
        <span class="flex-1 text-sm font-medium truncate">{{ c.name }}</span>
        <span class="text-xs text-gray-400 tabular-nums w-10 text-right">{{ tally[c.id] || 0 }}</span>
        <button
          v-if="!closed"
          type="button"
          class="text-xs px-3 py-1 rounded-full disabled:opacity-50"
          :class="myVote === c.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'"
          :disabled="!eligible || saving || c.id === auth.myPlayerId"
          @click="pick(c.id)"
        >
          {{ myVote === c.id ? '내 표' : '투표' }}
        </button>
      </li>
    </ul>

    <div v-if="auth.isAdmin && !closed" class="mt-4 pt-3 border-t">
      <BaseButton size="sm" variant="primary" @click="close">투표 마감 + MOM 확정</BaseButton>
    </div>
  </section>
</template>
