import { dayjs } from './date'
import { getSlots } from './formations'

const DIVIDER = '━━━━━━━━━━━━━━━━━'
const ROLE_ORDER = ['GK', 'DF', 'MF', 'FW']
const ROLE_ICON = { GK: '🥅', DF: '🛡', MF: '⚙', FW: '⚽' }

function fmtName(p) {
  if (!p) return ''
  return p.number != null ? `${p.name} #${p.number}` : p.name
}
function isEmptySquad(s) {
  return !s || (!s.lineup?.length && !s.formation)
}

function buildPositionLines(squad, playerMap) {
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

  const lines = []
  for (const role of ROLE_ORDER) {
    if (!byRole[role].length) continue
    lines.push('')
    lines.push(`${ROLE_ICON[role]} ${role}`)
    for (const p of byRole[role]) lines.push(`  • ${fmtName(p)}`)
  }

  const unassigned = (squad.lineup || [])
    .filter((pid) => !placed.has(pid))
    .map((pid) => playerMap.get(pid))
    .filter(Boolean)
  if (unassigned.length) {
    lines.push('')
    lines.push('📝 미배치')
    for (const p of unassigned) lines.push(`  • ${fmtName(p)}`)
  }
  return lines
}

export function buildSquadShareText({ match, squad, squads, players }) {
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const opp = match?.opponent || '상대 미정'
  let dateStr = '일시 미정'
  if (match?.date) {
    const d = dayjs(match.date)
    if (d.isValid()) dateStr = d.format('M/D(ddd) HH:mm')
  }
  const loc = match?.location || ''

  const out = []
  out.push('⚽ 도깨비FC 경기 안내')
  out.push(DIVIDER)
  out.push(`📅 ${dateStr}`)
  out.push(`🆚 ${opp}`)
  if (loc) out.push(`📍 ${loc}`)
  out.push(DIVIDER)

  const list = Array.isArray(squads) ? squads : squad ? [squad] : []
  const used = list.map((s, i) => ({ s, i })).filter(({ s }) => !isEmptySquad(s))

  if (used.length === 0) {
    out.push('')
    out.push('(스쿼드 미작성)')
    return out.join('\n')
  }

  used.forEach(({ s, i }, idx) => {
    out.push('')
    const head = list.length > 1 ? `▶ ${i + 1}쿼터` : '▶ 명단'
    out.push(s.formation ? `${head}  ·  ${s.formation}` : head)
    out.push(`   (출전 ${s.lineup?.length || 0}명)`)
    out.push(...buildPositionLines(s, playerMap))
    if (idx < used.length - 1) {
      out.push('')
      out.push(DIVIDER)
    }
  })

  return out.join('\n').replace(/\n{3,}/g, '\n\n')
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
  try { document.execCommand('copy') } finally { document.body.removeChild(ta) }
}
