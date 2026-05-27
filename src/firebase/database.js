import {
  ref,
  get,
  set,
  update,
  push,
  remove,
  serverTimestamp,
  increment
} from 'firebase/database'
import { rtdb, auth } from './config'
import { emptyStats, tallyEvents } from '@/utils/stats'

// RTDB 키에는 '.' 를 쓸 수 없으므로 이메일은 '.' → ',' 로 인코딩한다.
export function encodeEmailKey(email) {
  return (email || '').toLowerCase().trim().replace(/\./g, ',')
}

// 컬렉션 스냅샷 → [{ id, ...val }]
function toList(snap) {
  const v = snap.val() || {}
  return Object.entries(v).map(([id, val]) => ({ id, ...val }))
}

// ───────────── 감사 로그 ─────────────
export async function logAudit(action, target, diff = null) {
  const user = auth.currentUser
  if (!user) return
  try {
    await push(ref(rtdb, 'auditLogs'), {
      uid: user.uid,
      userDisplayName: user.displayName || user.email,
      action,
      target,
      diff: diff || null,
      timestamp: serverTimestamp()
    })
  } catch (e) {
    console.warn('audit log 실패', e)
  }
}

export async function listAuditLogs(max = 100) {
  const snap = await get(ref(rtdb, 'auditLogs'))
  return toList(snap)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, max)
}

// ───────────── 시즌 ─────────────
export async function listSeasons() {
  const snap = await get(ref(rtdb, 'seasons'))
  return toList(snap).sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
}

export async function getActiveSeason() {
  const seasons = await listSeasons()
  return seasons.find((s) => s.active) || null
}

export async function createSeason(data) {
  const r = push(ref(rtdb, 'seasons'))
  await set(r, data)
  await logAudit('create', `seasons/${r.key}`)
  return r.key
}

// ───────────── 선수 ─────────────
export async function listPlayers() {
  const snap = await get(ref(rtdb, 'players'))
  return toList(snap).sort((a, b) => (a.number || 0) - (b.number || 0))
}

export async function getPlayer(id) {
  const snap = await get(ref(rtdb, `players/${id}`))
  return snap.exists() ? { id, ...snap.val() } : null
}

export async function createPlayer(data) {
  const r = push(ref(rtdb, 'players'))
  await set(r, {
    ...data,
    stats: emptyStats(),
    seasonStats: {},
    joinedAt: serverTimestamp()
  })
  await logAudit('create', `players/${r.key}`, data)
  return r.key
}

export async function updatePlayer(id, data) {
  await update(ref(rtdb, `players/${id}`), data)
  await logAudit('update', `players/${id}`, data)
}

export async function deletePlayer(id) {
  await remove(ref(rtdb, `players/${id}`))
  await logAudit('delete', `players/${id}`)
}

// ───────────── 경기 ─────────────
export async function listMatches({ seasonId } = {}) {
  const snap = await get(ref(rtdb, 'matches'))
  let list = toList(snap)
  if (seasonId) list = list.filter((m) => m.seasonId === seasonId)
  return list.sort((a, b) => (b.date || 0) - (a.date || 0))
}

export async function getMatch(id) {
  const snap = await get(ref(rtdb, `matches/${id}`))
  return snap.exists() ? { id, ...snap.val() } : null
}

export async function createMatch(data) {
  const r = push(ref(rtdb, 'matches'))
  await set(r, {
    ...data,
    score: { dokkaebi: null, opponent: null },
    lineup: data.lineup || [],
    events: [],
    momPlayerId: null,
    status: 'scheduled',
    createdBy: auth.currentUser?.uid || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `matches/${r.key}`, data)
  return r.key
}

export async function updateMatch(id, data) {
  await update(ref(rtdb, `matches/${id}`), { ...data, updatedAt: serverTimestamp() })
  await logAudit('update', `matches/${id}`, data)
}

export async function deleteMatch(id) {
  await remove(ref(rtdb, `matches/${id}`))
  await logAudit('delete', `matches/${id}`)
}

function bump(updates, playerId, seasonId, field, delta) {
  if (!delta) return
  updates[`players/${playerId}/stats/${field}`] = increment(delta)
  if (seasonId) updates[`players/${playerId}/seasonStats/${seasonId}/${field}`] = increment(delta)
}

// 경기 결과 입력/수정: 이전 통계 대비 net diff 만 멀티패스 update 로 원자 반영.
export async function submitMatchResult(matchId, result) {
  const snap = await get(ref(rtdb, `matches/${matchId}`))
  if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.')
  const data = snap.val()
  const seasonId = data.seasonId
  const prevTally = tallyEvents(data.events || [])
  const nextTally = tallyEvents(result.events || [])

  const updates = {}

  const ids = new Set([...Object.keys(prevTally), ...Object.keys(nextTally)])
  for (const pid of ids) {
    bump(updates, pid, seasonId, 'goals', (nextTally[pid]?.goals || 0) - (prevTally[pid]?.goals || 0))
    bump(updates, pid, seasonId, 'assists', (nextTally[pid]?.assists || 0) - (prevTally[pid]?.assists || 0))
  }

  const prevL = new Set(data.lineup || [])
  const nextL = new Set(result.lineup || [])
  for (const pid of nextL) if (!prevL.has(pid)) bump(updates, pid, seasonId, 'appearances', 1)
  for (const pid of prevL) if (!nextL.has(pid)) bump(updates, pid, seasonId, 'appearances', -1)

  if (data.momPlayerId !== result.momPlayerId) {
    if (data.momPlayerId) bump(updates, data.momPlayerId, seasonId, 'momCount', -1)
    if (result.momPlayerId) bump(updates, result.momPlayerId, seasonId, 'momCount', 1)
  }

  updates[`matches/${matchId}/score`] = result.score
  updates[`matches/${matchId}/events`] = result.events || []
  updates[`matches/${matchId}/lineup`] = result.lineup || []
  updates[`matches/${matchId}/momPlayerId`] = result.momPlayerId ?? null
  updates[`matches/${matchId}/notes`] = result.notes ?? data.notes ?? ''
  updates[`matches/${matchId}/status`] = 'finished'
  updates[`matches/${matchId}/updatedAt`] = serverTimestamp()

  await update(ref(rtdb), updates)
  await logAudit('update', `matches/${matchId}`, { result: 'submitted' })
}

// ───────────── RSVP ─────────────
export async function listRsvps(matchId) {
  const snap = await get(ref(rtdb, `matches/${matchId}/rsvps`))
  return toList(snap)
}

export async function setRsvp(matchId, status, note = '') {
  const uid = auth.currentUser.uid
  const userSnap = await get(ref(rtdb, `users/${uid}`))
  const u = userSnap.val() || {}
  await set(ref(rtdb, `matches/${matchId}/rsvps/${uid}`), {
    uid,
    playerId: u.playerId || null,
    displayName: u.displayName || auth.currentUser.displayName,
    status,
    note,
    respondedAt: serverTimestamp()
  })
}

// ───────────── 화이트리스트 ─────────────
export async function listAllowedEmails() {
  const snap = await get(ref(rtdb, 'allowedEmails'))
  const v = snap.val() || {}
  // 표시는 저장된 email 필드 기준 (키는 인코딩되어 있음)
  return Object.values(v)
}

export async function getAllowedEmail(email) {
  const snap = await get(ref(rtdb, `allowedEmails/${encodeEmailKey(email)}`))
  return snap.exists() ? snap.val() : null
}

export async function addAllowedEmail(email, role, note = '') {
  const lower = email.toLowerCase().trim()
  await set(ref(rtdb, `allowedEmails/${encodeEmailKey(lower)}`), {
    email: lower,
    role,
    active: true,
    note,
    addedBy: auth.currentUser?.uid || 'system',
    addedAt: serverTimestamp()
  })
  await logAudit('create', `allowedEmails/${lower}`, { role })
}

export async function updateAllowedEmail(email, patch) {
  await update(ref(rtdb, `allowedEmails/${encodeEmailKey(email)}`), patch)
  await logAudit('update', `allowedEmails/${email}`, patch)
}

export async function removeAllowedEmail(email) {
  await remove(ref(rtdb, `allowedEmails/${encodeEmailKey(email)}`))
  await logAudit('delete', `allowedEmails/${email}`)
}

// ───────────── 사용자 ─────────────
export async function upsertUser(uid, data) {
  await update(ref(rtdb, `users/${uid}`), data)
}
