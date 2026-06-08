export const MATCH_TYPE_LABEL = {
  league: '리그',
  cup: '컵',
  friendly: '친선',
  futsal: '풋살',
  self: '자체전'
}

// 팀 통계(골득실/상대전적)에서 제외할 타입 (외부 정식 축구 외)
export const TEAM_STATS_EXCLUDE_TYPES = ['futsal', 'self']

export const MATCH_STATUS_LABEL = {
  scheduled: '예정',
  finished: '완료',
  cancelled: '취소'
}

export const EVENT_TYPE_LABEL = {
  goal: '골',
  assist: '어시스트',
  own_goal: '자책골',
  yellow: '경고',
  red: '퇴장'
}

export const EVENT_ICON = {
  goal: '⚽',
  own_goal: '🥅',
  yellow: '🟨',
  red: '🟥'
}

// 쿼터별 승수 집계 — { quarterWins, quarterLosses, quarterDraws, gd } 반환
// quarters 가 없으면 null (옛 데이터 호환은 matchResult 에서 처리)
export function quarterTally(match) {
  const qs = Array.isArray(match?.quarters) ? match.quarters : []
  if (qs.length === 0) return null
  let w = 0, l = 0, d = 0, gf = 0, ga = 0
  for (const q of qs) {
    const dok = q?.score?.dokkaebi ?? 0
    const opp = q?.score?.opponent ?? 0
    gf += dok
    ga += opp
    if (dok > opp) w++
    else if (dok < opp) l++
    else d++
  }
  return { quarterWins: w, quarterLosses: l, quarterDraws: d, gf, ga, gd: gf - ga }
}

// 도깨비 기준 승무패: 'W' | 'D' | 'L' | null
// 우선순위 (사용자 결정 — 2026-06-04):
//   1) 쿼터별 승수 비교 (4쿼터 중 더 많이 이긴 쪽)
//   2) 쿼터 동률 시: 골 득실 tiebreaker
//   3) 그래도 동률: 무
// quarters 가 없는 옛 데이터는 score(누적 골) 로 fallback.
export function matchResult(match) {
  if (match?.status !== 'finished') return null
  const t = quarterTally(match)
  if (t) {
    if (t.quarterWins > t.quarterLosses) return 'W'
    if (t.quarterWins < t.quarterLosses) return 'L'
    // 쿼터 승수 동률 → 골 득실로 tiebreak
    if (t.gd > 0) return 'W'
    if (t.gd < 0) return 'L'
    return 'D'
  }
  // 옛 데이터 fallback — score 누적 비교
  if (match.score?.dokkaebi == null) return null
  const { dokkaebi, opponent } = match.score
  if (dokkaebi > opponent) return 'W'
  if (dokkaebi < opponent) return 'L'
  return 'D'
}

export const RESULT_LABEL = { W: '승', D: '무', L: '패' }
export const RESULT_COLOR = {
  W: 'bg-blue-100 text-blue-700',
  D: 'bg-gray-100 text-gray-600',
  L: 'bg-red-100 text-dokkaebi'
}

// MOM·칭찬 투표 기간: 경기 일시로부터 2주까지만 허용
export const VOTING_WINDOW_DAYS = 14
export function isVotingPeriodExpired(match) {
  if (!match?.date) return false
  return Date.now() > match.date + VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000
}
export function votingDeadline(match) {
  if (!match?.date) return null
  return match.date + VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

// 양상(intensity) — 쿼터 승차에 따른 5단계
// big_win/win/draw/loss/big_loss + 1쿼터 차이는 close=true 부가 태그
// 압도 기준: 4쿼터 중 2쿼터 이상 차이 (예: 3승 1패 / 4승 0패 / 3승 0패 1무)
const BIG_QUARTER_DIFF = 2

export function matchIntensity(match) {
  if (match?.status !== 'finished') return null
  const t = quarterTally(match)
  if (t) {
    const d = t.quarterWins - t.quarterLosses
    const close = Math.abs(d) === 1
    if (d >= BIG_QUARTER_DIFF) return { key: 'big_win', close: false }
    if (d > 0) return { key: 'win', close }
    if (d === 0) {
      // 쿼터 동률 시 골 득실로 보조 양상 결정
      if (t.gd > 0) return { key: 'win', close: true }
      if (t.gd < 0) return { key: 'loss', close: true }
      return { key: 'draw', close: false }
    }
    if (d > -BIG_QUARTER_DIFF) return { key: 'loss', close }
    return { key: 'big_loss', close: false }
  }
  // 옛 데이터 fallback — 골 차 기준 4단계
  if (match.score?.dokkaebi == null) return null
  const dg = (match.score.dokkaebi || 0) - (match.score.opponent || 0)
  const close = Math.abs(dg) === 1
  if (dg >= 4) return { key: 'big_win', close: false }
  if (dg > 0) return { key: 'win', close }
  if (dg === 0) return { key: 'draw', close: false }
  if (dg > -4) return { key: 'loss', close }
  return { key: 'big_loss', close: false }
}

export const INTENSITY_LABEL = {
  big_win: '🔥 대승',
  win: '✅ 승',
  draw: '🤝 무',
  loss: '❌ 패',
  big_loss: '💥 대패'
}

export const INTENSITY_COLOR = {
  big_win: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  win: 'bg-blue-100 text-blue-700',
  draw: 'bg-gray-100 text-gray-600',
  loss: 'bg-red-100 text-dokkaebi',
  big_loss: 'bg-red-200 text-red-800 ring-1 ring-red-400'
}

// H2H 상대팀별 우열 — 최소 경기수 이상일 때만 유효
export function h2hTier(h, minGames = 2) {
  if (!h || h.played < minGames) return null
  const rate = h.win / h.played
  if (rate >= 0.6) return 'dominant'
  if (rate >= 0.4) return 'even'
  return 'weak'
}
export const TIER_LABEL = { dominant: '우세', even: '백중', weak: '약세' }
export const TIER_COLOR = {
  dominant: 'bg-emerald-100 text-emerald-700',
  even: 'bg-gray-100 text-gray-600',
  weak: 'bg-red-100 text-dokkaebi'
}
