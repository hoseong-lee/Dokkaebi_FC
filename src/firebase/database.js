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
import { dayjs } from '@/utils/date'

// 이 앱의 모든 데이터는 RTDB 의 'dokkaebi/' 노드 아래에 둔다
// (travel/calendar 와 동일하게 앱별 네임스페이스 분리).
export const NS = 'dokkaebi'
export function nsPath(p) {
  return `${NS}/${p}`
}

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
    await push(ref(rtdb, nsPath('auditLogs')), {
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
  const snap = await get(ref(rtdb, nsPath('auditLogs')))
  return toList(snap)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, max)
}

// ───────────── 시즌 ─────────────
export async function listSeasons() {
  const snap = await get(ref(rtdb, nsPath('seasons')))
  return toList(snap).sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
}

export async function getActiveSeason() {
  const seasons = await listSeasons()
  return seasons.find((s) => s.active) || null
}

export async function createSeason(data) {
  const r = push(ref(rtdb, nsPath('seasons')))
  await set(r, data)
  await logAudit('create', `seasons/${r.key}`)
  return r.key
}

// ───────────── 선수 ─────────────
export async function listPlayers() {
  const snap = await get(ref(rtdb, nsPath('players')))
  return toList(snap).sort((a, b) => (a.number || 0) - (b.number || 0))
}

export async function getPlayer(id) {
  const snap = await get(ref(rtdb, nsPath(`players/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}

export async function createPlayer(data) {
  const r = push(ref(rtdb, nsPath('players')))
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
  await update(ref(rtdb, nsPath(`players/${id}`)), data)
  await logAudit('update', `players/${id}`, data)
}

export async function deletePlayer(id) {
  await remove(ref(rtdb, nsPath(`players/${id}`)))
  await logAudit('delete', `players/${id}`)
}

// ───────────── 경기 ─────────────
export async function listMatches({ seasonId } = {}) {
  const snap = await get(ref(rtdb, nsPath('matches')))
  let list = toList(snap)
  if (seasonId) list = list.filter((m) => m.seasonId === seasonId)
  return list.sort((a, b) => (b.date || 0) - (a.date || 0))
}

export async function getMatch(id) {
  const snap = await get(ref(rtdb, nsPath(`matches/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}

export async function createMatch(data) {
  const r = push(ref(rtdb, nsPath('matches')))
  await set(r, {
    ...data,
    score: { dokkaebi: null, opponent: null },
    lineup: data.lineup || [],
    events: [],
    quarters: [],
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
  await update(ref(rtdb, nsPath(`matches/${id}`)), { ...data, updatedAt: serverTimestamp() })
  await logAudit('update', `matches/${id}`, data)
}

export async function deleteMatch(id) {
  await remove(ref(rtdb, nsPath(`matches/${id}`)))
  await logAudit('delete', `matches/${id}`)
}

function bump(updates, playerId, seasonId, field, delta) {
  if (!delta) return
  updates[nsPath(`players/${playerId}/stats/${field}`)] = increment(delta)
  if (seasonId) updates[nsPath(`players/${playerId}/seasonStats/${seasonId}/${field}`)] = increment(delta)
}

// 쿼터 배열 → 집계 { quarters(정규화), events(flatten+quarter), lineup(union), score(합산) }
export function aggregateQuarters(quarters = []) {
  const events = []
  const lineupSet = new Set()
  let dok = 0
  let opp = 0
  const normQuarters = quarters.map((q, i) => {
    const qEvents = (q.events || []).map((e) => ({
      minute: Number(e.minute) || 0,
      type: e.type || 'goal',
      playerId: e.playerId,
      assistPlayerId: e.assistPlayerId || null
    }))
    const qLineup = q.lineup || []
    qLineup.forEach((pid) => lineupSet.add(pid))
    const qGoals = qEvents.filter((e) => e.type === 'goal').length
    const qOpp = Number(q.opponentScore) || 0
    dok += qGoals
    opp += qOpp
    qEvents.forEach((e) => events.push({ ...e, quarter: i + 1 }))
    return {
      lineup: qLineup,
      events: qEvents,
      opponentScore: qOpp,
      score: { dokkaebi: qGoals, opponent: qOpp },
      formation: q.formation || null,
      positions: q.positions || {}
    }
  })
  return {
    quarters: normQuarters,
    events,
    lineup: [...lineupSet],
    score: { dokkaebi: dok, opponent: opp }
  }
}

// 직전 저장 상태(쿼터 우선, 없으면 레거시 aggregate)에서 통계 집계용 이벤트/명단 추출
function prevAggregate(data) {
  if (Array.isArray(data.quarters) && data.quarters.length) {
    return aggregateQuarters(data.quarters)
  }
  return { events: data.events || [], lineup: data.lineup || [] }
}

// 경기 결과 입력/수정(쿼터별): 이전 통계 대비 net diff 만 멀티패스 update 로 원자 반영.
export async function submitMatchResult(matchId, result) {
  const snap = await get(ref(rtdb, nsPath(`matches/${matchId}`)))
  if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.')
  const data = snap.val()
  const seasonId = data.seasonId

  const agg = aggregateQuarters(result.quarters || [])
  const prev = prevAggregate(data)

  const prevTally = tallyEvents(prev.events)
  const nextTally = tallyEvents(agg.events)

  const updates = {}

  const ids = new Set([...Object.keys(prevTally), ...Object.keys(nextTally)])
  for (const pid of ids) {
    bump(updates, pid, seasonId, 'goals', (nextTally[pid]?.goals || 0) - (prevTally[pid]?.goals || 0))
    bump(updates, pid, seasonId, 'assists', (nextTally[pid]?.assists || 0) - (prevTally[pid]?.assists || 0))
  }

  // 출전수: 한 쿼터라도 뛰면 1경기
  const prevL = new Set(prev.lineup)
  const nextL = new Set(agg.lineup)
  for (const pid of nextL) if (!prevL.has(pid)) bump(updates, pid, seasonId, 'appearances', 1)
  for (const pid of prevL) if (!nextL.has(pid)) bump(updates, pid, seasonId, 'appearances', -1)

  if (data.momPlayerId !== result.momPlayerId) {
    if (data.momPlayerId) bump(updates, data.momPlayerId, seasonId, 'momCount', -1)
    if (result.momPlayerId) bump(updates, result.momPlayerId, seasonId, 'momCount', 1)
  }

  updates[nsPath(`matches/${matchId}/quarters`)] = agg.quarters
  updates[nsPath(`matches/${matchId}/score`)] = agg.score
  updates[nsPath(`matches/${matchId}/events`)] = agg.events // 집계(타임라인/표시용)
  updates[nsPath(`matches/${matchId}/lineup`)] = agg.lineup // 출전 union(표시용)
  updates[nsPath(`matches/${matchId}/momPlayerId`)] = result.momPlayerId ?? null
  updates[nsPath(`matches/${matchId}/notes`)] = result.notes ?? data.notes ?? ''
  updates[nsPath(`matches/${matchId}/status`)] = 'finished'
  updates[nsPath(`matches/${matchId}/updatedAt`)] = serverTimestamp()

  await update(ref(rtdb), updates)
  await logAudit('update', `matches/${matchId}`, { result: 'submitted' })
}

// ───────────── RSVP ─────────────
export async function listRsvps(matchId) {
  const snap = await get(ref(rtdb, nsPath(`matches/${matchId}/rsvps`)))
  return toList(snap)
}

export async function setRsvp(matchId, status, note = '') {
  const uid = auth.currentUser.uid
  const userSnap = await get(ref(rtdb, nsPath(`users/${uid}`)))
  const u = userSnap.val() || {}
  await set(ref(rtdb, nsPath(`matches/${matchId}/rsvps/${uid}`)), {
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
  const snap = await get(ref(rtdb, nsPath('allowedEmails')))
  const v = snap.val() || {}
  // 표시는 저장된 email 필드 기준 (키는 인코딩되어 있음)
  return Object.values(v)
}

export async function getAllowedEmail(email) {
  const snap = await get(ref(rtdb, nsPath(`allowedEmails/${encodeEmailKey(email)}`)))
  return snap.exists() ? snap.val() : null
}

export async function addAllowedEmail(email, role, note = '', playerId = null) {
  const lower = email.toLowerCase().trim()
  await set(ref(rtdb, nsPath(`allowedEmails/${encodeEmailKey(lower)}`)), {
    email: lower,
    role,
    active: true,
    note,
    playerId: playerId || null,
    addedBy: auth.currentUser?.uid || 'system',
    addedAt: serverTimestamp()
  })
  await logAudit('create', `allowedEmails/${lower}`, { role, playerId })
}

export async function updateAllowedEmail(email, patch) {
  await update(ref(rtdb, nsPath(`allowedEmails/${encodeEmailKey(email)}`)), patch)
  await logAudit('update', `allowedEmails/${email}`, patch)
}

export async function removeAllowedEmail(email) {
  await remove(ref(rtdb, nsPath(`allowedEmails/${encodeEmailKey(email)}`)))
  await logAudit('delete', `allowedEmails/${email}`)
}

// ───────────── 사용자 ─────────────
export async function upsertUser(uid, data) {
  await update(ref(rtdb, nsPath(`users/${uid}`)), data)
}

export async function getUserProfile(uid) {
  const snap = await get(ref(rtdb, nsPath(`users/${uid}`)))
  return snap.exists() ? { uid, ...snap.val() } : null
}

export async function linkUserToPlayer(uid, playerId) {
  await update(ref(rtdb, nsPath(`users/${uid}`)), { playerId: playerId || null })
  await logAudit('update', `users/${uid}`, { playerId })
}

// ───────────── MOM 투표 ─────────────
export async function castMomVote(matchId, candidatePlayerId) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  const r = ref(rtdb, nsPath(`matches/${matchId}/votes/${uid}`))
  if (!candidatePlayerId) await remove(r)
  else await set(r, candidatePlayerId)
}

// 관리자: 투표 마감 + MOM 확정. 통계 diff 반영(이전 MOM 차감, 신규 가산).
export async function finalizeMomVoting(matchId, winnerId) {
  const snap = await get(ref(rtdb, nsPath(`matches/${matchId}`)))
  if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.')
  const data = snap.val()
  const seasonId = data.seasonId
  const prev = data.momPlayerId || null
  const updates = {}
  if (prev !== winnerId) {
    if (prev) {
      updates[nsPath(`players/${prev}/stats/momCount`)] = increment(-1)
      if (seasonId) updates[nsPath(`players/${prev}/seasonStats/${seasonId}/momCount`)] = increment(-1)
    }
    if (winnerId) {
      updates[nsPath(`players/${winnerId}/stats/momCount`)] = increment(1)
      if (seasonId) updates[nsPath(`players/${winnerId}/seasonStats/${seasonId}/momCount`)] = increment(1)
    }
  }
  updates[nsPath(`matches/${matchId}/momPlayerId`)] = winnerId || null
  updates[nsPath(`matches/${matchId}/votingClosed`)] = true
  updates[nsPath(`matches/${matchId}/updatedAt`)] = serverTimestamp()
  await update(ref(rtdb), updates)
  await logAudit('update', `matches/${matchId}`, { momFinalized: winnerId })
}

// ───────────── 공지사항 ─────────────
function authorMeta() {
  const u = auth.currentUser
  return { authorUid: u?.uid || null, authorName: u?.displayName || u?.email || '익명' }
}

export async function listAnnouncements() {
  const snap = await get(ref(rtdb, nsPath('announcements')))
  return toList(snap).sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.createdAt || 0) - (a.createdAt || 0)
  )
}
export async function createAnnouncement(data) {
  const r = push(ref(rtdb, nsPath('announcements')))
  await set(r, {
    title: data.title,
    body: data.body,
    pinned: !!data.pinned,
    ...authorMeta(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `announcements/${r.key}`)
  return r.key
}
export async function updateAnnouncement(id, data) {
  await update(ref(rtdb, nsPath(`announcements/${id}`)), {
    ...data,
    updatedAt: serverTimestamp()
  })
  await logAudit('update', `announcements/${id}`)
}
export async function deleteAnnouncement(id) {
  await remove(ref(rtdb, nsPath(`announcements/${id}`)))
  await logAudit('delete', `announcements/${id}`)
}

// ───────────── 자유게시판 ─────────────
export async function listPosts() {
  const snap = await get(ref(rtdb, nsPath('posts')))
  return toList(snap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
export async function getPost(id) {
  const snap = await get(ref(rtdb, nsPath(`posts/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}
export async function createPost(data) {
  const r = push(ref(rtdb, nsPath('posts')))
  await set(r, {
    title: data.title,
    body: data.body,
    ...authorMeta(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `posts/${r.key}`)
  return r.key
}
export async function updatePost(id, data) {
  await update(ref(rtdb, nsPath(`posts/${id}`)), { ...data, updatedAt: serverTimestamp() })
  await logAudit('update', `posts/${id}`)
}
export async function deletePost(id) {
  await remove(ref(rtdb, nsPath(`posts/${id}`)))
  await logAudit('delete', `posts/${id}`)
}
export async function listComments(postId) {
  const snap = await get(ref(rtdb, nsPath(`posts/${postId}/comments`)))
  return toList(snap).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}
export async function addComment(postId, body) {
  const r = push(ref(rtdb, nsPath(`posts/${postId}/comments`)))
  await set(r, { body, ...authorMeta(), createdAt: serverTimestamp() })
  return r.key
}
export async function deleteComment(postId, commentId) {
  await remove(ref(rtdb, nsPath(`posts/${postId}/comments/${commentId}`)))
}

// ───────────── 사진 게시물 (title/body/tags/images + likes + comments) ─────────────
export async function listPhotoPosts({ tag, matchId } = {}) {
  const snap = await get(ref(rtdb, nsPath('photoPosts')))
  let list = toList(snap)
  if (matchId) list = list.filter((p) => p.matchId === matchId)
  if (tag) list = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag))
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
export async function getPhotoPost(id) {
  const snap = await get(ref(rtdb, nsPath(`photoPosts/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}
export async function createPhotoPost(data) {
  const r = push(ref(rtdb, nsPath('photoPosts')))
  await set(r, {
    title: data.title || '',
    body: data.body || '',
    tags: data.tags || [],
    imageUrls: data.imageUrls || [],
    imagePublicIds: data.imagePublicIds || [],
    matchId: data.matchId || null,
    ...authorMeta(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `photoPosts/${r.key}`)
  return r.key
}
export async function updatePhotoPost(id, data) {
  await update(ref(rtdb, nsPath(`photoPosts/${id}`)), { ...data, updatedAt: serverTimestamp() })
  await logAudit('update', `photoPosts/${id}`)
}
export async function deletePhotoPost(id) {
  await remove(ref(rtdb, nsPath(`photoPosts/${id}`)))
  await logAudit('delete', `photoPosts/${id}`)
}

// 좋아요 (사용자당 1개)
export async function togglePhotoLike(postId) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  const r = ref(rtdb, nsPath(`photoPosts/${postId}/likes/${uid}`))
  const snap = await get(r)
  if (snap.exists()) {
    await remove(r)
    return false
  }
  await set(r, true)
  return true
}

// 댓글
export async function listPhotoComments(postId) {
  const snap = await get(ref(rtdb, nsPath(`photoPosts/${postId}/comments`)))
  return toList(snap).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}
export async function addPhotoComment(postId, body) {
  const r = push(ref(rtdb, nsPath(`photoPosts/${postId}/comments`)))
  await set(r, { body, ...authorMeta(), createdAt: serverTimestamp() })
  return r.key
}
export async function deletePhotoComment(postId, commentId) {
  await remove(ref(rtdb, nsPath(`photoPosts/${postId}/comments/${commentId}`)))
}

// ───────────── (legacy) 단일 사진 ─────────────
export async function listPhotos({ matchId } = {}) {
  const snap = await get(ref(rtdb, nsPath('photos')))
  let list = toList(snap)
  if (matchId) list = list.filter((p) => p.matchId === matchId)
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
export async function createPhoto(data) {
  const r = push(ref(rtdb, nsPath('photos')))
  await set(r, {
    url: data.url,
    publicId: data.publicId || null,
    width: data.width || null,
    height: data.height || null,
    caption: data.caption || '',
    matchId: data.matchId || null,
    ...authorMeta(),
    createdAt: serverTimestamp()
  })
  return r.key
}
export async function deletePhoto(id) {
  await remove(ref(rtdb, nsPath(`photos/${id}`)))
  await logAudit('delete', `photos/${id}`)
}

// ───────────── 매치비 / 회비 ─────────────
const DEFAULT_MATCH_FEE = 4000

export async function listMatchFees(matchId) {
  const snap = await get(ref(rtdb, nsPath(`matchFees/${matchId}`)))
  return snap.val() || {}
}
export async function setMatchFee(matchId, playerId, payment) {
  const r = ref(rtdb, nsPath(`matchFees/${matchId}/${playerId}`))
  if (!payment) await remove(r)
  else await set(r, { ...payment })
  await logAudit('update', `matchFees/${matchId}/${playerId}`, payment)
}

export async function listMonthlyDues(yyyymm) {
  const snap = await get(ref(rtdb, nsPath(`monthlyDues/${yyyymm}`)))
  return snap.val() || {}
}
export async function setMonthlyDues(yyyymm, playerId, payment) {
  const r = ref(rtdb, nsPath(`monthlyDues/${yyyymm}/${playerId}`))
  if (!payment) await remove(r)
  else await set(r, { ...payment })
  await logAudit('update', `monthlyDues/${yyyymm}/${playerId}`, payment)
}

export { DEFAULT_MATCH_FEE }

// ───────────── 시즌 마이그레이션 (연도 단위 분리) ─────────────
// 옛 데이터(예: s2526 "2025-2026 시즌")가 남아 있으면 시즌 드롭다운에
// 한 옵션만 보임. 일시 연도 기준으로 시즌을 새로 만들고 각 경기·선수 통계를 재계산.
export async function migrateSeasonsByYear() {
  const [matchesSnap, playersSnap, seasonsSnap] = await Promise.all([
    get(ref(rtdb, nsPath('matches'))),
    get(ref(rtdb, nsPath('players'))),
    get(ref(rtdb, nsPath('seasons')))
  ])
  const matches = matchesSnap.val() || {}
  const players = playersSnap.val() || {}
  const seasons = seasonsSnap.val() || {}

  // 연도 수집
  const years = new Set()
  for (const m of Object.values(matches)) {
    if (!m.date) continue
    const y = dayjs(m.date).year()
    if (y) years.add(y)
  }
  if (!years.size) throw new Error('경기가 없습니다 — 마이그레이션 불필요')

  const updates = {}
  const currentYear = dayjs().year()

  // 1) 새 시즌 노드 보장 (이름 'YYYY년')
  for (const y of years) {
    const sid = `s${y}`
    updates[nsPath(`seasons/${sid}`)] = {
      name: `${y}년`,
      startDate: dayjs(`${y}-01-01`).valueOf(),
      endDate: dayjs(`${y}-12-31`).valueOf(),
      active: y === currentYear
    }
  }

  // 2) 각 경기 seasonId 재배정
  for (const [mid, m] of Object.entries(matches)) {
    if (!m.date) continue
    const newSid = `s${dayjs(m.date).year()}`
    if (m.seasonId !== newSid) {
      updates[nsPath(`matches/${mid}/seasonId`)] = newSid
    }
  }

  // 3) 선수 통계 재계산 (finished 경기 + events + lineup + momPlayerId)
  const totals = {}      // playerId → totalStats
  const seasonal = {}    // playerId → { sid → stats }
  function bumpT(pid, key, n = 1) {
    if (!totals[pid]) totals[pid] = emptyStats()
    totals[pid][key] += n
  }
  function bumpS(pid, sid, key, n = 1) {
    if (!seasonal[pid]) seasonal[pid] = {}
    if (!seasonal[pid][sid]) seasonal[pid][sid] = emptyStats()
    seasonal[pid][sid][key] += n
  }
  for (const m of Object.values(matches)) {
    if (m.status !== 'finished' || !m.date) continue
    const sid = `s${dayjs(m.date).year()}`
    for (const pid of m.lineup || []) {
      bumpT(pid, 'appearances')
      bumpS(pid, sid, 'appearances')
    }
    for (const e of m.events || []) {
      if (e.type !== 'goal') continue
      bumpT(e.playerId, 'goals')
      bumpS(e.playerId, sid, 'goals')
      if (e.assistPlayerId) {
        bumpT(e.assistPlayerId, 'assists')
        bumpS(e.assistPlayerId, sid, 'assists')
      }
    }
    if (m.momPlayerId) {
      bumpT(m.momPlayerId, 'momCount')
      bumpS(m.momPlayerId, sid, 'momCount')
    }
  }

  for (const pid of Object.keys(players)) {
    // total
    updates[nsPath(`players/${pid}/stats`)] = totals[pid] || emptyStats()
    // 시즌별 — 빈 시즌도 0으로 채워 드롭다운에서 빠지지 않게
    const seasonStats = seasonal[pid] || {}
    for (const y of years) {
      const sid = `s${y}`
      if (!seasonStats[sid]) seasonStats[sid] = emptyStats()
    }
    updates[nsPath(`players/${pid}/seasonStats`)] = seasonStats
  }

  await update(ref(rtdb), updates)

  // 4) 유효하지 않은 옛 시즌 노드 제거 (s{YYYY} 패턴 외)
  const validSids = new Set([...years].map((y) => `s${y}`))
  const legacy = Object.keys(seasons).filter((sid) => !validSids.has(sid))
  for (const sid of legacy) {
    await remove(ref(rtdb, nsPath(`seasons/${sid}`)))
  }

  await logAudit('update', 'seasons/migrate-by-year', {
    years: [...years],
    matches: Object.keys(matches).length,
    legacyRemoved: legacy
  })
  return { years: [...years], legacyRemoved: legacy }
}

// ───────────── 초기 데이터 가져오기 ─────────────
// seed = { seasons, players, matches } 를 dokkaebi/ 하위에 기록.
// allowedEmails/users 는 건드리지 않는다.
export async function importSeed(seed) {
  if (seed.seasons) await set(ref(rtdb, nsPath('seasons')), seed.seasons)
  if (seed.players) await set(ref(rtdb, nsPath('players')), seed.players)
  if (seed.matches) await set(ref(rtdb, nsPath('matches')), seed.matches)
  await logAudit('create', 'seed/import', {
    seasons: Object.keys(seed.seasons || {}).length,
    players: Object.keys(seed.players || {}).length,
    matches: Object.keys(seed.matches || {}).length
  })
}
