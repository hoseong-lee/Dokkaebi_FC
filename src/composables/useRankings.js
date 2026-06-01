import { computed, unref } from 'vue'
import { seasonStatsOf, attackPoints } from '@/utils/stats'

// useRankings(playersRef, seasonRef)
//   seasonRef: null/'' → 통산 / 'sXXXX' → 해당 시즌
export function useRankings(playersRef, seasonRef) {
  function rank(metric) {
    const players = unref(playersRef) || []
    const seasonId = unref(seasonRef) || null

    return players
      .map((p) => {
        const s = seasonId ? seasonStatsOf(p, seasonId) : p.stats || {}
        const value = metric === 'points' ? attackPoints(s) : s[metric] || 0
        return { player: p, value }
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const topScorers = computed(() => rank('goals'))
  const topAssists = computed(() => rank('assists'))
  const topPoints = computed(() => rank('points'))
  const topAppearances = computed(() => rank('appearances'))
  const topMom = computed(() => rank('momCount'))
  const topCompliments = computed(() => rank('complimentCount'))

  return { topScorers, topAssists, topPoints, topAppearances, topMom, topCompliments, rank }
}
