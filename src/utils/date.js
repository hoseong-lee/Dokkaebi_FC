import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('ko')

// Firestore Timestamp | Date | string | number → dayjs
function toDay(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return dayjs(value.toDate())
  return dayjs(value)
}

export function formatDate(value, fmt = 'YYYY.MM.DD (ddd)') {
  const d = toDay(value)
  return d ? d.format(fmt) : ''
}

export function formatDateTime(value) {
  const d = toDay(value)
  return d ? d.format('YYYY.MM.DD (ddd) HH:mm') : ''
}

export function formatTime(value) {
  const d = toDay(value)
  return d ? d.format('HH:mm') : ''
}

export function fromNow(value) {
  const d = toDay(value)
  return d ? d.fromNow() : ''
}

export function isUpcoming(value) {
  const d = toDay(value)
  return d ? d.isAfter(dayjs()) : false
}

// D-day 라벨: D-3 / D-DAY / 종료
export function dDay(value) {
  const d = toDay(value)
  if (!d) return ''
  const diff = d.startOf('day').diff(dayjs().startOf('day'), 'day')
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return 'D-DAY'
  return '종료'
}

// <input type="datetime-local"> 용 (YYYY-MM-DDTHH:mm)
export function toInputDateTime(value) {
  const d = toDay(value)
  return d ? d.format('YYYY-MM-DDTHH:mm') : ''
}

// RTDB 는 Date 객체를 저장할 수 없으므로 epoch ms(number)로 반환
export function fromInputDateTime(str) {
  return str ? dayjs(str).valueOf() : null
}

export { dayjs }
