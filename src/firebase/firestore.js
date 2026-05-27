import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from './config'
import { emptyStats, tallyEvents } from '@/utils/stats'

function snapToObj(snap) {
  return { id: snap.id, ...snap.data() }
}

// ───────────── 감사 로그 ─────────────
export async function logAudit(action, target, diff = null) {
  const user = auth.currentUser
  if (!user) return
  try {
    await addDoc(collection(db, 'auditLogs'), {
      uid: user.uid,
      userDisplayName: user.displayName || user.email,
      action,
      target,
      diff,
      timestamp: serverTimestamp()
    })
  } catch (e) {
    // 감사 로그 실패가 주 작업을 막지 않도록 swallow
    console.warn('audit log 실패', e)
  }
}

export async function listAuditLogs(max = 100) {
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(snapToObj)
}

// ───────────── 시즌 ─────────────
export async function listSeasons() {
  const snap = await getDocs(query(collection(db, 'seasons'), orderBy('startDate', 'desc')))
  return snap.docs.map(snapToObj)
}

export async function getActiveSeason() {
  const snap = await getDocs(
    query(collection(db, 'seasons'), where('active', '==', true), limit(1))
  )
  return snap.empty ? null : snapToObj(snap.docs[0])
}

export async function createSeason(data) {
  const ref = await addDoc(collection(db, 'seasons'), data)
  await logAudit('create', `seasons/${ref.id}`)
  return ref.id
}

// ───────────── 선수 ─────────────
export async function listPlayers() {
  const snap = await getDocs(query(collection(db, 'players'), orderBy('number', 'asc')))
  return snap.docs.map(snapToObj)
}

export async function getPlayer(id) {
  const snap = await getDoc(doc(db, 'players', id))
  return snap.exists() ? snapToObj(snap) : null
}

export async function createPlayer(data) {
  const ref = await addDoc(collection(db, 'players'), {
    ...data,
    stats: emptyStats(),
    seasonStats: {},
    joinedAt: serverTimestamp()
  })
  await logAudit('create', `players/${ref.id}`, data)
  return ref.id
}

export async function updatePlayer(id, data) {
  await updateDoc(doc(db, 'players', id), data)
  await logAudit('update', `players/${id}`, data)
}

export async function deletePlayer(id) {
  await deleteDoc(doc(db, 'players', id))
  await logAudit('delete', `players/${id}`)
}

// ───────────── 경기 ─────────────
export async function listMatches({ seasonId } = {}) {
  const col = collection(db, 'matches')
  const q = seasonId
    ? query(col, where('seasonId', '==', seasonId), orderBy('date', 'desc'))
    : query(col, orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(snapToObj)
}

export async function getMatch(id) {
  const snap = await getDoc(doc(db, 'matches', id))
  return snap.exists() ? snapToObj(snap) : null
}

export async function createMatch(data) {
  const ref = await addDoc(collection(db, 'matches'), {
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
  await logAudit('create', `matches/${ref.id}`, data)
  return ref.id
}

export async function updateMatch(id, data) {
  await updateDoc(doc(db, 'matches', id), { ...data, updatedAt: serverTimestamp() })
  await logAudit('update', `matches/${id}`, data)
}

export async function deleteMatch(id) {
  await deleteDoc(doc(db, 'matches', id))
  await logAudit('delete', `matches/${id}`)
}

// 출전(appearances) diff 적용: prev/next lineup 비교
function applyAppearanceDiff(tx, seasonId, prevLineup, nextLineup) {
  const prev = new Set(prevLineup || [])
  const next = new Set(nextLineup || [])
  for (const pid of next) {
    if (!prev.has(pid)) bump(tx, pid, seasonId, 'appearances', 1)
  }
  for (const pid of prev) {
    if (!next.has(pid)) bump(tx, pid, seasonId, 'appearances', -1)
  }
}

function bump(tx, playerId, seasonId, field, delta) {
  const patch = { [`stats.${field}`]: increment(delta) }
  if (seasonId) patch[`seasonStats.${seasonId}.${field}`] = increment(delta)
  tx.update(doc(db, 'players', playerId), patch)
}

// 경기 결과 입력/수정: 이전 통계 롤백 후 새 통계 반영 (트랜잭션)
export async function submitMatchResult(matchId, result) {
  await runTransaction(db, async (tx) => {
    const matchRef = doc(db, 'matches', matchId)
    const matchSnap = await tx.get(matchRef)
    if (!matchSnap.exists()) throw new Error('경기를 찾을 수 없습니다.')

    const data = matchSnap.data()
    const seasonId = data.seasonId
    const prevEvents = data.events || []
    const prevTally = tallyEvents(prevEvents)
    const nextTally = tallyEvents(result.events || [])

    // 골/어시스트 net diff 적용
    const ids = new Set([...Object.keys(prevTally), ...Object.keys(nextTally)])
    for (const pid of ids) {
      const gDelta = (nextTally[pid]?.goals || 0) - (prevTally[pid]?.goals || 0)
      const aDelta = (nextTally[pid]?.assists || 0) - (prevTally[pid]?.assists || 0)
      if (gDelta) bump(tx, pid, seasonId, 'goals', gDelta)
      if (aDelta) bump(tx, pid, seasonId, 'assists', aDelta)
    }

    // 출전 diff
    applyAppearanceDiff(tx, seasonId, data.lineup, result.lineup)

    // MOM diff
    if (data.momPlayerId !== result.momPlayerId) {
      if (data.momPlayerId) bump(tx, data.momPlayerId, seasonId, 'momCount', -1)
      if (result.momPlayerId) bump(tx, result.momPlayerId, seasonId, 'momCount', 1)
    }

    tx.update(matchRef, {
      score: result.score,
      events: result.events,
      lineup: result.lineup,
      momPlayerId: result.momPlayerId,
      notes: result.notes ?? data.notes ?? '',
      status: 'finished',
      updatedAt: serverTimestamp()
    })
  })
  await logAudit('update', `matches/${matchId}`, { result: 'submitted' })
}

// ───────────── RSVP ─────────────
export async function listRsvps(matchId) {
  const snap = await getDocs(collection(db, 'matches', matchId, 'rsvps'))
  return snap.docs.map(snapToObj)
}

export async function setRsvp(matchId, status, note = '') {
  const uid = auth.currentUser.uid
  const userSnap = await getDoc(doc(db, 'users', uid))
  const u = userSnap.data() || {}
  await setDoc(doc(db, 'matches', matchId, 'rsvps', uid), {
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
  const snap = await getDocs(collection(db, 'allowedEmails'))
  return snap.docs.map((d) => ({ email: d.id, ...d.data() }))
}

export async function addAllowedEmail(email, role, note = '') {
  const lower = email.toLowerCase().trim()
  await setDoc(doc(db, 'allowedEmails', lower), {
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
  await updateDoc(doc(db, 'allowedEmails', email), patch)
  await logAudit('update', `allowedEmails/${email}`, patch)
}

export async function removeAllowedEmail(email) {
  await deleteDoc(doc(db, 'allowedEmails', email))
  await logAudit('delete', `allowedEmails/${email}`)
}
