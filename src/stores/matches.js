import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  submitMatchResult
} from '@/firebase/firestore'
import { isUpcoming } from '@/utils/date'

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const upcoming = computed(() =>
    matches.value
      .filter((m) => m.status === 'scheduled')
      .sort((a, b) => dateVal(a.date) - dateVal(b.date))
  )

  const finished = computed(() =>
    matches.value.filter((m) => m.status === 'finished')
  )

  const nextMatch = computed(() => upcoming.value.find((m) => isUpcoming(m.date)) || upcoming.value[0] || null)

  function dateVal(d) {
    if (!d) return 0
    return typeof d.toDate === 'function' ? d.toDate().getTime() : new Date(d).getTime()
  }

  async function fetchAll(opts = {}, force = false) {
    if (loaded.value && !force) return matches.value
    loading.value = true
    try {
      matches.value = await listMatches(opts)
      loaded.value = true
    } finally {
      loading.value = false
    }
    return matches.value
  }

  function getById(id) {
    return matches.value.find((m) => m.id === id) || null
  }

  async function fetchOne(id) {
    return getById(id) || getMatch(id)
  }

  async function add(data) {
    const id = await createMatch(data)
    await fetchAll({}, true)
    return id
  }

  async function update(id, data) {
    await updateMatch(id, data)
    await fetchAll({}, true)
  }

  async function remove(id) {
    await deleteMatch(id)
    matches.value = matches.value.filter((m) => m.id !== id)
  }

  async function submitResult(id, result) {
    await submitMatchResult(id, result)
    await fetchAll({}, true)
  }

  return {
    matches,
    loading,
    loaded,
    upcoming,
    finished,
    nextMatch,
    fetchAll,
    fetchOne,
    getById,
    add,
    update,
    remove,
    submitResult
  }
})
