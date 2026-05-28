import { FORMATION_NAMES, getSlots } from './formations'
import { categoryOf, laneOf } from './positions'

function playerCategory(p) {
  return categoryOf(p.mainPosition) || categoryOf(p.subPosition) || p.position || 'MF'
}

// 출전 명단 id 배열 → { formation, positions } 추천.
// 1) 카테고리(GK/DF/MF/FW) 분포에 가장 잘 맞는 프리셋 선택
// 2) 카테고리·가로(lane) 선호도로 슬롯에 매핑
export function suggestFormation(playerIds, allPlayers) {
  const players = playerIds
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean)
  if (players.length === 0) return { formation: '', positions: {} }

  // 카테고리 분류 (gk 우선 추출)
  const cats = { GK: [], DF: [], MF: [], FW: [] }
  for (const p of players) cats[playerCategory(p)]?.push(p)

  const gk = cats.GK[0] || null
  // 출전 가능 필드 플레이어 (최대 10명)
  const field = []
  for (const p of players) if (p !== gk) field.push(p)
  const outfield = field.slice(0, 10)

  // 필드 카테고리 카운트
  const fcat = { DF: [], MF: [], FW: [] }
  for (const p of outfield) {
    const c = playerCategory(p)
    if (c === 'GK') fcat.DF.push(p)
    else if (fcat[c]) fcat[c].push(p)
    else fcat.MF.push(p)
  }
  const counts = { DF: fcat.DF.length, MF: fcat.MF.length, FW: fcat.FW.length }

  // 후보 프리셋 중 분포 차이 최소
  let best = '4-3-3', bestDiff = Infinity
  for (const name of FORMATION_NAMES) {
    const slots = getSlots(name).filter((s) => s.role !== 'GK')
    const f = { DF: 0, MF: 0, FW: 0 }
    slots.forEach((s) => { f[s.role]++ })
    const diff =
      Math.abs(f.DF - counts.DF) +
      Math.abs(f.MF - counts.MF) +
      Math.abs(f.FW - counts.FW)
    if (diff < bestDiff) { bestDiff = diff; best = name }
  }

  // 슬롯 매핑
  const slots = getSlots(best)
  const positions = {}
  const used = new Set()
  const gkSlot = slots.find((s) => s.role === 'GK')
  if (gk && gkSlot) { positions[gkSlot.id] = gk.id; used.add(gk.id) }

  // 역할별 후보 풀(부족하면 인접 카테고리로 보충)
  const overflow = { DF: ['MF', 'FW'], MF: ['CAM', 'CDM', 'DF', 'FW'], FW: ['MF', 'DF'] }
  const lanesOf = (p) => laneOf(p.mainPosition || p.subPosition)

  for (const role of ['DF', 'MF', 'FW']) {
    const roleSlots = slots
      .filter((s) => s.role === role)
      .sort((a, b) => a.x - b.x)
    let pool = fcat[role].slice()
    // 부족하면 다른 카테고리에서 보충
    const need = roleSlots.length
    if (pool.length < need) {
      for (const oc of overflow[role]) {
        const extra = (fcat[oc] || []).filter((p) => !used.has(p.id) && !pool.includes(p))
        pool.push(...extra)
        if (pool.length >= need) break
      }
    }
    // 가로 선호도 + 사용 안 한 선수 우선
    pool = pool
      .filter((p) => !used.has(p.id))
      .sort((a, b) => lanesOf(a) - lanesOf(b))

    for (let i = 0; i < roleSlots.length; i++) {
      // 슬롯의 x로 lane 추정 (33/66 기준)
      const slotLane = roleSlots[i].x < 33 ? 1 : roleSlots[i].x > 66 ? 3 : 2
      // 같은 lane 우선 선택
      let idx = pool.findIndex((p) => lanesOf(p) === slotLane)
      if (idx === -1) idx = 0
      const p = pool[idx]
      if (!p) break
      positions[roleSlots[i].id] = p.id
      used.add(p.id)
      pool.splice(idx, 1)
    }
  }

  return { formation: best, positions }
}
