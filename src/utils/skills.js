// 스킬 Endorsement 태그 — 다른 선수가 "이 선수는 ◯◯ 잘한다" 1탭으로 인정
// 매너 칭찬(compliments)은 "그 경기에서 인상 깊었다"인 반면,
// 스킬 endorsement 는 "이 선수는 평소에 잘한다"는 누적된 평판.

export const SKILL_TAGS = [
  { id: 'shooting',  label: '슈팅',        icon: '⚽', tone: 'bg-rose-50 text-rose-800 ring-rose-300'           },
  { id: 'passing',   label: '패스',        icon: '🎯', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-300'  },
  { id: 'dribbling', label: '드리블',      icon: '🏃', tone: 'bg-blue-50 text-blue-800 ring-blue-300'           },
  { id: 'speed',     label: '스피드',      icon: '💨', tone: 'bg-cyan-50 text-cyan-800 ring-cyan-300'           },
  { id: 'defense',   label: '수비',        icon: '🛡', tone: 'bg-sky-50 text-sky-800 ring-sky-300'              },
  { id: 'stamina',   label: '체력',        icon: '💪', tone: 'bg-violet-50 text-violet-800 ring-violet-300'     },
  { id: 'vision',    label: '시야',        icon: '👁', tone: 'bg-indigo-50 text-indigo-800 ring-indigo-300'     },
  { id: 'finishing', label: '결정력',      icon: '🔥', tone: 'bg-orange-50 text-orange-800 ring-orange-300'     },
  { id: 'teamwork',  label: '팀플레이',    icon: '🤝', tone: 'bg-amber-50 text-amber-800 ring-amber-300'        },
  { id: 'two_foot',  label: '양발 사용',   icon: '🦶', tone: 'bg-lime-50 text-lime-800 ring-lime-300'           },
  { id: 'set_piece', label: '세트피스',    icon: '🎯', tone: 'bg-purple-50 text-purple-800 ring-purple-300'     },
  { id: 'aerial',    label: '공중볼',      icon: '⬆', tone: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-300'   }
]

export const SKILL_TAG_MAP = Object.fromEntries(SKILL_TAGS.map((t) => [t.id, t]))
export const SKILL_TAG_IDS = SKILL_TAGS.map((t) => t.id)

// endorsements = { voterUid: [tagId, ...] }
// 한 선수가 받은 endorsements 객체를 → { tagId: voterCount } 로 집계
export function tallyEndorsements(endorsements = {}) {
  const map = {}
  for (const tags of Object.values(endorsements)) {
    if (!Array.isArray(tags)) continue
    for (const t of tags) {
      if (!SKILL_TAG_MAP[t]) continue
      map[t] = (map[t] || 0) + 1
    }
  }
  return map
}

// 받은 endorsements → 상위 N개 스킬 ({ tagId, count, ...meta })
export function topSkills(endorsements = {}, n = 3) {
  const tally = tallyEndorsements(endorsements)
  return Object.entries(tally)
    .map(([id, count]) => ({ ...SKILL_TAG_MAP[id], id, count }))
    .filter((s) => s.label)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

// 총 endorsement 받은 수 (voter 수 X 태그 수)
export function endorsementTotal(endorsements = {}) {
  let total = 0
  for (const tags of Object.values(endorsements)) {
    if (Array.isArray(tags)) total += tags.length
  }
  return total
}

// 마스터 칭호: 같은 스킬 N명 이상 인정 받았으면 "◯◯ 마스터"
export const MASTER_THRESHOLD = 5

export function masterTags(endorsements = {}) {
  const tally = tallyEndorsements(endorsements)
  return Object.entries(tally)
    .filter(([, c]) => c >= MASTER_THRESHOLD)
    .map(([id]) => SKILL_TAG_MAP[id])
    .filter(Boolean)
}
