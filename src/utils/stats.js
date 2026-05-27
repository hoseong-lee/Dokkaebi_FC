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

export const FOOT_LABEL = { L: '왼발', R: '오른발', B: '양발' }
