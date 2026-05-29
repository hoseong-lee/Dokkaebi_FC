// 한글 초성 매칭
// 'ㅇㅎㅊ' → '유희창' / 'ㄱㅅㅇ' → '김산이' 같이 초성만으로 검색.
// 한글 음절 유니코드: 0xAC00 ~ 0xD7A3
const CHOSEONG = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ',
  'ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
]

export function toChoseong(text) {
  if (!text) return ''
  let out = ''
  for (const ch of String(text)) {
    const code = ch.charCodeAt(0)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      out += CHOSEONG[Math.floor((code - 0xAC00) / 588)]
    } else {
      out += ch.toLowerCase()
    }
  }
  return out
}

// query 가 text 에 매칭되는지 — 일반 substring 또는 초성 substring
export function matchesQuery(text, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  const t = String(text || '').toLowerCase()
  if (t.includes(q)) return true
  // query 가 초성 문자만 있으면 초성 검색 시도
  if (/^[ㄱ-ㅎ]+$/.test(q)) {
    return toChoseong(text).includes(q)
  }
  return false
}
