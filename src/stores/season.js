import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getActiveSeason, listSeasons, createSeason } from '@/firebase/firestore'

export const useSeasonStore = defineStore('season', () => {
  const activeSeason = ref(null)
  const seasons = ref([])
  const loaded = ref(false)

  const activeId = computed(() => activeSeason.value?.id || null)

  async function ensure() {
    if (loaded.value) return activeSeason.value
    activeSeason.value = await getActiveSeason()
    loaded.value = true
    return activeSeason.value
  }

  async function fetchSeasons() {
    seasons.value = await listSeasons()
    return seasons.value
  }

  async function create(data) {
    const id = await createSeason(data)
    await fetchSeasons()
    if (data.active) {
      activeSeason.value = { id, ...data }
    }
    return id
  }

  return { activeSeason, seasons, activeId, ensure, fetchSeasons, create }
})
