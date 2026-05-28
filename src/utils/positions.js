// 상세 포지션 → 광역 카테고리
export const POSITION_CATEGORY = {
  GK: 'GK',
  CB: 'DF', LB: 'DF', RB: 'DF',
  CDM: 'MF', CM: 'MF', CAM: 'MF', LM: 'MF', RM: 'MF',
  LW: 'FW', RW: 'FW', ST: 'FW', CF: 'FW'
}

export const POSITION_LABEL = {
  GK: '골키퍼',
  CB: '센터백', LB: '레프트백', RB: '라이트백',
  CDM: '수비형 미드', CM: '중앙 미드', CAM: '공격형 미드', LM: '레프트 미드', RM: '라이트 미드',
  LW: '레프트 윙', RW: '라이트 윙', ST: '스트라이커', CF: '센터 포워드'
}

// 선수 입력 폼용 옵션 그룹
export const POSITION_OPTIONS = [
  { group: 'GK', items: ['GK'] },
  { group: 'DF', items: ['CB', 'LB', 'RB'] },
  { group: 'MF', items: ['CDM', 'CM', 'CAM', 'LM', 'RM'] },
  { group: 'FW', items: ['LW', 'RW', 'ST'] }
]

// 포메이션 슬롯의 x(0~100) 와 매칭하기 위한 가로 선호도
// 1=좌측, 2=중앙, 3=우측
export const POSITION_LANE = {
  LB: 1, LM: 1, LW: 1,
  CB: 2, CDM: 2, CM: 2, CAM: 2, ST: 2, CF: 2, GK: 2,
  RB: 3, RM: 3, RW: 3
}

export function categoryOf(detailed) {
  return POSITION_CATEGORY[detailed] || null
}

export function laneOf(detailed) {
  return POSITION_LANE[detailed] || 2
}
