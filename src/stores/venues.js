import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listVenues, createVenue, updateVenue, deleteVenue, importInitialVenues } from '@/firebase/database'

export const useVenuesStore = defineStore('venues', () => {
  const venues = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return venues.value
    loading.value = true
    try {
      venues.value = await listVenues()
      loaded.value = true
    } finally {
      loading.value = false
    }
    return venues.value
  }

  function getById(id) { return venues.value.find((v) => v.id === id) || null }

  async function create(data) {
    const id = await createVenue(data)
    await fetchAll(true)
    return id
  }
  async function update(id, data) {
    await updateVenue(id, data)
    await fetchAll(true)
  }
  async function remove(id) {
    await deleteVenue(id)
    venues.value = venues.value.filter((v) => v.id !== id)
  }
  async function seed() {
    const res = await importInitialVenues()
    await fetchAll(true)
    return res
  }

  return { venues, loading, loaded, fetchAll, getById, create, update, remove, seed }
})
