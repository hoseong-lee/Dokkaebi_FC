import { writeFileSync } from 'node:fs'

const SEASON_ID = 's2526'
const ms = (s) => new Date(s).getTime()

// ── 선수 명단 (카카오톡 초대명단 + 경기 등장 인물) ──
// active:false = 팀톡 생성 직후(2025-10-12) 내보내진 인원
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
    name,
    number: i + 1,
    position: 'MF',
    preferredFoot: 'R',
    active,
    joinedAt: ms('2025-10-11'),
    stats: { appearances: 0, goals: 0, assists: 0, momCount: 0 },
    seasonStats: { [SEASON_ID]: { appearances: 0, goals: 0, assists: 0, momCount: 0 } }
  }
})

// 채팅 닉네임 → 정식 이름
const nick = {
  희창: '유희창', 한주: '박한주', 세욱: '김세욱', 동민: '김동민',
  순인: '정순인', 진오: '김진오', 영우: '김영우', 순찬: '권순찬',
  상섭: '강상섭', 성현: '홍성현', 범관: '윤범관'
}
const pid = (n) => keyByName[nick[n] || n]

// goal 이벤트 헬퍼: g('순인','희창') = 순인 골 + 희창 어시
const g = (scorer, assist = null) => ({
  minute: 0,
  type: 'goal',
  playerId: pid(scorer),
  assistPlayerId: assist ? pid(assist) : null
})

// ── 경기 (카카오톡 결과글에서 추출) ──
const matchDefs = [
  {
    id: 'm01', date: '2025-11-01T09:00:00', opponent: '삼미FC', location: '창골축구장',
    type: 'league', status: 'finished', score: { dokkaebi: 1, opponent: 5 },
    lineupNames: ['김세욱', '권순찬', '유희창', '마진섭', '김진오', '강상섭', '윤범관', '신승민', '박준희', '김청수'],
    events: [g('진오')]
  },
  {
    id: 'm02', date: '2025-11-29T20:00:00', opponent: '국대FC', location: '수락스포츠타운',
    type: 'league', status: 'finished', score: { dokkaebi: 15, opponent: 4 },
    events: [g('진오'), g('영우'), g('순인'), g('순인'), g('순찬'), g('희창'), g('상섭'), g('상섭'), g('성현')]
  },
  {
    id: 'm03', date: '2026-01-17T18:00:00', opponent: '국대FC', location: '불암산스타디움',
    type: 'league', status: 'finished', score: { dokkaebi: 8, opponent: 1 },
    events: []
  },
  {
    id: 'm04', date: '2026-04-18T18:00:00', opponent: '국대FC', location: '초안산',
    type: 'league', status: 'finished', score: { dokkaebi: 9, opponent: 3 },
    formation: '4-3-3',
    events: [g('희창'), g('한주'), g('세욱'), g('희창'), g('희창'), g('동민'), g('한주'), g('희창'), g('동민')]
  },
  {
    id: 'm05', date: '2026-04-25T18:00:00', opponent: '원스FC', location: '수락산',
    type: 'league', status: 'finished', score: { dokkaebi: 3, opponent: 12 },
    events: [g('순인', '희창'), g('희창', '순인'), g('희창')]
  },
  {
    id: 'm06', date: '2026-05-16T19:00:00', opponent: '국대FC', location: '다락원체육공원축구장',
    type: 'league', status: 'finished', score: { dokkaebi: 5, opponent: 8 },
    events: [g('동민'), g('세욱'), g('세욱'), g('희창'), g('순인')]
  },
  {
    id: 'm07', date: '2026-05-23T10:00:00', opponent: '덕선FC', location: '불암산',
    type: 'league', status: 'scheduled', score: { dokkaebi: null, opponent: null }, events: []
  }
]

const matches = {}
for (const m of matchDefs) {
  // lineup = 명시 라인업 || 이벤트 참여자
  let lineup = []
  if (m.lineupNames) lineup = m.lineupNames.map((n) => keyByName[n]).filter(Boolean)
  else {
    const set = new Set()
    for (const e of m.events) {
      set.add(e.playerId)
      if (e.assistPlayerId) set.add(e.assistPlayerId)
    }
    lineup = [...set]
  }

  matches[m.id] = {
    seasonId: SEASON_ID,
    opponent: m.opponent,
    date: ms(m.date),
    location: m.location,
    locationUrl: '',
    type: m.type,
    status: m.status,
    score: m.score,
    lineup,
    events: m.events,
    momPlayerId: null,
    formation: m.formation || null,
    positions: {},
    notes: '카카오톡 채팅 기록 기반 자동 등록',
    createdBy: 'system',
    createdAt: ms(m.date),
    updatedAt: ms(m.date)
  }

  // 통계 집계 (finished 만)
  if (m.status !== 'finished') continue
  for (const k of lineup) {
    players[k].stats.appearances++
    players[k].seasonStats[SEASON_ID].appearances++
  }
  for (const e of m.events) {
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
    [SEASON_ID]: {
      name: '2025-2026 시즌',
      startDate: ms('2025-10-01'),
      endDate: ms('2026-12-31'),
      active: true
    }
  },
  players,
  matches
}

writeFileSync('/home/user/git/dokkaebi-fc/dokkaebi-seed.json', JSON.stringify(seed, null, 2))

// 요약 출력
const top = Object.values(players)
  .filter((p) => p.stats.goals + p.stats.assists > 0)
  .sort((a, b) => b.stats.goals - a.stats.goals)
  .map((p) => `${p.name}: ${p.stats.goals}G ${p.stats.assists}A (${p.stats.appearances}경기)`)
console.log('선수', Object.keys(players).length, '명 / 경기', Object.keys(matches).length, '건')
console.log('득점 기여:\n  ' + top.join('\n  '))
