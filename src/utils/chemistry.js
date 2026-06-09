// 케미스트리 매트릭스 — 같이 뛴 페어별 승률·골 connection 분석.
// duoWinRates(analytics.js) 와 유사하지만 본 모듈은 페어별 골 합산까지 포함하고
// minTogether 옵션을 통해 표본 컷오프를 호출자가 제어할 수 있다.
import { matchResult, TEAM_STATS_EXCLUDE_TYPES } from './match'

// matches: 경기 배열 (각 경기는 quarters[].lineup, events[], status, score 등 포함)
// players: 선수 배열 (id 기반 매칭에 사용)
// options.minTogether: 페어로 같이 뛴 최소 경기 수 (기본 3)
export function computeChemistry(matches, players, options = {}) {
  const minTogether = options.minTogether ?? 3
  const playerIds = new Set((players || []).map((p) => p.id))

  // key 'aId|bId' (aId < bId) → { together, wins, draws, losses, goalSum }
  const pairs = new Map()

  for (const m of matches || []) {
    if (!m || m.status !== 'finished') continue
    if (TEAM_STATS_EXCLUDE_TYPES.includes(m.type)) continue
    const result = matchResult(m)
    if (!result) continue

    // 이 경기에 출전한 lineup 합집합
    const lineupSet = new Set()
    for (const q of m.quarters || []) {
      for (const pid of q.lineup || []) {
        if (playerIds.has(pid)) lineupSet.add(pid)
      }
    }
    if (lineupSet.size < 2) continue

    // 이 경기의 선수별 골 (자책 제외)
    const goalByPlayer = {}
    for (const e of m.events || []) {
      if (e?.type !== 'goal' || !e.playerId) continue
      goalByPlayer[e.playerId] = (goalByPlayer[e.playerId] || 0) + 1
    }

    const ids = [...lineupSet].sort()
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const aId = ids[i]
        const bId = ids[j]
        const key = `${aId}|${bId}`
        let rec = pairs.get(key)
        if (!rec) {
          rec = { aId, bId, together: 0, wins: 0, draws: 0, losses: 0, goalSum: 0 }
          pairs.set(key, rec)
        }
        rec.together += 1
        if (result === 'W') rec.wins += 1
        else if (result === 'D') rec.draws += 1
        else rec.losses += 1
        rec.goalSum += (goalByPlayer[aId] || 0) + (goalByPlayer[bId] || 0)
      }
    }
  }

  const out = []
  for (const rec of pairs.values()) {
    if (rec.together < minTogether) continue
    out.push({
      ...rec,
      winRate: rec.together ? rec.wins / rec.together : 0
    })
  }
  out.sort((a, b) => b.winRate - a.winRate || b.together - a.together)
  return out
}
