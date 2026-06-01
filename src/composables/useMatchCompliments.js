import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, castCompliments, tallyCompliments } from '@/firebase/database'

// 경기 상세에서 실시간 구독.
// match.compliments = { voterUid: [playerId1, playerId2, playerId3] }
export function useMatchCompliments(matchId) {
  const map = ref({})  // { uid: [pid, pid, pid] }
  const loading = ref(true)
  const saving = ref(false)

  // 후보별 칭찬 횟수
  const tally = computed(() => tallyCompliments(map.value))
  const totalVoters = computed(() => Object.keys(map.value).length)

  async function vote(playerIds) {
    saving.value = true
    try {
      await castCompliments(matchId, playerIds)
    } finally {
      saving.value = false
    }
  }

  const unsub = onValue(
    dbRef(rtdb, nsPath(`matches/${matchId}/compliments`)),
    (snap) => {
      map.value = snap.val() || {}
      loading.value = false
    },
    (err) => {
      console.error('compliments subscribe failed', err)
      loading.value = false
    }
  )
  onUnmounted(() => unsub())

  return { map, tally, totalVoters, loading, saving, vote }
}
