// 구장별 통계 — venueId 또는 location 으로 매치 필터 + 집계
import { matchResult, TEAM_STATS_EXCLUDE_TYPES } from './match'

function emptyRec() {
  return { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, momCounts: {}, lastDate: 0 }
}

// venue 한 곳의 통계
export function statsForVenue(venue, matches) {
  const rec = emptyRec()
  if (!venue || !Array.isArray(matches)) return withRates(rec)

  for (const m of matches) {
    if (!matchVenueMatches(m, venue)) continue
    if (TEAM_STATS_EXCLUDE_TYPES.includes(m.type)) continue
    const result = matchResult(m)
    if (!result) continue
    rec.played += 1
    if (result === 'W') rec.wins += 1
    else if (result === 'D') rec.draws += 1
    else if (result === 'L') rec.losses += 1
    rec.gf += m.score?.dokkaebi ?? 0
    rec.ga += m.score?.opponent ?? 0
    if (m.momPlayerId) {
      rec.momCounts[m.momPlayerId] = (rec.momCounts[m.momPlayerId] || 0) + 1
    }
    if (m.date && m.date > rec.lastDate) rec.lastDate = m.date
  }
  return withRates(rec)
}

// 매치가 이 venue 에서 진행됐는지 — venueId 우선, 없으면 location 문자열 매칭 fallback
function matchVenueMatches(m, venue) {
  if (m.venueId && m.venueId === venue.id) return true
  if (m.venueId) return false  // venueId 명시됐는데 다른 venue 면 X
  // venueId 미설정 매치는 location 으로 fallback (legacy 데이터)
  if (m.location && venue.name) {
    return m.location.includes(venue.name) || venue.name.includes(m.location)
  }
  return false
}

function withRates(rec) {
  const total = rec.played
  return {
    ...rec,
    winRate: total ? rec.wins / total : 0,
    drawRate: total ? rec.draws / total : 0,
    lossRate: total ? rec.losses / total : 0,
    gd: rec.gf - rec.ga,
    avgGf: total ? rec.gf / total : 0,
    avgGa: total ? rec.ga / total : 0,
    pointsPerGame: total ? (rec.wins * 3 + rec.draws) / total : 0,
    // momCounts → 상위 3명 id+count
    topMomPlayers: Object.entries(rec.momCounts)
      .map(([pid, c]) => ({ playerId: pid, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }
}

// 모든 venue × stats 매트릭스 (랭킹용)
export function rankVenues(venues, matches) {
  return venues
    .map((v) => ({ venue: v, stats: statsForVenue(v, matches) }))
    .filter((x) => x.stats.played > 0)
    .sort((a, b) => b.stats.winRate - a.stats.winRate || b.stats.played - a.stats.played)
}

// 행운의 구장: 승률 가장 높고 played >= 3 인 곳
export function pickLuckyVenue(venues, matches) {
  const ranked = rankVenues(venues, matches).filter((x) => x.stats.played >= 3)
  return ranked[0] || null
}
