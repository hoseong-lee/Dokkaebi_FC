import { dayjs } from './date'
import { getSlots } from './formations'

const ROLE_ORDER = ['GK', 'DF', 'MF', 'FW']
const ICONS = { GK: '🥅', DF: '🛡', MF: '⚙', FW: '⚽' }

function fmtName(p) {
  if (!p) return ''
  return p.number != null ? `${p.name} #${p.number}` : p.name
}

function isEmptySquad(s) {
  return !s || (!s.lineup?.length && !s.formation)
}

function buildSquadBlock(squad, playerMap) {
  const lines = []
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
    lines.push(`📝 미배치: ${unassigned.map(fmtName).join(', ')}`)
  }
  return lines
}

// 단일 또는 다중 쿼터 스쿼드 공유 텍스트
// args: { match, squad?, squads?, players }
export function buildSquadShareText({ match, squad, squads, players }) {
  const playerMap = new Map(players.map((p) => [p.id, p]))
  const opp = match?.opponent || '상대 미정'
  let dateStr = ''
  if (match?.date) {
    const d = dayjs(match.date)
    if (d.isValid()) dateStr = d.format('M/D(ddd) HH:mm')
  }
  const loc = match?.location ? ` · ${match.location}` : ''

  const lines = [`⚽ [도깨비FC] ${dateStr} vs ${opp}${loc}`, '']

  const list = Array.isArray(squads) ? squads : squad ? [squad] : []
  const used = list.filter((sq) => !isEmptySquad(sq))

  if (used.length === 0) {
    lines.push('(스쿼드 미작성)')
    return lines.join('\n')
  }

  // 모든 쿼터가 동일하면 한 블록으로
  const single = used.length === 1
  list.forEach((sq, i) => {
    if (isEmptySquad(sq)) return
    if (!single) {
      lines.push(`▣ ${i + 1}쿼터${sq.formation ? ` · ${sq.formation}` : ''} (${sq.lineup?.length || 0}명)`)
    } else {
      lines.push(sq.formation ? `📋 ${sq.formation} (${sq.lineup?.length || 0}명)` : `📋 명단 (${sq.lineup?.length || 0}명)`)
    }
    lines.push(...buildSquadBlock(sq, playerMap))
    lines.push('')
  })

  return lines.join('\n').trimEnd()
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
