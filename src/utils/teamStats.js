import { matchResult, TEAM_STATS_EXCLUDE_TYPES } from './match'
import { canonicalOpponent } from './opponentNormalize'

const isCountable = (m) =>
  m.status === 'finished' &&
  m.score?.dokkaebi != null &&
  !TEAM_STATS_EXCLUDE_TYPES.includes(m.type)

// 완료 경기 → 팀 전적 요약 (풋살 등 제외)
export function teamSummary(matches = []) {
  const finished = matches
    .filter(isCountable)
    .sort((a, b) => (a.date || 0) - (b.date || 0))

  const s = { played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0 }
  for (const m of finished) {
    s.played++
    s.gf += m.score.dokkaebi || 0
    s.ga += m.score.opponent || 0
    const r = matchResult(m)
    if (r === 'W') s.win++
    else if (r === 'D') s.draw++
    else if (r === 'L') s.loss++
  }
  s.diff = s.gf - s.ga
  s.winRate = s.played ? Math.round((s.win / s.played) * 100) : 0
  // 최근 5경기 폼 (최신순)
  s.form = finished.slice(-5).reverse().map((m) => matchResult(m))
  return s
}

// 상대팀별 전적 (풋살 등 제외)
export function headToHead(matches = []) {
  const map = {}
  for (const m of matches) {
    if (!isCountable(m)) continue
    const key = canonicalOpponent(m.opponent) || '미상'
    if (!map[key]) map[key] = { opponent: key, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0 }
    const h = map[key]
    h.played++
    h.gf += m.score.dokkaebi || 0
    h.ga += m.score.opponent || 0
    const r = matchResult(m)
    if (r === 'W') h.win++
    else if (r === 'D') h.draw++
    else if (r === 'L') h.loss++
  }
  return Object.values(map).sort((a, b) => b.played - a.played)
}
