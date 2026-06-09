import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb, auth } from '@/firebase/config'
import { nsPath, castCompliments } from '@/firebase/database'
import { tallyComplimentTotals, tallyComplimentTags } from '@/utils/compliments'
import { usePlayersStore } from '@/stores/players'

// 경기 상세에서 실시간 구독.
// match.compliments = { voterUid: { playerId: [tagId, ...] } }
export function useMatchCompliments(matchId) {
  const map = ref({})  // { uid: { pid: [tags] } }
  const loading = ref(true)
  const saving = ref(false)

  // 선수별 받은 칭찬 태그 총 개수 (= 매너 점수)
  const totals = computed(() => tallyComplimentTotals(map.value))
  // 선수별 태그 분포 (선수 카드에 작은 칩으로 표시)
  const tagBreakdown = computed(() => tallyComplimentTags(map.value))
  const totalVoters = computed(() => Object.keys(map.value).length)

  const playersStore = usePlayersStore()
  async function save(picks) {
    saving.value = true
    try {
      const myUid = auth.currentUser?.uid
      const prev = myUid ? (map.value[myUid] || {}) : {}
      const affectedIds = new Set([
        ...Object.keys(prev),
        ...Object.keys(picks || {})
      ])
      await castCompliments(matchId, picks)
      // players.stats.complimentCount/Tags 가 즉시 reconcile 됐으니
      // 변경된 선수만 부분 refetch — 매너 점수 / 칭찬 분포 즉시 반영
      await playersStore.refetchPlayers([...affectedIds])
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

  return { map, totals, tagBreakdown, totalVoters, loading, saving, save }
}
