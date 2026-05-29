// 같은 팀의 다양한 표기를 단일 캐노니컬 이름으로 정규화
// 예: '국대FC' / 'FC국대' / 'fc국대' / '국대' → '국대FC'

// 명시적 동의어 → 캐노니컬 (case-insensitive, whitespace 무시)
const ALIASES = [
  { canonical: '국대FC',       names: ['국대FC', 'FC국대', 'fc국대', '국대fc', '국대 FC', 'FC 국대'] },
  { canonical: '삼미FC',       names: ['삼미FC', '삼미fc'] },
  { canonical: '덕선FC',       names: ['덕선FC', '덕선fc'] },
  { canonical: '원스FC',       names: ['원스FC', '원스fc'] },
  { canonical: 'EX FC',        names: ['EX FC', 'EXFC', 'EXfc', 'EX fc', 'ex fc', 'exfc'] },
  { canonical: '도깨비 자체전', names: ['도깨비 자체전', '도깨비 자체전 (한마음 축구대회)', '도깨비 한마음 축구대회', '자체전', '한마음 축구대회'] }
]

// 매핑 인덱스 (한 번만 빌드)
const MAP = new Map()
for (const { canonical, names } of ALIASES) {
  for (const n of names) {
    MAP.set(normalizeKey(n), canonical)
  }
}

function normalizeKey(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase()
}

export function canonicalOpponent(raw) {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  return MAP.get(normalizeKey(trimmed)) || trimmed
}

// 입력 vs 결과가 다르면 정규화가 일어남
export function isOpponentVariant(raw) {
  if (!raw) return false
  return canonicalOpponent(raw) !== String(raw).trim()
}
