import { writeFileSync } from 'node:fs'

const SEASON_ID = 's2526'
const ms = (s) => new Date(s).getTime()

// ── 선수 명단 (카카오톡 초대명단 + 경기 등장 인물) ──
const playerDefs = [
  ['유희창', true], ['마진섭', true], ['윤범관', true], ['홍성현', true],
  ['김진오', true], ['김세욱', true], ['권순찬', true], ['임상범', true],
  ['박한주', true], ['신승민', true], ['김청수', true], ['박재익', true],
  ['김산이', true], ['김영우', true], ['정순인', true], ['김동민', true],
  ['강상섭', true], ['우재', true], ['김성민', true], ['김지웅', true],
  ['김주현', true], ['채재현', true], ['한지민', true], ['이수아', true],
  ['문종일', true], ['박준희', true], ['이호성', true],
  ['김성일', false], ['빅토르안', false], ['이재석', false],
  ['정희수', false], ['정병진', false], ['태원', false], ['김준우', false]
]

const players = {}
const keyByName = {}
playerDefs.forEach(([name, active], i) => {
  const key = 'p' + String(i + 1).padStart(2, '0')
  keyByName[name] = key
  players[key] = {
    name, number: i + 1, position: 'MF', preferredFoot: 'R', active,
    joinedAt: ms('2025-10-11'),
    stats: { appearances: 0, goals: 0, assists: 0, momCount: 0 },
    seasonStats: { [SEASON_ID]: { appearances: 0, goals: 0, assists: 0, momCount: 0 } }
  }
})

const nick = {
  희창: '유희창', 한주: '박한주', 세욱: '김세욱', 동민: '김동민',
  순인: '정순인', 진오: '김진오', 영우: '김영우', 순찬: '권순찬',
  상섭: '강상섭', 성현: '홍성현', 범관: '윤범관'
}
const pid = (n) => keyByName[nick[n] || n]

// 쿼터 헬퍼: q(상대득점, [[득점자, 어시(opt)], ...])
const q = (opp, goals = []) => ({ opp, goals })

const matchDefs = [
  {
    id: 'm01', date: '2025-11-01T09:00:00', opponent: '삼미FC', location: '창골축구장', type: 'league',
    lineupAll: ['김세욱', '권순찬', '유희창', '마진섭', '김진오', '강상섭', '윤범관', '신승민', '박준희', '김청수'],
    quarters: [q(2), q(1), q(1), q(1, [['진오']])]
  },
  {
    id: 'm02', date: '2025-11-29T20:00:00', opponent: '국대FC', location: '수락스포츠타운', type: 'league',
    quarters: [
      q(0, [['진오'], ['영우'], ['순인'], ['순인'], ['순찬']]),
      q(1, [['희창']]),
      q(2, [['상섭'], ['상섭'], ['성현']]),
      q(1)
    ]
  },
  {
    id: 'm03', date: '2026-04-18T18:00:00', opponent: '국대FC', location: '초안산', type: 'league',
    quarters: [
      q(1, [['희창'], ['한주'], ['세욱']]),
      q(2, [['희창'], ['희창'], ['동민']]),
      q(0, [['한주']]),
      q(0, [['희창'], ['동민']])
    ]
  },
  {
    id: 'm04', date: '2026-04-25T18:00:00', opponent: '원스FC', location: '수락산', type: 'league',
    quarters: [q(2), q(6, [['순인', '희창'], ['희창', '순인']]), q(2), q(2, [['희창']])]
  },
  {
    id: 'm05', date: '2026-05-16T19:00:00', opponent: '국대FC', location: '다락원체육공원축구장', type: 'league',
    quarters: [q(0, [['동민']]), q(2, [['세욱'], ['세욱']]), q(3, [['희창'], ['순인']]), q(3)]
  },
  {
    id: 'm06', date: '2026-05-23T10:00:00', opponent: '덕선FC', location: '불암산', type: 'league', scheduled: true
  }
]

const matches = {}
for (const m of matchDefs) {
  if (m.scheduled) {
    matches[m.id] = {
      seasonId: SEASON_ID, opponent: m.opponent, date: ms(m.date), location: m.location,
      locationUrl: '', type: m.type, status: 'scheduled',
      score: { dokkaebi: null, opponent: null }, lineup: [], events: [], quarters: [],
      momPlayerId: null, notes: '', createdBy: 'system', createdAt: ms(m.date), updatedAt: ms(m.date)
    }
    continue
  }

  const quarters = []
  const aggEvents = []
  const unionSet = new Set()
  let dok = 0, opp = 0

  m.quarters.forEach((qd, qi) => {
    const events = qd.goals.map(([scorer, assist]) => ({
      minute: 0, type: 'goal', playerId: pid(scorer), assistPlayerId: assist ? pid(assist) : null
    }))
    let lineup
    if (m.lineupAll) lineup = m.lineupAll.map((n) => keyByName[n]).filter(Boolean)
    else {
      const s = new Set()
      events.forEach((e) => { s.add(e.playerId); if (e.assistPlayerId) s.add(e.assistPlayerId) })
      lineup = [...s]
    }
    lineup.forEach((k) => unionSet.add(k))
    dok += events.length
    opp += qd.opp
    events.forEach((e) => aggEvents.push({ ...e, quarter: qi + 1 }))
    quarters.push({
      lineup, events, opponentScore: qd.opp,
      score: { dokkaebi: events.length, opponent: qd.opp },
      formation: null, positions: {}
    })
  })

  const lineup = [...unionSet]
  matches[m.id] = {
    seasonId: SEASON_ID, opponent: m.opponent, date: ms(m.date), location: m.location,
    locationUrl: '', type: m.type, status: 'finished',
    score: { dokkaebi: dok, opponent: opp },
    lineup, events: aggEvents, quarters,
    momPlayerId: null, notes: '카카오톡 채팅 기록 기반 자동 등록',
    createdBy: 'system', createdAt: ms(m.date), updatedAt: ms(m.date)
  }

  for (const k of lineup) {
    players[k].stats.appearances++
    players[k].seasonStats[SEASON_ID].appearances++
  }
  for (const e of aggEvents) {
    players[e.playerId].stats.goals++
    players[e.playerId].seasonStats[SEASON_ID].goals++
    if (e.assistPlayerId) {
      players[e.assistPlayerId].stats.assists++
      players[e.assistPlayerId].seasonStats[SEASON_ID].assists++
    }
  }
}

const seed = {
  seasons: {
    [SEASON_ID]: { name: '2025-2026 시즌', startDate: ms('2025-10-01'), endDate: ms('2026-12-31'), active: true }
  },
  players,
  matches
}

const json = JSON.stringify(seed, null, 2)
writeFileSync('/home/user/git/dokkaebi-fc/dokkaebi-seed.json', json)
writeFileSync('/home/user/git/dokkaebi-fc/src/data/seed.json', json)

const top = Object.values(players).filter((p) => p.stats.goals + p.stats.assists > 0)
  .sort((a, b) => b.stats.goals - a.stats.goals)
  .map((p) => `${p.name}: ${p.stats.goals}G ${p.stats.assists}A (${p.stats.appearances}경기)`)
console.log('선수', Object.keys(players).length, '/ 경기', Object.keys(matches).length,
  '(finished', Object.values(matches).filter((m) => m.status === 'finished').length, ')')
console.log('득점 기여:\n  ' + top.join('\n  '))
