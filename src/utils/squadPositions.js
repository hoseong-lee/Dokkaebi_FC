// 스쿼드 positions 직렬화 호환 레이어.
// 두 형식을 모두 인식해 항상 { slotId: playerId } 로 정규화한다.
//
//  (A) 새 형식 : { [slotId]: playerId }
//      예: { GK: 'p1', CB1: 'p3', CB2: 'p4' }
//  (B) 옛 형식 : { [playerId]: { slotId } }
//      예: { p1: { slotId: 'GK' }, p3: { slotId: 'CB1' } }
//
// SquadEditor / FormationPitch 는 (A) 기준. 옛 저장본도 안전하게 읽히도록.

/**
 * 어떤 형식이든 받아 Map<slotId, playerId> 반환
 */
export function parsePositions(posMap) {
  const out = new Map()
  if (!posMap || typeof posMap !== 'object') return out
  for (const [k, v] of Object.entries(posMap)) {
    if (typeof v === 'string' && v) {
      // (A) slotId 가 key
      out.set(k, v)
    } else if (v && typeof v === 'object' && typeof v.slotId === 'string') {
      // (B) playerId 가 key, value 가 { slotId }
      out.set(v.slotId, k)
    }
  }
  return out
}

/**
 * 어떤 형식이든 받아 새 형식 plain object { slotId: playerId } 반환
 */
export function normalizePositions(posMap) {
  return Object.fromEntries(parsePositions(posMap))
}
