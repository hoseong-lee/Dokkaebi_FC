// 포메이션 프리셋. rows = GK 를 제외한 수비→공격 라인별 인원.
// 슬롯 좌표는 세로 피치 기준 % (x: 좌0~우100, y: 위0(상대골)~아래100(우리골)).
const FORMATION_ROWS = {
  '4-4-2': [4, 4, 2],
  '4-3-3': [4, 3, 3],
  '4-2-3-1': [4, 2, 3, 1],
  '4-2-1-3': [4, 2, 1, 3],
  '4-3-2-1': [4, 3, 2, 1],
  '4-1-4-1': [4, 1, 4, 1],
  '4-5-1': [4, 5, 1],
  '3-5-2': [3, 5, 2],
  '3-4-3': [3, 4, 3],
  '5-3-2': [5, 3, 2]
}

function buildSlots(rows) {
  const slots = [{ id: 'gk', role: 'GK', x: 50, y: 90 }]
  const R = rows.length
  rows.forEach((count, r) => {
    const y = R === 1 ? 45 : 72 - (r * (72 - 16)) / (R - 1)
    const role = r === 0 ? 'DF' : r === R - 1 ? 'FW' : 'MF'
    for (let i = 0; i < count; i++) {
      const x = ((i + 1) / (count + 1)) * 100
      slots.push({ id: `r${r}p${i}`, role, x, y })
    }
  })
  return slots
}

export const FORMATIONS = Object.fromEntries(
  Object.entries(FORMATION_ROWS).map(([name, rows]) => [name, buildSlots(rows)])
)

export const FORMATION_NAMES = Object.keys(FORMATION_ROWS)

export function getSlots(formation) {
  return FORMATIONS[formation] || []
}
