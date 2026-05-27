import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb, auth } from '@/firebase/config'
import { setRsvp, nsPath } from '@/firebase/database'

// 경기 상세에서만 실시간 구독 (연결 유지 비용 고려)
export function useRsvp(matchId) {
  const rsvps = ref([])
  const loading = ref(true)
  const saving = ref(false)

  const myUid = computed(() => auth.currentUser?.uid)
  const myRsvp = computed(() => rsvps.value.find((r) => r.uid === myUid.value) || null)

  const grouped = computed(() => ({
    attending: rsvps.value.filter((r) => r.status === 'attending'),
    maybe: rsvps.value.filter((r) => r.status === 'maybe'),
    declined: rsvps.value.filter((r) => r.status === 'declined')
  }))

  const unsub = onValue(
    dbRef(rtdb, nsPath(`matches/${matchId}/rsvps`)),
    (snap) => {
      const v = snap.val() || {}
      rsvps.value = Object.entries(v).map(([id, val]) => ({ id, ...val }))
      loading.value = false
    },
    (err) => {
      console.error('rsvp 구독 실패', err)
      loading.value = false
    }
  )

  async function respond(status, note = '') {
    saving.value = true
    try {
      await setRsvp(matchId, status, note)
    } finally {
      saving.value = false
    }
  }

  onUnmounted(() => unsub())

  return { rsvps, loading, saving, myRsvp, grouped, respond }
}
