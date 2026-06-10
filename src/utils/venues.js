// 구장 길찾기 URL 헬퍼 — 네이버지도 우선
// 좌표(위경도)만 있으면 API 키 없이 외부 지도 앱 길찾기 가능

export function naverDirectionsUrl({ lat, lng, name }) {
  // 모바일 앱 (nmap://) — 설치 안 됐으면 브라우저가 무시
  // 웹 URL — 항상 작동
  const encoded = encodeURIComponent(name || '경기장')
  return `https://map.naver.com/p/directions/-/${lng},${lat},${encoded},,PLACE_POI/-/transit?c=15.00,0,0,0,dh`
}

export function naverAppUrl({ lat, lng, name }) {
  const encoded = encodeURIComponent(name || '경기장')
  return `nmap://route/public?dlat=${lat}&dlng=${lng}&dname=${encoded}&appname=dokkaebifc`
}

export function kakaoDirectionsUrl({ lat, lng, name }) {
  const encoded = encodeURIComponent(name || '경기장')
  return `https://map.kakao.com/?ep=${lat},${lng}&en=${encoded}&by=PUBLICTRANSIT`
}

export function googleDirectionsUrl({ lat, lng }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`
}

// 정적 지도 이미지 (OpenStreetMap, API 키 없이 무료)
export function staticMapUrl({ lat, lng, zoom = 15, width = 600, height = 300 }) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},lightblue1`
}

export function isValidCoord(lat, lng) {
  if (lat == null || lng == null) return false
  const a = Number(lat), b = Number(lng)
  if (Number.isNaN(a) || Number.isNaN(b)) return false
  return a >= -90 && a <= 90 && b >= -180 && b <= 180
}

// 초기 시드 — 호성님이 등록 후 좌표 정확히 수정 가능
export const INITIAL_VENUES = [
  {
    name: '다락원체육공원',
    address: '서울 도봉구 창포원로 45',
    lat: 37.6896,
    lng: 127.0464,
    type: 'field',
    notes: '인조잔디 / 야간 조명 / 도봉산역 1번 출구 도보 5분'
  },
  {
    name: '초안산스포츠타운',
    address: '서울 도봉구 노해로73길 일대',
    lat: 37.6500,
    lng: 127.0381,
    type: 'field',
    notes: '주차 가능'
  },
  {
    name: '창골운동장',
    address: '서울 도봉구 창골운동장',
    lat: 37.6727,
    lng: 127.0617,
    type: 'field',
    notes: '서울생활체육 등록 시설 (정확한 좌표는 admin 에서 등록)'
  },
  {
    name: '수락산스포츠타운',
    address: '서울 노원구 상계동 / 의정부 장암동 일대',
    lat: 37.6862,
    lng: 127.0697,
    type: 'field',
    notes: '수락산역 인근'
  },
  {
    name: '불암산스포츠타운',
    address: '서울 노원구 중계동 일대',
    lat: 37.6450,
    lng: 127.0900,
    type: 'field',
    notes: '불암산 자락'
  }
]

export const VENUE_TYPE_LABEL = {
  field: '⚽ 구장',
  venue: '🏟 운동장',
  restaurant: '🍻 회식',
  other: '📍 기타'
}
