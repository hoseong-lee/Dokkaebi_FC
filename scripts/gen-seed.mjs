// 도깨비FC_경기기록.md + 포지션명단.png 기반 시드 생성기.
// 출력: dokkaebi-seed.json (CLI 가져오기용) + src/data/seed.json (앱 번들).
import { writeFileSync } from 'node:fs'

const SEASON_ID = 's2526'
const ms = (s) => new Date(s).getTime()

// ── 1) 정식 로스터 (포지션명단.png · isRegular: true) ──
const ROSTER = [
  ['신승민', 2, 'RB', 'LB', '신승민'],
  ['박재익', 3, 'ST', 'CB', '박재익'],
  ['홍성현', 4, 'LB', 'CB', '홍성현'],
  ['김주현', 5, 'LB', null, '김주현'],
  ['김산이', 6, 'ST', 'CAM', '김산이'],
  ['김세욱', 7, 'CB', 'LW', '엔젤스헤이븐'],
  ['권순찬', 8, 'CAM', 'CDM', '권순찬'],
  ['김진오', 9, 'ST', 'LB', '김진오'],
  ['박한주', 10, 'CDM', 'RW', '박한주'],
  ['유희창', 11, 'CB', 'ST', '유희창'],
  ['문종일', 12, 'LW', 'RW', '문종일'],
  ['김영우', 14, 'LW', 'CAM', '김영우'],
  ['임상범', 15, 'GK', null, 'S.B'],
  ['김청수', 17, 'CDM', 'CAM', '김청수'],
  ['김성민', 19, 'RB', 'CB', '김성민'],
  ['윤범관', 21, 'CB', 'LW', '윤범관'],
  ['한지민', 26, 'CB', null, '한지민'],
  ['이호성', 28, 'RB', 'LB', '이호성'],
  ['마진섭', 29, 'CDM', 'RB', '마진섭'],
  ['채재현', 52, 'GK', 'LB', '채재현'],
  ['정순인', 77, 'RW', 'LW', '정순인'],
  ['강상섭', 99, 'LB', 'RB', '강상섭']
]

const CATEGORY = {
  GK: 'GK',
  CB: 'DF', LB: 'DF', RB: 'DF',
  CDM: 'MF', CM: 'MF', CAM: 'MF', LM: 'MF', RM: 'MF',
  LW: 'FW', RW: 'FW', ST: 'FW'
}

const players = {}
const keyByName = {}
let nextId = 1
function addPlayer({ name, isRegular = false, number = null, mainPosition = null, subPosition = null, mark = null }) {
  if (keyByName[name]) return keyByName[name]
  const key = 'p' + String(nextId++).padStart(2, '0')
  keyByName[name] = key
  players[key] = {
    name,
    number,
    mark: mark || name,
    mainPosition,
    subPosition,
    position: mainPosition ? CATEGORY[mainPosition] || 'MF' : 'MF',
    preferredFoot: 'R',
    isRegular,
    active: true,
    joinedAt: ms('2025-01-01'),
    stats: { appearances: 0, goals: 0, assists: 0, momCount: 0 },
    seasonStats: { [SEASON_ID]: { appearances: 0, goals: 0, assists: 0, momCount: 0 } }
  }
  return key
}

ROSTER.forEach(([name, num, main, sub, mark]) =>
  addPlayer({ name, isRegular: true, number: num, mainPosition: main, subPosition: sub, mark })
)

// ── 2) 닉네임/별명 → 정식 이름 ──
const NICK = {
  희창: '유희창', 한주: '박한주', 세욱: '김세욱', 동민: '김동민',
  순인: '정순인', 진오: '김진오', 영우: '김영우', 순찬: '권순찬',
  상섭: '강상섭', 성현: '홍성현', 범관: '윤범관', 청수: '김청수',
  산이: '김산이', 우재: '김우재', 동희: '김동희', 정윤: '이정윤',
  다원: '김다원', 종일: '문종일', 한지민: '한지민', 강성섭: '강상섭'
}
const resolveName = (n) => NICK[n] || n
const playerKey = (name) => keyByName[resolveName(name)] || addPlayer({ name: resolveName(name) })

// ── 3) 경기 데이터 ──
// q(상대득점, [[득점자, 어시?], ...]) — 득점자 미상이면 빈 배열
const q = (opp, goals = []) => ({ opp, goals })
// 출석 문자열 → 이름 배열 (공백/슬래시 구분, 괄호 부가설명 제거)
const att = (s) =>
  s
    .replace(/\([^)]*\)/g, ' ')
    .split(/[\s/,]+/)
    .map((t) => t.trim())
    .filter(Boolean)

const MATCHES = [
  { id: 'm01', date: '2025-01-25T16:00', opp: '국대FC', loc: '초안산축구장',
    att: att('마진섭 윤범관 박재익 김세욱 김진오 홍성현 문종일 한지민 권용재 권순찬 이충환 박한주 안현수'),
    quarters: [q(0, [['세욱', '범관']]), q(0, [['세욱', '한지민'], ['순찬']]), q(0, [['세욱'], ['권용재', '세욱']]), q(3)] },
  { id: 'm02', date: '2025-02-01T16:00', opp: '로랜드FC', loc: '마들스타디움',
    att: att('임상범 김우재 마진섭 박재익 김진오 윤범관 문종일 강상섭 정병진 김청수 신승민 박한주'),
    quarters: [q(0), q(0), q(1), q(3)] },
  { id: 'm03', date: '2025-02-08T16:00', opp: '국대FC', loc: '초안산',
    att: att('김진오 박재익 마진섭 박한주 윤범관 강상섭 김성민 김태원 김산이 김우재 문종일 한지민 홍성현'),
    quarters: [q(1, [['상섭']]), q(0), q(2), q(3, [['박재익', '한주']])] },
  { id: 'm04', date: '2025-02-15T12:00', opp: '권용재팀', loc: '미상', type: 'friendly',
    att: att('김세욱 신승민 강상섭 김진오 윤범관 정도현 조하영 도현친구'),
    quarters: [q(1), q(3), q(1), q(2), q(1), q(0)] },
  { id: 'm05', date: '2025-02-22T16:00', opp: '국대FC', loc: '불암산',
    att: att('김산이 마진섭 윤범관 강상섭 박재익 이호성 한지민 문종일 신승민 홍성현 박한주 이정윤 이종주'),
    quarters: [
      q(0, [['한주', '신승민'], ['상섭', '마진섭']]),
      q(0, [['산이'], ['산이', '신승민']]),
      q(0),
      q(3, [['한주', '이정윤'], ['상섭', '이종주']])
    ] },
  { id: 'm06', date: '2025-03-01T16:00', opp: '국대FC', loc: '불암산',
    att: att('마진섭 유희창 강상섭 임상범 이충환 김세욱 박한주 박재익 김진오 김청수 문종일 신승민 김영우 김성민'),
    quarters: [q(3, [['영우'], ['영우']]), q(1, [['영우'], ['영우']]), q(0, [['세욱']]), q(2, [['진오'], ['박재익']])] },
  { id: 'm07', date: '2025-03-15T16:00', opp: '국대FC', loc: '초안산',
    att: att('마진섭 강상섭 김세욱 박한주 김지웅 김진오 신승민 문종일 한지민 김청수 박재익 김성민 한친윙'),
    quarters: [q(1, [['세욱'], ['세욱']]), q(2), q(1), q(3, [['청수']])] },
  { id: 'm08', date: '2025-03-23T16:00', opp: 'EXFC', loc: '초안산',
    att: att('마진섭 강상섭 김진오 문종일 신승민 윤범관 이호성 한지민 홍성현 이정윤 김성민 박재익 김영우 김태원'),
    quarters: [q(2), q(1, [['신승민']]), q(0, [['범관'], ['범관']]), q(1)] },
  { id: 'm09', date: '2025-03-29T16:00', opp: '국대FC', loc: '초안산',
    att: att('강상섭 유희창 마진섭 박한주 김진오 박재익 김청수 문종일 한지민 권순찬 한주친구 진오친구 진오친구2'),
    quarters: [q(2), q(4), q(0, [['한주친구']]), q(2)] },
  { id: 'm10', date: '2025-04-19T19:00', opp: '클릭FC', loc: '다락원',
    att: att('마진섭 박한주 유희창 김성민 김진오 윤범관 김청수 홍성현 채재현 김주성 김동민 김영우 문종일'),
    quarters: [q(2), q(2, [['영우', '청수'], ['영우', '동민']]), q(3), q(4)] },
  { id: 'm11', date: '2025-04-26T16:00', opp: '국대FC', loc: '초안산',
    att: att('마진섭 강상섭 김세욱 김우재 박한주 유희창 김청수 한지민 유영진 김주성 권용재 김진오 윤범관 채재현'),
    quarters: [q(4), q(1), q(0, [['세욱']]), q(3)] },
  { id: 'm12', date: '2025-05-03T12:00', opp: '국대FC', loc: '불암산',
    att: att('김세욱 강상섭 김청수 박한주 홍성현 정도현 유희창 김동희 김주성 권순찬 윤범관 김진오 박준희 임상범 고경철'),
    quarters: [q(3), q(1, [['동희'], ['동희']]), q(0, [['청수', '희창'], ['청수', '한주']]), q(1, [['한주'], ['세욱']])] },
  { id: 'm14', date: '2025-05-24T16:00', opp: '국대FC', loc: '초안산',
    att: att('이승엽 마진섭 강상섭 박한주 김세욱 김주성 홍성현 김진오 임상범 문종일 박재익 김광현 김우재 김동민'),
    quarters: [q(1), q(1, [['동민']]), q(3), q(2)] },
  { id: 'm15', date: '2025-06-07T17:00', opp: '박한주와친구들', loc: '창골풋살장', type: 'friendly',
    att: att('강상섭 마진섭 김세욱 김지웅 이수아 문종일 홍성현'),
    quarters: [q(1, [['종일'], ['성현'], ['세욱'], ['세욱']]), q(3), q(3, [['마진섭']]), q(0, [['마진섭']]), q(2, [['세욱'], ['이수아']]), q(2, [['이수아']])] },
  { id: 'm16', date: '2025-06-28T16:00', opp: '국대FC', loc: '초안산',
    att: att('강상섭 마진섭 이호성 윤범관 김성민 한지민 김청수 문종일 유희창 채재현 김우재 김광현 이종주'),
    quarters: [q(2, [['범관']]), q(1, [['우재', '이호성']]), q(3), q(2, [['종일'], ['종일']])] },
  { id: 'm17', date: '2025-09-06T16:00', opp: '국대FC', loc: '불암산',
    att: att('마진섭 김세욱 유영진 문종일 한지민 강상섭 신승민 유희창 채재현 정순인 김주성 윤범관 남승재'),
    quarters: [q(0, [['마진섭', '세욱'], ['세욱', '이호성']]), q(1, [['세욱']]), q(3), q(3, [['유영진', '범관']])] },
  { id: 'm19', date: '2025-10-04T16:00', opp: '국대FC', loc: '수락산',
    att: att('마진섭 김세욱 박한주 유영진 임상범 신승민 유희창 강상섭 이호성 문종일 정순인 김주현'),
    quarters: [q(0, [['이호성'], ['세욱'], ['세욱'], ['세욱'], ['세욱']]), q(1), q(0), q(1, [['진오']])] },
  { id: 'm20', date: '2025-11-01T09:00', opp: '삼미FC', loc: '창골운동장',
    att: att('김세욱 권순찬 유희창 마진섭 김진오 강상섭 윤범관 신승민 박준희 김청수 이승욱 오동석 오동석2 키퍼용병'),
    quarters: [q(2), q(1), q(1), q(1, [['진오']])] },
  { id: 'm21', date: '2025-11-08T10:00', opp: '삼미FC', loc: '마들스타디움',
    att: att('권순찬 유희창 마진섭 김진오 박한주 채재현 윤범관 김지웅 김성민 정순인 홍성현 강상섭 이근우 송영희 장현민 강현구'),
    quarters: [q(1), q(0), q(1), q(3)] },
  { id: 'm22', date: '2025-11-15T18:00', opp: '국대FC', loc: '불암산스타디움',
    att: att('마진섭 강상섭 김세욱 유희창 윤범관 김진오 문종일 박한주 정순인 한주승 유영진 김주성 김동민 송승우'),
    quarters: [q(0, [['종일', '범관']]), q(3), q(1, [['진오']]), q(2, [['진오']])] },
  { id: 'm23', date: '2025-11-29T20:00', opp: '국대FC', loc: '수락스포츠타운', mvp: '김영우',
    att: att('마진섭 강상섭 김세욱 유희창 윤범관 김진오 박한주 정순인 권순찬 홍성현 김영우 신승민 채재현'),
    quarters: [q(0, [['진오'], ['영우'], ['순인'], ['순인'], ['순찬']]), q(3, [['희창']]), q(2, [['상섭'], ['상섭'], ['성현']]), q(4)] },
  { id: 'm24', date: '2025-12-28T20:00', opp: 'EX FC', loc: '미상',
    att: att('김산이 강상섭 김우재 김진오 이정윤'),
    quarters: [q(2, [['산이'], ['산이']]), q(1), q(1, [['상섭']]), q(1, [['진오']])] },
  { id: 'm25', date: '2026-01-17T16:00', opp: '국대FC', loc: '불암산스타디움',
    att: att('윤범관 문종일 김진오 김다원'),
    quarters: [q(0, [['범관'], ['종일']]), q(0), q(0, [['다원'], ['다원'], ['다원'], ['다원'], ['진오'], ['진윤현']]), q(1)] },
  { id: 'm26', date: '2026-01-31T16:00', opp: '국대FC', loc: '불암산스타디움', scheduled: true,
    att: att('유희창 김진오 문종일 강상섭 윤범관 신승민 이호성 정병진 마진섭 채재현 한지민 이근우') },
  { id: 'm27', date: '2026-02-28T16:00', opp: 'RC FC', loc: '미상', mvp: '박한주',
    att: att('마진섭 윤범관 유희창 이호성 강상섭 문종일 권순찬 김진오 박한주 홍성현 박재익 준희형 종일용병 한주지인'),
    quarters: [q(1), q(0), q(0), q(2)] },
  { id: 'm28', date: '2026-03-14T10:00', opp: '덕선FC', loc: '불암산', scheduled: true,
    att: att('마진섭 윤범관 유희창 권순찬 강상섭 신승민 김진오 홍성현 도현이형 준희형 이제우 서건하 김가빈 임성훈') },
  { id: 'm29', date: '2026-03-29T09:00', opp: '한아름축구단', loc: '번동중학교',
    att: att('강상섭 권순찬 유희창 마진섭 홍성현 김성민 김영우 김진오 윤범관 문종일 한지민 김동민 신승민'),
    quarters: [q(4), q(2, [['동민']]), q(1, [['동민'], ['영우'], ['희창']]), q(0), q(0, [['영우'], ['영우']])] },
  { id: 'm30', date: '2026-04-04T09:00', opp: '삼미FC', loc: '창골운동장',
    att: att('마진섭 강상섭 이호성 김세욱 박한주 김진오 권순찬 신승민 김산이 채경훈 김가빈 이제우 정환교 안윤태 키퍼용병'),
    quarters: [q(0, [['산이']]), q(3), q(3), q(1, [['한주']])] },
  { id: 'm31', date: '2026-04-18T18:00', opp: 'FC국대', loc: '초안산',
    att: att('권순찬 유희창 박한주 윤범관 홍성현 신승민 김세욱 강상섭 김동민 김주성 이제우 김가빈 박준희'),
    quarters: [q(1, [['희창'], ['한주'], ['세욱']]), q(2, [['희창'], ['희창'], ['동민']]), q(0, [['범관']]), q(0, [['희창'], ['동민']])] },
  { id: 'm32', date: '2026-04-25T18:00', opp: '원스FC', loc: '수락산',
    att: att('유희창 정순인'),
    quarters: [q(2), q(6, [['순인', '희창'], ['희창', '순인']]), q(2), q(2, [['희창']])] },
  { id: 'm33', date: '2026-05-09T09:00', opp: 'FK리버스', loc: '창골축구장',
    att: att('유희창 강상섭 권순찬 박한주 홍성현 신승민 김진오 한지민 마진섭 문종일 천희 이제우 김가빈 채경훈'),
    quarters: [q(2)] },
  { id: 'm34', date: '2026-05-16T19:00', opp: '국대FC', loc: '다락원체육공원',
    att: att('유희창 김세욱 마진섭 강상섭 문종일 신승민 박한주 이호성 홍성현 정순인 김진오 이현진 김동민 윤범관'),
    quarters: [q(0, [['동민']]), q(2, [['세욱'], ['세욱']]), q(3, [['희창'], ['순인']]), q(3)] },
  { id: 'm35', date: '2026-05-23T10:00', opp: '덕선FC', loc: '불암산스포츠타운',
    att: att('유희창 권순찬 마진섭 박한주 신승민 윤범관 홍성현 김진오 채재현 강현구 박준희 강순범 김성묵 키퍼용병'),
    quarters: [q(1), q(1, [['한주'], ['강현구']]), q(0, [['강현구']]), q(1, [['강현구'], ['범관'], ['박준희']])] }
]

const matches = {}
for (const m of MATCHES) {
  // 출석 이름 → 선수 등록
  const lineupKeys = m.att.map((n) => playerKey(n))

  if (m.scheduled) {
    matches[m.id] = {
      seasonId: SEASON_ID, opponent: m.opp, date: ms(m.date), location: m.loc,
      locationUrl: '', type: m.type || 'league', status: 'scheduled',
      score: { dokkaebi: null, opponent: null },
      lineup: lineupKeys, events: [], quarters: [],
      momPlayerId: null, notes: '', createdBy: 'system',
      createdAt: ms(m.date), updatedAt: ms(m.date)
    }
    continue
  }

  const quarters = []
  const aggEvents = []
  let dok = 0, opp = 0
  m.quarters.forEach((qd, qi) => {
    const events = qd.goals.map(([scorer, assist]) => ({
      minute: 0, type: 'goal',
      playerId: playerKey(scorer),
      assistPlayerId: assist ? playerKey(assist) : null
    }))
    dok += events.length
    opp += qd.opp
    events.forEach((e) => aggEvents.push({ ...e, quarter: qi + 1 }))
    quarters.push({
      lineup: lineupKeys, events, opponentScore: qd.opp,
      score: { dokkaebi: events.length, opponent: qd.opp },
      formation: null, positions: {}
    })
  })

  const momPlayerId = m.mvp ? playerKey(m.mvp) : null

  matches[m.id] = {
    seasonId: SEASON_ID, opponent: m.opp, date: ms(m.date), location: m.loc,
    locationUrl: '', type: m.type || 'league', status: 'finished',
    score: { dokkaebi: dok, opponent: opp },
    lineup: lineupKeys, events: aggEvents, quarters,
    momPlayerId, notes: '카카오/인스타 기록 기반 자동 등록',
    createdBy: 'system', createdAt: ms(m.date), updatedAt: ms(m.date)
  }

  // 통계 집계
  for (const k of lineupKeys) {
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
  if (momPlayerId) {
    players[momPlayerId].stats.momCount++
    players[momPlayerId].seasonStats[SEASON_ID].momCount++
  }
}

const seed = {
  seasons: {
    [SEASON_ID]: { name: '2025-2026 시즌', startDate: ms('2025-01-01'), endDate: ms('2026-12-31'), active: true }
  },
  players,
  matches
}

const json = JSON.stringify(seed, null, 2)
writeFileSync('/home/user/git/dokkaebi-fc/dokkaebi-seed.json', json)
writeFileSync('/home/user/git/dokkaebi-fc/src/data/seed.json', json)

const finished = Object.values(matches).filter((m) => m.status === 'finished')
const top = Object.values(players).filter((p) => p.stats.goals + p.stats.assists > 0)
  .sort((a, b) => (b.stats.goals + b.stats.assists) - (a.stats.goals + a.stats.assists))
  .map((p) => `${p.name}${p.isRegular ? '★' : ' '}: ${p.stats.goals}G ${p.stats.assists}A ${p.stats.momCount}MOM (${p.stats.appearances}경기)`)
console.log(`선수 ${Object.keys(players).length} (정식 ${Object.values(players).filter(p=>p.isRegular).length}) / 경기 ${Object.keys(matches).length} (finished ${finished.length})`)
console.log('상위 기여:\n  ' + top.slice(0, 15).join('\n  '))
