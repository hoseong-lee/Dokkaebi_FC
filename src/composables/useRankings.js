import { computed, unref } from 'vue'
import { seasonStatsOf, attackPoints } from '@/utils/stats'

// 클라이언트 집계 방식: players 컬렉션의 비정규화 stats/seasonStats 를 정렬.
// 스펙의 동적 필드 인덱스 문제(seasonStats.{id}.goals)를 회피하기 위함.
export function useRankings(playersRef, seasonIdRef, scopeRef) {
  function rank(metric) {
    const players = unref(playersRef) || []
    const seasonId = scopeRef && unref(scopeRef) === 'season' ? unref(seasonIdRef) : null

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

  return { topScorers, topAssists, topPoints, rank }
}
