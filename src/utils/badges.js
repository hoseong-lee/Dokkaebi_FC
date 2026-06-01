import { dayjs } from './date'

// 한 경기에서 player 가 넣은 골 수
function goalsInMatch(match, playerId) {
  let n = 0
  for (const e of match.events || []) {
    if (e.type === 'goal' && e.playerId === playerId) n++
  }
  return n
}

// 시즌별 1위 후보 (key 별로 최댓값 + 동률 모두)
function topInSeason(players, seasonId, metric) {
  let max = 0
  for (const p of players) {
    const s = p.seasonStats?.[seasonId] || {}
    const v = metric === 'points'
      ? (s.goals || 0) + (s.assists || 0)
      : s[metric] || 0
    if (v > max) max = v
  }
  if (max <= 0) return new Set()
  const winners = new Set()
  for (const p of players) {
    const s = p.seasonStats?.[seasonId] || {}
    const v = metric === 'points'
      ? (s.goals || 0) + (s.assists || 0)
      : s[metric] || 0
    if (v === max) winners.add(p.id)
  }
  return winners
}

// 전체 선수 대상 시즌 시상 캐시 (성능)
function buildSeasonAwards(players, seasons) {
  const map = {} // seasonId → { mvp:Set, scorer:Set, assister:Set, attendance:Set }
  for (const s of seasons) {
    map[s.id] = {
      mvp: topInSeason(players, s.id, 'momCount'),
      scorer: topInSeason(players, s.id, 'goals'),
      assister: topInSeason(players, s.id, 'assists'),
      attendance: topInSeason(players, s.id, 'appearances')
    }
  }
  return map
}

// player 한 명의 뱃지 목록
export function computePlayerBadges(player, matches, players, seasons) {
  const badges = []
  const stats = player.stats || {}

  // 첫 골
  if ((stats.goals || 0) >= 1) badges.push({
    id: 'first-goal', icon: '⚽', label: '첫 골', desc: '데뷔 골 기록'
  })

  // 해트트릭 (한 경기 3골 이상)
  let hatCount = 0
  for (const m of matches) {
    if (m.status !== 'finished') continue
    if (goalsInMatch(m, player.id) >= 3) hatCount++
  }
  if (hatCount > 0) badges.push({
    id: 'hat-trick', icon: '🎩', label: `해트트릭 ×${hatCount}`,
    desc: '한 경기 3골 이상'
  })

  // 출석 마일스톤
  const apps = stats.appearances || 0
  for (const m of [50, 30, 20, 10, 5]) {
    if (apps >= m) {
      badges.push({
        id: `appearance-${m}`, icon: '🏃', label: `${m}경기 출전`,
        desc: `통산 ${m}경기 달성`
      })
      break
    }
  }

  // 골 마일스톤
  const goals = stats.goals || 0
  for (const m of [50, 30, 20, 10, 5]) {
    if (goals >= m) {
      badges.push({
        id: `goals-${m}`, icon: '🥅', label: `통산 ${m}골`,
        desc: `통산 ${m}골 돌파`
      })
      break
    }
  }

  // 어시스트 마일스톤
  const assists = stats.assists || 0
  if (assists >= 10) badges.push({
    id: 'assist-10', icon: '🎯', label: '도움 10개',
    desc: '통산 어시스트 10회'
  })
  else if (assists >= 5) badges.push({
    id: 'assist-5', icon: '🎯', label: '도움 5개',
    desc: '통산 어시스트 5회'
  })

  // MOM 마일스톤
  const moms = stats.momCount || 0
  if (moms >= 3) badges.push({
    id: 'mom-3', icon: '👑', label: `MOM ×${moms}`,
    desc: 'Man of the Match 3회 이상'
  })
  else if (moms >= 1) badges.push({
    id: 'mom-1', icon: '👑', label: 'MOM 수상',
    desc: 'Man of the Match 수상'
  })

  // 시즌 시상자 뱃지
  const awards = buildSeasonAwards(players, seasons)
  for (const s of seasons) {
    const a = awards[s.id]
    if (a.mvp.has(player.id)) badges.push({
      id: `season-mvp-${s.id}`, icon: '👑', label: `${s.name} MVP`,
      desc: `${s.name} 시즌 최다 MOM`
    })
    if (a.scorer.has(player.id)) badges.push({
      id: `season-scorer-${s.id}`, icon: '⚽', label: `${s.name} 득점왕`,
      desc: `${s.name} 시즌 득점 1위`
    })
    if (a.assister.has(player.id)) badges.push({
      id: `season-assister-${s.id}`, icon: '🎯', label: `${s.name} 도움왕`,
      desc: `${s.name} 시즌 어시스트 1위`
    })
    if (a.attendance.has(player.id)) badges.push({
      id: `season-attendance-${s.id}`, icon: '🏃', label: `${s.name} 출석왕`,
      desc: `${s.name} 시즌 출석 1위`
    })
  }

  // 고정멤버 뱃지
  if (player.isRegular) badges.push({
    id: 'regular', icon: '⭐', label: '고정멤버',
    desc: '정식 로스터'
  })

  // 매너 점수 마일스톤 (받은 칭찬 태그 총합)
  const compTotal = stats.complimentCount || 0
  if (compTotal >= 100) badges.push({
    id: 'manner-100', icon: '💝', label: '도깨비 매너왕',
    desc: '누적 매너 점수 100+ — 모두가 인정하는 동료'
  })
  else if (compTotal >= 30) badges.push({
    id: 'manner-30', icon: '💝', label: '매너 신사',
    desc: '누적 매너 점수 30+'
  })
  else if (compTotal >= 10) badges.push({
    id: 'manner-10', icon: '💝', label: '매너 새싹',
    desc: '누적 매너 점수 10+'
  })

  // 태그별 특화 뱃지 — 같은 태그 5회 이상 받음
  const tags = stats.complimentTags || {}
  const TAG_BADGES = {
    altruistic: { icon: '🤝', label: '이타파',     desc: '"이타적인 플레이를 해요" 5회+ 받음' },
    effort:     { icon: '🔥', label: '열정 그 자체', desc: '"열심히 해요" 5회+ 받음' },
    pass:       { icon: '⚽', label: '패스 마스터', desc: '"패스를 잘해요" 5회+ 받음' },
    dribble:    { icon: '🏃', label: '드리블러',   desc: '"드리블을 잘해요" 5회+ 받음' },
    stamina:    { icon: '💪', label: '체력왕',     desc: '"체력이 좋아요" 5회+ 받음' },
    defense:    { icon: '🛡', label: '철벽 수비',   desc: '"수비를 잘해요" 5회+ 받음' },
    vision:     { icon: '👁', label: '시야의 마법사', desc: '"시야가 좋아요" 5회+ 받음' },
    shot:       { icon: '🎯', label: '저격수',     desc: '"슛이 좋아요" 5회+ 받음' },
    leadership: { icon: '👑', label: '캡틴',       desc: '"리더십이 좋아요" 5회+ 받음' }
  }
  for (const [tag, meta] of Object.entries(TAG_BADGES)) {
    if ((tags[tag] || 0) >= 5) {
      badges.push({ id: `comp-tag-${tag}`, ...meta })
    }
  }

  return badges
}

// 뱃지 색 (icon background)
export const BADGE_TONE = {
  '⚽': 'bg-rose-50 text-rose-700 border-rose-200',
  '🎯': 'bg-sky-50 text-sky-700 border-sky-200',
  '👑': 'bg-amber-50 text-amber-700 border-amber-200',
  '🏃': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '🥅': 'bg-rose-50 text-rose-700 border-rose-200',
  '🎩': 'bg-purple-50 text-purple-700 border-purple-200',
  '⭐': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '💝': 'bg-pink-50 text-pink-700 border-pink-200',
  '🤝': 'bg-amber-50 text-amber-700 border-amber-200',
  '🔥': 'bg-rose-50 text-rose-700 border-rose-200',
  '💪': 'bg-violet-50 text-violet-700 border-violet-200',
  '🛡': 'bg-sky-50 text-sky-700 border-sky-200',
  '👁': 'bg-indigo-50 text-indigo-700 border-indigo-200'
}
