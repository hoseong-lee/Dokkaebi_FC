// 자동 라인업 추천
// 입력: 참석 가능 선수 목록(RSVP=yes), 모든 매치(단짝 점수 계산용), 옵션(포메이션 후보)
// 출력: 4쿼터 lineup + 추천 포메이션
//
// 점수 모델:
// - 같은 카테고리(GK/DF/MF/FW) 매치: +100
// - 정확히 같은 detailed 포지션(예: CB↔CB): +50
// - 단짝(이전 경기 같이 뛴 횟수): +5 per 1회
// - 같은 슬롯에 같은 선수 4쿼터 연속 배정 패널티: -30 (로테이션 유도)
// - 정식 멤버 우선: +10 (용병보다 약간 가산)

import { getSlots, FORMATION_NAMES } from './formations'
import { categoryOf, POSITION_CATEGORY } from './positions'
import { personalPartners } from './duos'
import { recommendPositions } from './skillMap'

const POPULAR_FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '4-3-2-1']

function slotCategory(role) {
  return role  // GK/DF/MF/FW (formations.js 의 slot.role 과 일치)
}

// 한 선수의 한 슬롯 매칭 점수
function scorePlayerForSlot(player, slot, ctx) {
  let score = 0
  const cat = categoryOf(player.mainPosition) || categoryOf(player.subPosition)
  if (cat && cat === slotCategory(slot.role)) score += 100
  if (player.mainPosition === slot.id || POSITION_CATEGORY[player.mainPosition] === slot.role) score += 50
  if (player.isRegular) score += 10

  // 스킬 평판 기반 슬롯 적합도 가산 — recommendPositions 의 percent 값 활용
  const skillTags = player.stats?.skillTags
  if (skillTags && Object.values(skillTags).some((v) => v > 0)) {
    const recs = recommendPositions(skillTags, 5)
    // 슬롯의 role(GK/DF/MF/FW) 또는 detailed code 매칭하는 추천 → 가산
    for (const rec of recs) {
      const recCat = POSITION_CATEGORY[rec.code]
      if (recCat === slot.role) {
        // 카테고리 매치: percent 의 절반 가산 (최대 +50)
        score += Math.round(rec.percent * 0.5)
        break
      }
    }
  }
  return score
}

// 한 쿼터 라인업 결정 (그리디)
function pickQuarter(slots, available, ctx, prevLineups) {
  const usedThisQ = new Set()
  const assignment = {}  // slot.id → playerId
  const lineup = []

  // 슬롯을 GK 부터 우선 처리 (전문성 ↑)
  const sorted = [...slots].sort((a, b) => {
    if (a.role === 'GK') return -1
    if (b.role === 'GK') return 1
    return 0
  })

  for (const slot of sorted) {
    let best = null
    let bestScore = -Infinity
    for (const p of available) {
      if (usedThisQ.has(p.id)) continue

      let s = scorePlayerForSlot(p, slot, ctx)

      // 같은 슬롯에 직전 쿼터와 같은 선수면 패널티 (로테이션 유도)
      if (prevLineups.length && prevLineups[prevLineups.length - 1]?.[slot.id] === p.id) s -= 30

      // 4쿼터 모두 출전한 선수면 점수 깎기 (다른 사람 기회)
      const cnt = prevLineups.filter((pl) => pl?.[slot.id] === p.id || Object.values(pl || {}).includes(p.id)).length
      s -= cnt * 8

      // 단짝 보너스: 이미 배정된 다른 선수들과 단짝이면 +
      for (const otherPid of Object.values(assignment)) {
        const partners = ctx.partnersOf[p.id] || {}
        s += (partners[otherPid] || 0) * 5
      }

      if (s > bestScore) {
        bestScore = s
        best = p
      }
    }
    if (best) {
      assignment[slot.id] = best.id
      lineup.push(best.id)
      usedThisQ.add(best.id)
    }
  }
  return { lineup, positions: Object.fromEntries(Object.entries(assignment).map(([slotId, pid]) => [pid, { slotId }])) }
}

// 메인: 4쿼터 자동 추천
export function generateAutoLineup({ availablePlayers, allMatches, formation = '4-3-3', quarters = 4 }) {
  const slots = getSlots(formation)
  if (!slots.length) return null

  // 단짝 점수 사전 계산 (각 선수마다 partnersOf[pid] = {otherPid: count})
  const partnersOf = {}
  for (const p of availablePlayers) {
    const list = personalPartners(p.id, allMatches).slice(0, 10)
    partnersOf[p.id] = Object.fromEntries(list.map((x) => [x.partnerId, x.count]))
  }

  const ctx = { partnersOf }
  const prevLineups = []  // 쿼터별 positions {slotId: pid}

  const result = []
  for (let q = 0; q < quarters; q++) {
    const { lineup, positions } = pickQuarter(slots, availablePlayers, ctx, prevLineups)
    result.push({ lineup, positions, formation })
    prevLineups.push(positions)
  }
  return result
}

// 추천 포메이션 — 참석 인원에 따라 가장 적합한 것 1개
export function recommendFormation(playerCount) {
  if (playerCount >= 11) return '4-3-3'
  if (playerCount >= 10) return '4-4-2'
  if (playerCount >= 9) return '4-3-2-1'
  return '4-3-3'  // 인원 부족해도 일단 시도
}

export { POPULAR_FORMATIONS }
