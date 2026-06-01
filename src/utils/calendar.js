// 경기 → 캘린더 등록 (.ics 다운로드 + 구글 캘린더 추가 URL)
// 표준: RFC 5545 (iCalendar). 구글·iOS·네이버·아웃룩 모두 호환.

const APP_URL = 'https://hoseong-lee.github.io/Dokkaebi_FC'

function pad(n) { return String(n).padStart(2, '0') }

// Date → UTC YYYYMMDDTHHmmssZ
function toUTCStamp(date) {
  const y = date.getUTCFullYear()
  const M = pad(date.getUTCMonth() + 1)
  const d = pad(date.getUTCDate())
  const h = pad(date.getUTCHours())
  const m = pad(date.getUTCMinutes())
  const s = pad(date.getUTCSeconds())
  return `${y}${M}${d}T${h}${m}${s}Z`
}

// ICS 텍스트 이스케이프 (RFC 5545 § 3.3.11)
function escapeICS(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function eventTimes(match, durationHours = 2) {
  const start = match.date ? new Date(match.date) : new Date()
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000)
  return { start, end }
}

function eventTitle(match) {
  return `도깨비FC vs ${match.opponent || '경기'}`
}

function eventDescription(match) {
  const lines = []
  if (match.type) lines.push(`종류: ${match.type}`)
  if (match.location) lines.push(`경기장: ${match.location}`)
  if (match.locationUrl) lines.push(`지도: ${match.locationUrl}`)
  lines.push(`상세: ${APP_URL}/matches/${match.id}`)
  return lines.join('\n')
}

// ── ICS 파일 생성 (모든 캘린더 호환) ──
export function generateMatchICS(match) {
  const { start, end } = eventTimes(match)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dokkaebi FC//Match//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:dokkaebi-match-${match.id}@dokkaebi-fc`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toUTCStamp(start)}`,
    `DTEND:${toUTCStamp(end)}`,
    `SUMMARY:${escapeICS(eventTitle(match))}`,
    match.location ? `LOCATION:${escapeICS(match.location)}` : null,
    `DESCRIPTION:${escapeICS(eventDescription(match))}`,
    `URL:${APP_URL}/matches/${match.id}`,
    // D-1 알림 (전날 같은 시각)
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS('내일 도깨비FC 경기!')}`,
    'END:VALARM',
    // 1시간 전 알림
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS('곧 도깨비FC 경기 시작!')}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
  return ics
}

export function downloadMatchICS(match) {
  const ics = generateMatchICS(match)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safe = (match.opponent || 'match').replace(/[^\w가-힣\s-]/g, '_').trim()
  a.download = `dokkaebi-${safe}.ics`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

// ── 구글 캘린더 직접 추가 URL (새 탭) ──
// 구글 계정 로그인된 사용자는 클릭 → 바로 추가 가능
export function googleCalendarUrl(match) {
  const { start, end } = eventTimes(match)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(match),
    dates: `${toUTCStamp(start)}/${toUTCStamp(end)}`,
    details: eventDescription(match)
  })
  if (match.location) params.set('location', match.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// ── 네이버 캘린더 추가 URL (선택) ──
export function naverCalendarUrl(match) {
  const { start, end } = eventTimes(match)
  const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  const params = new URLSearchParams({
    title: eventTitle(match),
    start: fmt(start),
    end: fmt(end),
    description: eventDescription(match)
  })
  if (match.location) params.set('location', match.location)
  return `https://calendar.naver.com/schedule/createBySharing.nhn?${params.toString()}`
}
