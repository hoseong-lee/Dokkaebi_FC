import { seasonStatsOf } from './stats'
import { categoryOf, laneOf } from './positions'
import { getSlots } from './formations'

// composite 가중치
function compositeScore(s) {
  return (s.goals || 0) * 3 + (s.assists || 0) * 2 + (s.momCount || 0) * 5 + (s.appearances || 0) * 0.5
}

const TARGET = { GK: 1, DF: 4, MF: 3, FW: 3 } // 4-3-3
const FORMATION = '4-3-3'

export function pickBestEleven(players, seasonId = null) {
  const ranked = players
    .filter((p) => p.active !== false)
    .map((p) => {
      const s = seasonId ? seasonStatsOf(p, seasonId) : p.stats || {}
      const total = (s.goals || 0) + (s.assists || 0) + (s.appearances || 0) + (s.momCount || 0)
      return { player: p, stats: s, score: compositeScore(s), total }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.score - a.score)

  if (ranked.length === 0) return null

  const byCat = { GK: [], DF: [], MF: [], FW: [] }
  for (const r of ranked) {
    const cat =
      categoryOf(r.player.mainPosition) ||
      categoryOf(r.player.subPosition) ||
      r.player.position ||
      'MF'
    if (byCat[cat]) byCat[cat].push(r)
    else byCat.MF.push(r)
  }

  const chosen = []
  const usedIds = new Set()
  for (const cat of ['GK', 'DF', 'MF', 'FW']) {
    const picks = byCat[cat].slice(0, TARGET[cat])
    for (const r of picks) {
      chosen.push(r)
      usedIds.add(r.player.id)
    }
  }
  // 부족분 보충 (점수 순)
  const need = 11 - chosen.length
  if (need > 0) {
    const rest = ranked.filter((r) => !usedIds.has(r.player.id)).slice(0, need)
    chosen.push(...rest)
  }

  // 슬롯 매핑
  const slots = getSlots(FORMATION)
  const positions = {}
  const groups = { GK: [], DF: [], MF: [], FW: [] }
  for (const r of chosen) {
    const c =
      categoryOf(r.player.mainPosition) ||
      categoryOf(r.player.subPosition) ||
      r.player.position ||
      'MF'
    if (groups[c]) groups[c].push(r)
    else groups.MF.push(r)
  }

  for (const role of ['GK', 'DF', 'MF', 'FW']) {
    const roleSlots = slots.filter((s) => s.role === role).sort((a, b) => a.x - b.x)
    const pool = (groups[role] || [])
      .slice()
      .sort((a, b) => laneOf(a.player.mainPosition) - laneOf(b.player.mainPosition))
    for (let i = 0; i < roleSlots.length; i++) {
      const r = pool[i]
      if (r) positions[roleSlots[i].id] = r.player.id
    }
  }

  return {
    formation: FORMATION,
    positions,
    lineup: chosen.map((r) => r.player.id),
    breakdown: chosen.map((r) => ({
      id: r.player.id,
      name: r.player.name,
      number: r.player.number,
      mainPosition: r.player.mainPosition,
      score: Math.round(r.score * 10) / 10,
      stats: r.stats
    }))
  }
}
