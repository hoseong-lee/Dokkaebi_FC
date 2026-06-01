// 칭찬 태그 카탈로그. id 는 RTDB 에 저장되는 키 — 변경 시 마이그레이션 필요.
export const COMPLIMENT_TAGS = [
  { id: 'altruistic', label: '이타적인 플레이를 해요', icon: '🤝', tone: 'bg-amber-50 text-amber-800 ring-amber-300'      },
  { id: 'effort',     label: '열심히 해요',            icon: '🔥', tone: 'bg-rose-50 text-rose-800 ring-rose-300'          },
  { id: 'pass',       label: '패스를 잘해요',          icon: '⚽', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-300' },
  { id: 'dribble',    label: '드리블을 잘해요',        icon: '🏃', tone: 'bg-blue-50 text-blue-800 ring-blue-300'          },
  { id: 'stamina',    label: '체력이 좋아요',          icon: '💪', tone: 'bg-violet-50 text-violet-800 ring-violet-300'    },
  { id: 'defense',    label: '수비를 잘해요',          icon: '🛡', tone: 'bg-sky-50 text-sky-800 ring-sky-300'              },
  { id: 'vision',     label: '시야가 좋아요',          icon: '👁', tone: 'bg-indigo-50 text-indigo-800 ring-indigo-300'     },
  { id: 'shot',       label: '슛이 좋아요',            icon: '🎯', tone: 'bg-orange-50 text-orange-800 ring-orange-300'     },
  { id: 'leadership', label: '리더십이 좋아요',        icon: '👑', tone: 'bg-yellow-50 text-yellow-800 ring-yellow-300'     }
]

export const COMPLIMENT_TAG_MAP = Object.fromEntries(COMPLIMENT_TAGS.map((t) => [t.id, t]))
export const COMPLIMENT_TAG_IDS = COMPLIMENT_TAGS.map((t) => t.id)

// 한 명 당 칭찬 가능한 최대 인원 (선수당 태그 수에는 제한 없음)
export const COMPLIMENT_MAX_PLAYERS = 3

// match.compliments → { playerId: 받은_태그_총합 } (매너 점수 누적용)
// 데이터: { voterUid: { playerId: [tag1, tag2, ...] } }
export function tallyComplimentTotals(compliments = {}) {
  const map = {}
  for (const perVoter of Object.values(compliments)) {
    if (!perVoter || typeof perVoter !== 'object') continue
    for (const [pid, tags] of Object.entries(perVoter)) {
      if (!Array.isArray(tags) || !tags.length) continue
      map[pid] = (map[pid] || 0) + tags.length
    }
  }
  return map
}

// match.compliments → { playerId: { tag: count } } (태그별 분포)
export function tallyComplimentTags(compliments = {}) {
  const map = {}
  for (const perVoter of Object.values(compliments)) {
    if (!perVoter || typeof perVoter !== 'object') continue
    for (const [pid, tags] of Object.entries(perVoter)) {
      if (!Array.isArray(tags)) continue
      if (!map[pid]) map[pid] = {}
      for (const t of tags) {
        if (!COMPLIMENT_TAG_MAP[t]) continue
        map[pid][t] = (map[pid][t] || 0) + 1
      }
    }
  }
  return map
}
