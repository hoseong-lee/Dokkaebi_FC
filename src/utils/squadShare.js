import { dayjs } from './date'
import { getSlots } from './formations'

const ROLE_ORDER = ['GK', 'DF', 'MF', 'FW']
const ICONS = { GK: '🥅', DF: '🛡', MF: '⚙', FW: '⚽' }

function fmtName(p) {
  if (!p) return ''
  return p.number != null ? `${p.name} #${p.number}` : p.name
}

// 카카오톡/단톡 공지용 텍스트 생성
export function buildSquadShareText({ match, squad, players }) {
  const lines = []
  const opp = match?.opponent || '상대 미정'
  let dateStr = ''
  if (match?.date) {
    const d = dayjs(match.date)
    if (d.isValid()) dateStr = d.format('M/D(ddd) HH:mm')
  }
  const loc = match?.location ? ` · ${match.location}` : ''

  lines.push(`⚽ [도깨비FC] ${dateStr} vs ${opp}${loc}`)
  lines.push(
    squad.formation
      ? `📋 ${squad.formation} (총 ${squad.lineup.length}명)`
      : `📋 명단 (총 ${squad.lineup.length}명)`
  )
  lines.push('')

  const playerMap = new Map(players.map((p) => [p.id, p]))
  const slots = squad.formation ? getSlots(squad.formation) : []
  const byRole = { GK: [], DF: [], MF: [], FW: [] }
  const placed = new Set()

  for (const slot of slots) {
    const pid = squad.positions?.[slot.id]
    if (!pid) continue
    const p = playerMap.get(pid)
    if (!p) continue
    if (byRole[slot.role]) byRole[slot.role].push(p)
    placed.add(pid)
  }

  for (const role of ROLE_ORDER) {
    if (!byRole[role].length) continue
    lines.push(`${ICONS[role]} ${role} ${byRole[role].map(fmtName).join(' · ')}`)
  }

  const unassigned = (squad.lineup || [])
    .filter((pid) => !placed.has(pid))
    .map((pid) => playerMap.get(pid))
    .filter(Boolean)
  if (unassigned.length) {
    lines.push('')
    lines.push(`📝 미배치: ${unassigned.map(fmtName).join(', ')}`)
  }

  return lines.join('\n')
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(ta)
  }
}
