// 스킬 평판 데이터 → 포지션 적합도 + FIFA 능력치 6각형
// 받은 스킬 카운트로 자동 계산. 별도 입력 X.
import { SKILL_TAGS } from './skills'

// FIFA 6대 능력치 (PAC/SHO/PAS/DRI/DEF/PHY 표기)
// 각 능력치 = 관련 스킬 가중 합
export const ATTR_MAP = [
  {
    id: 'PAC', label: 'PACE',  ko: '스피드', icon: '💨',
    skills: { speed: 2, stamina: 1, reflexes: 1 }
  },
  {
    id: 'SHO', label: 'SHOOT', ko: '슈팅', icon: '⚽',
    skills: { shooting: 2, finishing: 2, set_piece: 1 }
  },
  {
    id: 'PAS', label: 'PASS',  ko: '패스', icon: '🎯',
    skills: { passing: 2, vision: 1.5, set_piece: 1 }
  },
  {
    id: 'DRI', label: 'DRIB',  ko: '드리블', icon: '🏃',
    skills: { dribbling: 2, two_foot: 1, speed: 1 }
  },
  {
    id: 'DEF', label: 'DEFEND', ko: '수비', icon: '🛡',
    skills: { defense: 2, aerial: 1, vision: 0.5, keeping: 2, commanding: 1 }
  },
  {
    id: 'PHY', label: 'PHYS',  ko: '체력', icon: '💪',
    skills: { stamina: 2, aerial: 1, teamwork: 1, commanding: 1 }
  }
]

// 받은 skillTags { tagId: count } → FIFA 6 attrs { PAC, SHO, ... }
//
// ⚽ 아마추어 클럽 기준 절대값 스케일 — 1 vote 받았다고 99 안 됨
// 공식: 50 + sqrt(raw) * 4, 상한 90
//
// 받은 raw 점수(가중치 곱해진 값) → 능력치 예시:
//   0   → 50 (신입 — vote 없음)
//   1   → 54
//   4   → 58
//   9   → 62 (시작 단계)
//   16  → 66
//   25  → 70 (아마추어 진입)
//   36  → 74
//   49  → 78
//   64  → 82 (세미프로 진입)
//   100 → 90 (상한 — 프로 레벨, 매우 드뭄)
//
// 등급 매핑 (gradeFromOvr) 과 맞물림:
//   90+ : 프로 레벨 SS (cap 근접 — 거의 안 나옴)
//   80+ : 세미프로 S
//   70+ : 아마추어 A
//   60+ : 평균 B
//   50+ : 신입 C
//
// '한 경기에 99' 같은 비현실적 점수 차단이 핵심.
const FIFA_CAP = 90
const FIFA_BASE = 50
const FIFA_MULTIPLIER = 4

export function computeFifaAttrs(skillTags = {}) {
  const raw = {}
  for (const attr of ATTR_MAP) {
    let score = 0
    for (const [tag, weight] of Object.entries(attr.skills)) {
      score += (skillTags[tag] || 0) * weight
    }
    raw[attr.id] = score
  }
  const totalRaw = Object.values(raw).reduce((s, v) => s + v, 0)
  if (totalRaw === 0) {
    // 데이터 없으면 모두 50 표시 (신입 베이스라인)
    return Object.fromEntries(ATTR_MAP.map((a) => [a.id, FIFA_BASE]))
  }
  const out = {}
  for (const attr of ATTR_MAP) {
    const score = raw[attr.id]
    const bonus = Math.round(Math.sqrt(score) * FIFA_MULTIPLIER)
    out[attr.id] = Math.min(FIFA_CAP, FIFA_BASE + bonus)
  }
  return out
}

// 받은 스킬 평판 → 추천 포지션 (적합도 점수 기반)
// PRIMARY skill → 포지션 매핑
const POSITION_FIT = [
  {
    code: 'ST', label: '스트라이커', category: 'FW',
    skills: { shooting: 3, finishing: 3, speed: 1.5, dribbling: 1, aerial: 1 }
  },
  {
    code: 'LW', label: '레프트 윙', category: 'FW',
    skills: { speed: 3, dribbling: 3, passing: 1, finishing: 1, two_foot: 1 }
  },
  {
    code: 'RW', label: '라이트 윙', category: 'FW',
    skills: { speed: 3, dribbling: 3, passing: 1, finishing: 1, two_foot: 1 }
  },
  {
    code: 'CAM', label: '공격형 미드', category: 'MF',
    skills: { vision: 3, passing: 3, dribbling: 2, finishing: 1, set_piece: 1 }
  },
  {
    code: 'CM', label: '중앙 미드', category: 'MF',
    skills: { passing: 3, vision: 2, stamina: 2, teamwork: 2, dribbling: 1 }
  },
  {
    code: 'CDM', label: '수비형 미드', category: 'MF',
    skills: { defense: 3, stamina: 2, passing: 2, teamwork: 2 }
  },
  {
    code: 'CB', label: '센터백', category: 'DF',
    skills: { defense: 3, aerial: 2.5, stamina: 1, teamwork: 1 }
  },
  {
    code: 'LB', label: '레프트백', category: 'DF',
    skills: { speed: 2, defense: 2, stamina: 2, passing: 1, two_foot: 1 }
  },
  {
    code: 'RB', label: '라이트백', category: 'DF',
    skills: { speed: 2, defense: 2, stamina: 2, passing: 1, two_foot: 1 }
  },
  {
    code: 'GK', label: '골키퍼', category: 'GK',
    skills: { keeping: 3, reflexes: 2.5, commanding: 2, aerial: 1.5, vision: 1 }
  }
]

// 받은 skillTags → [{ code, label, score, percent }] 적합도 정렬
export function recommendPositions(skillTags = {}, topN = 3) {
  const scored = POSITION_FIT.map((pos) => {
    let score = 0
    for (const [tag, weight] of Object.entries(pos.skills)) {
      score += (skillTags[tag] || 0) * weight
    }
    return { ...pos, score }
  })
  const max = Math.max(...scored.map((s) => s.score))
  if (max === 0) return []
  return scored
    .map((s) => ({ ...s, percent: Math.round((s.score / max) * 100) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

// 십의 자리별 능력치 값 색상 — 레이더 차트 / FUT 카드 / canvas 공용
// 50대 검정 / 60대 파랑 / 70대 보라 / 80대 빨강 / 90대 노랑
export function statDecadeColor(v) {
  if (v >= 90) return '#facc15'
  if (v >= 80) return '#ef4444'
  if (v >= 70) return '#a855f7'
  if (v >= 60) return '#3b82f6'
  return '#18181b'
}
// 외곽선 — 컬러 값엔 검정, 검정(50대) 값엔 흰색 (배경 간섭 차단)
export function statDecadeStroke(v) {
  return v < 60 ? '#ffffff' : '#000000'
}

// 전체 능력치 평균 (FIFA OVR 점수)
export function overallRating(fifaAttrs = {}) {
  const values = Object.values(fifaAttrs)
  if (!values.length) return 50
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
}

// OVR → 카드 등급 (FIFA 스타일)
// 도깨비FC 기준 — 아마추어 클럽 분포:
//   SS (90+): 프로 레벨 (cap 근접, 거의 안 나옴)
//   S  (80+): 세미프로
//   A  (70+): 아마추어 — 잘함
//   B  (60+): 평균 아마추어
//   C  (50+): 신입 / vote 없음
export function gradeFromOvr(ovr) {
  if (ovr >= 90) return { label: 'SS', tone: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white', emoji: '🌟' }
  if (ovr >= 80) return { label: 'S',  tone: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white',   emoji: '🏆' }
  if (ovr >= 70) return { label: 'A',  tone: 'bg-gradient-to-br from-violet-500 to-violet-700 text-white', emoji: '⭐' }
  if (ovr >= 60) return { label: 'B',  tone: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white', emoji: '🔹' }
  return { label: 'C', tone: 'bg-gradient-to-br from-gray-400 to-gray-600 text-white', emoji: '·' }
}
