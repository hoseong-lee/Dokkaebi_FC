// 도깨비FC 승률 분석 — 포메이션 / 선수 / 상대팀 / 라인업 조합별 통계
import { matchResult, TEAM_STATS_EXCLUDE_TYPES } from './match'

// 분석 대상: 정식 경기(풋살·자체전 제외) + 결과 입력된 경기만
export function analyzableMatches(matches, seasonId = null) {
  return (matches || []).filter((m) => {
    if (!matchResult(m)) return false
    if (TEAM_STATS_EXCLUDE_TYPES.includes(m.type)) return false
    if (seasonId && m.seasonId !== seasonId) return false
    return true
  })
}

function emptyRecord() {
  return { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
}

function addResult(rec, result, score) {
  rec.played += 1
  if (result === 'W') rec.wins += 1
  else if (result === 'D') rec.draws += 1
  else if (result === 'L') rec.losses += 1
  rec.gf += score?.dokkaebi ?? 0
  rec.ga += score?.opponent ?? 0
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
    pointsPerGame: total ? (rec.wins * 3 + rec.draws) / total : 0
  }
}

// ── 포메이션별 승률 ──
// 한 경기 안에서 가장 많이 사용된 포메이션을 "주포메이션"으로 산정.
// 4쿼터가 다른 포메이션이면 가장 빈번한 것 우선, 동률이면 1쿼터 우선.
function dominantFormation(match) {
  const counts = {}
  for (const q of match.quarters || []) {
    if (!q.formation) continue
    counts[q.formation] = (counts[q.formation] || 0) + 1
  }
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return list[0]?.[0] || null
}

export function formationStats(matches) {
  const map = {}
  for (const m of matches) {
    const f = dominantFormation(m)
    if (!f) continue
    if (!map[f]) map[f] = emptyRecord()
    addResult(map[f], matchResult(m), m.score)
  }
  return Object.entries(map)
    .map(([formation, rec]) => ({ formation, ...withRates(rec) }))
    .sort((a, b) => b.played - a.played)
}

// ── 선수별 영향 (Win-Rate Impact) ──
// 본인 출전 시 승률 vs 결장 시 승률 비교
export function playerImpact(matches, players) {
  // 각 선수별 출전 경기 / 결과
  const stats = {} // pid → { with: rec, without: rec }
  const totalRec = emptyRecord()

  for (const m of matches) {
    const result = matchResult(m)
    const score = m.score
    addResult(totalRec, result, score)
    const lineupSet = new Set()
    for (const q of m.quarters || []) {
      for (const pid of q.lineup || []) lineupSet.add(pid)
    }
    // 각 선수에 대해 with(출전) 기록 누적
    for (const pid of lineupSet) {
      if (!stats[pid]) stats[pid] = { with: emptyRecord(), without: emptyRecord() }
      addResult(stats[pid].with, result, score)
    }
  }

  // without = total - with
  const result = []
  for (const pid of Object.keys(stats)) {
    const w = stats[pid].with
    const wo = {
      played: totalRec.played - w.played,
      wins: totalRec.wins - w.wins,
      draws: totalRec.draws - w.draws,
      losses: totalRec.losses - w.losses,
      gf: totalRec.gf - w.gf,
      ga: totalRec.ga - w.ga
    }
    if (w.played < 3) continue // 3경기 미만 제외 (표본 부족)
    const wRates = withRates(w)
    const woRates = withRates(wo)
    const player = players.find((p) => p.id === pid)
    if (!player) continue
    result.push({
      playerId: pid,
      player,
      withSelf: wRates,
      withoutSelf: woRates,
      impact: wRates.winRate - woRates.winRate, // 양수 = 본인 출전 시 승률 ↑
      pointsImpact: wRates.pointsPerGame - woRates.pointsPerGame
    })
  }
  return result.sort((a, b) => b.impact - a.impact)
}

// ── 상대팀별 H2H ──
export function opponentStats(matches) {
  const map = {}
  for (const m of matches) {
    const opp = m.opponent || '미상'
    if (!map[opp]) map[opp] = emptyRecord()
    addResult(map[opp], matchResult(m), m.score)
  }
  return Object.entries(map)
    .map(([opponent, rec]) => ({ opponent, ...withRates(rec) }))
    .sort((a, b) => b.played - a.played)
}

// ── 라인업 듀오 승률 (2명 조합) ──
// 같이 출전한 듀오의 승률 vs 평균
export function duoWinRates(matches, players, minPlayed = 3) {
  const map = {} // "p1|p2" → rec
  for (const m of matches) {
    const result = matchResult(m)
    const score = m.score
    const lineupSet = new Set()
    for (const q of m.quarters || []) {
      for (const pid of q.lineup || []) lineupSet.add(pid)
    }
    const ids = [...lineupSet].sort()
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = `${ids[i]}|${ids[j]}`
        if (!map[k]) map[k] = emptyRecord()
        addResult(map[k], result, score)
      }
    }
  }
  const result = []
  for (const [k, rec] of Object.entries(map)) {
    if (rec.played < minPlayed) continue
    const [a, b] = k.split('|')
    const pa = players.find((p) => p.id === a)
    const pb = players.find((p) => p.id === b)
    if (!pa || !pb) continue
    result.push({
      pair: [pa, pb],
      ...withRates(rec)
    })
  }
  return result.sort((a, b) => b.winRate - a.winRate || b.played - a.played)
}

// 매치 전체 평균 — 비교 기준선
export function overallRecord(matches) {
  const rec = emptyRecord()
  for (const m of matches) {
    addResult(rec, matchResult(m), m.score)
  }
  return withRates(rec)
}
