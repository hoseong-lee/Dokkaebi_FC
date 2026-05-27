export const MATCH_TYPE_LABEL = {
  league: '리그',
  cup: '컵',
  friendly: '친선'
}

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
