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

// 도깨비 기준 승무패: 'W' | 'D' | 'L' | null
export function matchResult(match) {
  if (match?.status !== 'finished' || match.score?.dokkaebi == null) return null
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

// 양상(intensity) — 골 차에 따른 5단계
// big_win/win/draw/loss/big_loss + 1점 차이는 close=true 부가 태그
const BIG_DIFF = 4

export function matchIntensity(match) {
  if (match?.status !== 'finished' || match.score?.dokkaebi == null) return null
  const d = (match.score.dokkaebi || 0) - (match.score.opponent || 0)
  const close = Math.abs(d) === 1
  if (d >= BIG_DIFF) return { key: 'big_win', close: false }
  if (d > 0) return { key: 'win', close }
  if (d === 0) return { key: 'draw', close: false }
  if (d > -BIG_DIFF) return { key: 'loss', close }
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
