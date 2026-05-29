export function emptyStats() {
  return { appearances: 0, goals: 0, assists: 0, momCount: 0 }
}

export function attackPoints(stats) {
  if (!stats) return 0
  return (stats.goals || 0) + (stats.assists || 0)
}

export function seasonStatsOf(player, seasonId) {
  if (!player) return emptyStats()
  if (!seasonId) return player.stats || emptyStats()
  return player.seasonStats?.[seasonId] || emptyStats()
}

// 경기 events 배열 → { [playerId]: { goals, assists } } 집계
export function tallyEvents(events = []) {
  const map = {}
  const ensure = (id) => {
    if (!map[id]) map[id] = { goals: 0, assists: 0 }
    return map[id]
  }
  for (const ev of events) {
    if (ev.type === 'goal') {
      ensure(ev.playerId).goals += 1
      if (ev.assistPlayerId) ensure(ev.assistPlayerId).assists += 1
    }
  }
  return map
}

export const POSITION_LABEL = {
  GK: '골키퍼',
  DF: '수비수',
  MF: '미드필더',
  FW: '공격수'
}

export const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW']

// 컬러 라벨 (광역 카테고리 기준)
export const POSITION_BADGE = {
  GK: 'bg-amber-100 text-amber-800',
  DF: 'bg-sky-100 text-sky-800',
  MF: 'bg-emerald-100 text-emerald-800',
  FW: 'bg-rose-100 text-rose-700'
}
// 강조형 (선수 상세 헤더 등)
export const POSITION_BADGE_STRONG = {
  GK: 'bg-amber-500 text-white',
  DF: 'bg-sky-500 text-white',
  MF: 'bg-emerald-500 text-white',
  FW: 'bg-rose-500 text-white'
}

export const FOOT_LABEL = { L: '왼발', R: '오른발', B: '양발' }
