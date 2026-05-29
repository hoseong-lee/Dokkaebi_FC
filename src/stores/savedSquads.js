import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  listSavedSquads,
  getSavedSquad,
  createSavedSquad,
  updateSavedSquad,
  deleteSavedSquad
} from '@/firebase/database'

export const useSavedSquadsStore = defineStore('savedSquads', () => {
  const squads = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return squads.value
    loading.value = true
    try {
      squads.value = await listSavedSquads()
      loaded.value = true
    } finally {
      loading.value = false
    }
    return squads.value
  }

  function getById(id) {
    return squads.value.find((s) => s.id === id) || null
  }

  async function fetchOne(id) {
    const cached = getById(id)
    if (cached) return cached
    return getSavedSquad(id)
  }

  async function create(data) {
    const id = await createSavedSquad(data)
    await fetchAll(true)
    return id
  }

  async function update(id, data) {
    await updateSavedSquad(id, data)
    await fetchAll(true)
  }

  async function remove(id) {
    await deleteSavedSquad(id)
    squads.value = squads.value.filter((s) => s.id !== id)
  }

  return { squads, loading, loaded, fetchAll, getById, fetchOne, create, update, remove }
})
