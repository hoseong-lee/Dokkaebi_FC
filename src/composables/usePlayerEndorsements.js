import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, setEndorsement } from '@/firebase/database'
import { tallyEndorsements, topSkills, endorsementTotal, masterTags } from '@/utils/skills'

// 선수 상세 페이지 등에서 실시간 endorsement 구독
export function usePlayerEndorsements(playerId) {
  const endorsements = ref({})   // { voterUid: [tags] }
  const loading = ref(true)
  const saving = ref(false)

  const tally = computed(() => tallyEndorsements(endorsements.value))
  const top3 = computed(() => topSkills(endorsements.value, 3))
  const totalCount = computed(() => endorsementTotal(endorsements.value))
  const masters = computed(() => masterTags(endorsements.value))
  const voterCount = computed(() => Object.keys(endorsements.value).length)

  function myPicksForUid(uid) {
    if (!uid) return []
    return endorsements.value[uid] || []
  }

  async function save(tags) {
    saving.value = true
    try {
      await setEndorsement(playerId, tags)
    } finally {
      saving.value = false
    }
  }

  const unsub = onValue(
    dbRef(rtdb, nsPath(`endorsements/${playerId}`)),
    (snap) => {
      endorsements.value = snap.val() || {}
      loading.value = false
    },
    (err) => {
      console.error('endorsements subscribe failed', err)
      loading.value = false
    }
  )
  onUnmounted(() => unsub())

  return { endorsements, tally, top3, totalCount, masters, voterCount, loading, saving, save, myPicksForUid }
}
