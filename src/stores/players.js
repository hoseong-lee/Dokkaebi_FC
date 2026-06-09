import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer
} from '@/firebase/database'
import { POSITION_ORDER } from '@/utils/stats'
import { POSITION_CATEGORY } from '@/utils/positions'

export const usePlayersStore = defineStore('players', () => {
  const players = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const byPosition = computed(() => {
    const map = { GK: [], DF: [], MF: [], FW: [] }
    for (const p of players.value) {
      // mainPosition(상세) → category → fallback 으로 옛 position(GK/DF/MF/FW) 직접
      const cat = POSITION_CATEGORY[p.mainPosition] || POSITION_CATEGORY[p.subPosition] || p.position
      if (map[cat]) map[cat].push(p)
    }
    return map
  })

  const activePlayers = computed(() => players.value.filter((p) => p.active !== false))

  async function fetchAll(force = false) {
    if (loaded.value && !force) return players.value
    loading.value = true
    try {
      players.value = await listPlayers()
      loaded.value = true
    } finally {
      loading.value = false
    }
    return players.value
  }

  function getById(id) {
    return players.value.find((p) => p.id === id) || null
  }

  async function fetchOne(id) {
    const cached = getById(id)
    if (cached) return cached
    return getPlayer(id)
  }

  async function add(data) {
    const id = await createPlayer(data)
    await fetchAll(true)
    return id
  }

  async function update(id, data) {
    await updatePlayer(id, data)
    await fetchAll(true)
  }

  async function remove(id) {
    await deletePlayer(id)
    players.value = players.value.filter((p) => p.id !== id)
  }

  function sortedByPosition() {
    return [...players.value].sort((a, b) => {
      const pa = POSITION_ORDER.indexOf(a.position)
      const pb = POSITION_ORDER.indexOf(b.position)
      if (pa !== pb) return pa - pb
      return (a.number || 0) - (b.number || 0)
    })
  }

  return {
    players,
    loading,
    loaded,
    byPosition,
    activePlayers,
    fetchAll,
    fetchOne,
    getById,
    add,
    update,
    remove,
    sortedByPosition
  }
})
