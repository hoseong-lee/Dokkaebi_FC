// 어시스터→스코어러 페어 분석
// matches.events 에서 (assistPlayerId, playerId) 쌍을 카운트.
// 시즌 ID 가 주어지면 해당 시즌만, null 이면 통산.

export function bestDuos(matches, seasonId = null) {
  const map = new Map() // key 'a__s' → count
  for (const m of matches) {
    if (m.status !== 'finished') continue
    if (seasonId && m.seasonId !== seasonId) continue
    for (const e of m.events || []) {
      if (e.type !== 'goal' || !e.assistPlayerId || !e.playerId) continue
      if (e.assistPlayerId === e.playerId) continue
      const key = `${e.assistPlayerId}__${e.playerId}`
      map.set(key, (map.get(key) || 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([key, count]) => {
      const [assister, scorer] = key.split('__')
      return { assister, scorer, count }
    })
    .sort((a, b) => b.count - a.count)
}
