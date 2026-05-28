import { dayjs } from './date'

// 선수 ID + 시즌 → 월별 [{ym, label, appearances, goals, assists}]
export function playerMonthlySeries(playerId, matches, seasonId) {
  const list = matches.filter(
    (m) => m.status === 'finished' && (!seasonId || m.seasonId === seasonId)
  )
  const buckets = {}
  for (const m of list) {
    const ym = dayjs(m.date).format('YYYY-MM')
    if (!buckets[ym]) buckets[ym] = { ym, appearances: 0, goals: 0, assists: 0 }
    const inLineup = (m.lineup || []).includes(playerId)
    if (inLineup) buckets[ym].appearances++
    for (const e of m.events || []) {
      if (e.type !== 'goal') continue
      if (e.playerId === playerId) buckets[ym].goals++
      if (e.assistPlayerId === playerId) buckets[ym].assists++
    }
  }
  return Object.keys(buckets)
    .sort()
    .map((ym) => ({
      ym,
      label: dayjs(ym + '-01').format('M월'),
      ...buckets[ym]
    }))
}
