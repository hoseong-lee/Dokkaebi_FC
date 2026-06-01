import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, castCompliments } from '@/firebase/database'
import { tallyComplimentTotals, tallyComplimentTags } from '@/utils/compliments'

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

  async function save(picks) {
    saving.value = true
    try {
      await castCompliments(matchId, picks)
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
