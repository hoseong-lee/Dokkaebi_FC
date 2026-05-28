import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, castMomVote } from '@/firebase/database'

// 경기 상세에서만 실시간 구독.
export function useMatchVotes(matchId) {
  const votesMap = ref({}) // { uid: candidatePlayerId }
  const loading = ref(true)
  const saving = ref(false)

  // 후보별 표 카운트
  const tally = computed(() => {
    const map = {}
    for (const pid of Object.values(votesMap.value)) {
      if (!pid) continue
      map[pid] = (map[pid] || 0) + 1
    }
    return map
  })

  const totalVotes = computed(() => Object.keys(votesMap.value).length)

  function myVote(uid) {
    return votesMap.value[uid] || null
  }

  async function vote(candidatePlayerId) {
    saving.value = true
    try {
      await castMomVote(matchId, candidatePlayerId)
    } finally {
      saving.value = false
    }
  }

  const unsub = onValue(
    dbRef(rtdb, nsPath(`matches/${matchId}/votes`)),
    (snap) => {
      votesMap.value = snap.val() || {}
      loading.value = false
    },
    (err) => {
      console.error('vote subscribe failed', err)
      loading.value = false
    }
  )
  onUnmounted(() => unsub())

  return { votesMap, tally, totalVotes, loading, saving, myVote, vote }
}
