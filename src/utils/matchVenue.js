// 매치의 장소 라벨 통합 helper.
// 옛 매치는 `location` (string) 만, 새 매치는 `venueId` (참조) + 종종 `location` 도 함께.
// 모든 표시 지점이 동일 규칙으로 동작하도록 한 곳에서 정리한다.
//
//  우선순위:
//   1) venueId 가 있고 venuesById 에 매칭되는 venue 가 있으면 venue.name
//   2) 그 외 매치의 location 텍스트
//   3) 아무 것도 없으면 fallback (기본 '장소 미정')

// venueLookup 형태: 함수 (id → venue) 또는 객체 ({ [id]: venue }) 어느 쪽이든 OK
function resolveVenue(match, venueLookup) {
  if (!match?.venueId || !venueLookup) return null
  if (typeof venueLookup === 'function') return venueLookup(match.venueId) || null
  return venueLookup[match.venueId] || null
}

/**
 * @param {object} match
 * @param {function|object|null} venueLookup — (id)=>venue 함수 또는 { id: venue } 매핑
 * @param {string} fallback — venue 없고 location 도 없을 때 표시 텍스트
 */
export function matchVenueLabel(match, venueLookup = null, fallback = '장소 미정') {
  const venue = resolveVenue(match, venueLookup)
  if (venue?.name) return venue.name
  if (match?.location) return match.location
  return fallback
}

/**
 * 캘린더/ICS 등 텍스트 전용에서 사용 — fallback 빈 문자열
 */
export function matchVenueText(match, venueLookup = null) {
  return matchVenueLabel(match, venueLookup, '')
}

/**
 * venue 객체 자체 반환 (좌표 등 필요할 때)
 */
export function matchVenueObject(match, venueLookup = null) {
  return resolveVenue(match, venueLookup)
}
