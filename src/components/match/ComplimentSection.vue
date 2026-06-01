<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useMatchCompliments } from '@/composables/useMatchCompliments'
import { useToast } from '@/composables/useToast'
import { COMPLIMENT_MAX } from '@/firebase/database'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({ match: { type: Object, required: true } })
const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()
const { map, tally, totalVoters, saving, vote } = useMatchCompliments(props.match.id)

const candidates = computed(() =>
  (props.match.lineup || [])
    .map((id) => playersStore.getById(id))
    .filter(Boolean)
)

const myUid = computed(() => auth.user?.uid || null)
const myPicks = computed(() => myUid.value ? (map.value[myUid.value] || []) : [])
// 로컬 ref — 동시에 여러 명 토글하려면 reactive 가 필요
const localPicks = ref([])
watch(myPicks, (v) => { localPicks.value = [...v] }, { immediate: true })

const eligible = computed(() => {
  const pid = auth.myPlayerId
  if (!pid) return false
  return (props.match.lineup || []).includes(pid)
})

const closed = computed(() => !!props.match.votingClosed)

function isPicked(pid) { return localPicks.value.includes(pid) }

async function toggle(playerId) {
  if (!eligible.value) return toast.error('이 경기에 참여한 선수만 칭찬할 수 있습니다.')
  if (closed.value) return
  if (playerId === auth.myPlayerId) return  // 본인 제외

  const current = localPicks.value
  const next = current.includes(playerId)
    ? current.filter((p) => p !== playerId)
    : current.length >= COMPLIMENT_MAX
      ? null  // 이미 3명 선택됨
      : [...current, playerId]

  if (next === null) {
    return toast.error(`최대 ${COMPLIMENT_MAX}명까지 칭찬할 수 있어요.`)
  }
  localPicks.value = next
  try {
    await vote(next)
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
    localPicks.value = current  // 롤백
  }
}

// 상위 순위 (마감 후 강조용)
const ranking = computed(() => {
  const arr = Object.entries(tally.value)
    .map(([pid, count]) => ({ pid, count }))
    .sort((a, b) => b.count - a.count)
  return arr
})
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold text-navy">💝 칭찬합니다</h2>
      <span class="text-xs text-gray-400">{{ totalVoters }}명 참여</span>
    </div>

    <p v-if="closed" class="text-xs text-gray-500 mb-3">
      칭찬 투표가 마감되었습니다. 받은 매너 점수가 누적됐어요.
    </p>
    <p v-else-if="!eligible" class="text-xs text-gray-500 mb-3">
      <template v-if="!auth.myPlayerId">
        먼저 헤더의 "내 선수 연결"에서 본인 선수를 지정하세요.
      </template>
      <template v-else>이 경기에 참여한 선수만 칭찬할 수 있습니다.</template>
    </p>
    <p v-else class="text-xs text-gray-500 mb-3">
      좋은 플레이/매너를 보여준 동료에게 칭찬을 보내세요. (최대 <span class="font-bold text-navy">{{ COMPLIMENT_MAX }}명</span> · 자기 자신 제외)
      <br>
      <span class="text-rose-600 font-semibold">받은 칭찬은 매너 점수로 누적됩니다.</span>
    </p>

    <ul class="space-y-1">
      <li
        v-for="(c, idx) in candidates"
        :key="c.id"
        class="flex items-center gap-3 p-2 rounded-lg transition-colors"
        :class="isPicked(c.id) ? 'bg-rose-50 ring-1 ring-rose-300' : 'hover:bg-gray-50'"
      >
        <span v-if="closed && ranking[0]?.pid === c.id && ranking[0]?.count > 0" class="text-amber-500">🏅</span>
        <PlayerAvatar :player="c" :size="32" />
        <span class="flex-1 text-sm font-medium truncate">{{ c.name }}</span>
        <span class="text-xs text-gray-400 tabular-nums w-12 text-right">
          💝 {{ tally[c.id] || 0 }}
        </span>
        <button
          v-if="!closed"
          type="button"
          class="text-xs px-3 py-1 rounded-full disabled:opacity-50 transition-colors"
          :class="isPicked(c.id) ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-700'"
          :disabled="!eligible || saving || c.id === auth.myPlayerId"
          @click="toggle(c.id)"
        >
          {{ isPicked(c.id) ? '✓ 칭찬' : '칭찬' }}
        </button>
      </li>
    </ul>

    <p v-if="!closed && eligible" class="text-[11px] text-gray-400 mt-3 text-right">
      선택: <span class="font-bold text-rose-600">{{ localPicks.length }}</span>/{{ COMPLIMENT_MAX }}
    </p>
  </section>
</template>
