import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getActiveSeason, listSeasons, createSeason } from '@/firebase/database'

export const useSeasonStore = defineStore('season', () => {
  const activeSeason = ref(null)
  const seasons = ref([])
  const selectedId = ref(null)
  const loaded = ref(false)

  const activeId = computed(() => activeSeason.value?.id || null)
  const selectedSeason = computed(
    () => seasons.value.find((s) => s.id === selectedId.value) || activeSeason.value || null
  )
  // 최신순 정렬된 목록 (드롭다운용)
  const list = computed(() =>
    [...seasons.value].sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
  )

  async function ensure() {
    if (loaded.value) return activeSeason.value
    const [active, all] = await Promise.all([getActiveSeason(), listSeasons()])
    activeSeason.value = active
    seasons.value = all
    if (!selectedId.value) selectedId.value = active?.id || all[0]?.id || null
    loaded.value = true
    return active
  }

  async function refresh() {
    const [active, all] = await Promise.all([getActiveSeason(), listSeasons()])
    activeSeason.value = active
    seasons.value = all
    if (!selectedId.value || !all.find((s) => s.id === selectedId.value)) {
      selectedId.value = active?.id || all[0]?.id || null
    }
    loaded.value = true
    return active
  }

  function setSelected(id) {
    if (seasons.value.find((s) => s.id === id)) selectedId.value = id
  }

  async function fetchSeasons() {
    seasons.value = await listSeasons()
    return seasons.value
  }

  async function create(data) {
    const id = await createSeason(data)
    await refresh()
    return id
  }

  return {
    activeSeason, seasons, selectedId, list, loaded,
    activeId, selectedSeason,
    ensure, refresh, setSelected, fetchSeasons, create
  }
})
