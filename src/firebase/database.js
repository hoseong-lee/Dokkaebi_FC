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
import { canonicalOpponent } from '@/utils/opponentNormalize'
import {
  COMPLIMENT_TAGS,
  COMPLIMENT_TAG_IDS,
  COMPLIMENT_MAX_PLAYERS,
  tallyComplimentTotals,
  tallyComplimentTags
} from '@/utils/compliments'
export { COMPLIMENT_TAGS, COMPLIMENT_MAX_PLAYERS, tallyComplimentTotals as tallyCompliments }

import { SKILL_TAGS, SKILL_TAG_IDS, tallySkillTotals, tallySkillTags } from '@/utils/skills'
export { SKILL_TAGS }

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
  // 삭제 전 통계 차감 — 결과 입력된 경기면 골/어시/출전/MOM 모두 -1 처리
  const snap = await get(ref(rtdb, nsPath(`matches/${id}`)))
  if (snap.exists()) {
    const data = snap.val()
    const seasonId = data.seasonId
    const agg = Array.isArray(data.quarters) && data.quarters.length
      ? aggregateQuarters(data.quarters)
      : { events: data.events || [], lineup: data.lineup || [] }
    const tally = tallyEvents(agg.events)
    const updates = {}
    for (const [pid, t] of Object.entries(tally)) {
      bump(updates, pid, seasonId, 'goals', -(t.goals || 0))
      bump(updates, pid, seasonId, 'assists', -(t.assists || 0))
    }
    for (const pid of agg.lineup) {
      bump(updates, pid, seasonId, 'appearances', -1)
    }
    if (data.momPlayerId) {
      bump(updates, data.momPlayerId, seasonId, 'momCount', -1)
    }
    // 칭찬도 차감 (votingClosed=true 인 경우만, 미확정이면 누적 안 됐으므로 skip)
    if (data.votingClosed) {
      const cTally = tallyComplimentTotals(data.compliments || {})
      const cTagTally = tallyComplimentTags(data.compliments || {})
      for (const [pid, count] of Object.entries(cTally)) {
        bump(updates, pid, seasonId, 'complimentCount', -count)
      }
      for (const [pid, tags] of Object.entries(cTagTally)) {
        for (const [tag, count] of Object.entries(tags)) {
          updates[nsPath(`players/${pid}/stats/complimentTags/${tag}`)] = increment(-count)
          if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/complimentTags/${tag}`)] = increment(-count)
        }
      }
      // 스킬 평가 차감
      const sTagTally = tallySkillTags(data.skillVotes || {})
      for (const [pid, tags] of Object.entries(sTagTally)) {
        for (const [tag, count] of Object.entries(tags)) {
          updates[nsPath(`players/${pid}/stats/skillTags/${tag}`)] = increment(-count)
          if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/skillTags/${tag}`)] = increment(-count)
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb), updates)
    }
  }
  await remove(ref(rtdb, nsPath(`matches/${id}`)))
  await logAudit('delete', `matches/${id}`)
}

// 모든 선수의 stats / seasonStats 를 전체 경기로부터 처음부터 재계산.
// 안전망 / 정정용 (관리자 도구 버튼). 도깨비FC 규모(멤버 ~30, 경기 ~수백)에선 1초 이내.
export async function recomputeAllStats() {
  const [playersSnap, matchesSnap] = await Promise.all([
    get(ref(rtdb, nsPath('players'))),
    get(ref(rtdb, nsPath('matches')))
  ])
  const players = playersSnap.val() || {}
  const matches = matchesSnap.val() || {}

  const acc = {}
  const ensure = (pid) => {
    if (!acc[pid]) acc[pid] = { total: emptyStats(), bySeason: {} }
    return acc[pid]
  }
  const ensureSeason = (pid, sid) => {
    const a = ensure(pid)
    if (!a.bySeason[sid]) a.bySeason[sid] = emptyStats()
    return a.bySeason[sid]
  }

  for (const pid of Object.keys(players)) ensure(pid)

  for (const m of Object.values(matches)) {
    const seasonId = m.seasonId || null
    const agg = Array.isArray(m.quarters) && m.quarters.length
      ? aggregateQuarters(m.quarters)
      : { events: m.events || [], lineup: m.lineup || [] }
    const tally = tallyEvents(agg.events)

    for (const pid of agg.lineup) {
      if (!players[pid]) continue
      ensure(pid).total.appearances += 1
      if (seasonId) ensureSeason(pid, seasonId).appearances += 1
    }
    for (const [pid, t] of Object.entries(tally)) {
      if (!players[pid]) continue
      const a = ensure(pid)
      a.total.goals += t.goals
      a.total.assists += t.assists
      if (seasonId) {
        const s = ensureSeason(pid, seasonId)
        s.goals += t.goals
        s.assists += t.assists
      }
    }
    if (m.momPlayerId && players[m.momPlayerId]) {
      ensure(m.momPlayerId).total.momCount += 1
      if (seasonId) ensureSeason(m.momPlayerId, seasonId).momCount += 1
    }
    // 칭찬도 votingClosed=true 인 경기만 누적
    if (m.votingClosed) {
      const cTally = tallyComplimentTotals(m.compliments || {})
      const cTagTally = tallyComplimentTags(m.compliments || {})
      for (const [pid, count] of Object.entries(cTally)) {
        if (!players[pid]) continue
        ensure(pid).total.complimentCount += count
        if (seasonId) ensureSeason(pid, seasonId).complimentCount += count
      }
      for (const [pid, tags] of Object.entries(cTagTally)) {
        if (!players[pid]) continue
        const a = ensure(pid)
        if (!a.total.complimentTags) a.total.complimentTags = {}
        for (const [tag, count] of Object.entries(tags)) {
          a.total.complimentTags[tag] = (a.total.complimentTags[tag] || 0) + count
        }
        if (seasonId) {
          const s = ensureSeason(pid, seasonId)
          if (!s.complimentTags) s.complimentTags = {}
          for (const [tag, count] of Object.entries(tags)) {
            s.complimentTags[tag] = (s.complimentTags[tag] || 0) + count
          }
        }
      }
      // 스킬 평가 재계산
      const sTagTally = tallySkillTags(m.skillVotes || {})
      for (const [pid, tags] of Object.entries(sTagTally)) {
        if (!players[pid]) continue
        const a = ensure(pid)
        if (!a.total.skillTags) a.total.skillTags = {}
        for (const [tag, count] of Object.entries(tags)) {
          a.total.skillTags[tag] = (a.total.skillTags[tag] || 0) + count
        }
        if (seasonId) {
          const s = ensureSeason(pid, seasonId)
          if (!s.skillTags) s.skillTags = {}
          for (const [tag, count] of Object.entries(tags)) {
            s.skillTags[tag] = (s.skillTags[tag] || 0) + count
          }
        }
      }
    }
  }

  const updates = {}
  for (const [pid, a] of Object.entries(acc)) {
    updates[nsPath(`players/${pid}/stats`)] = a.total
    updates[nsPath(`players/${pid}/seasonStats`)] = a.bySeason
  }
  await update(ref(rtdb), updates)
  await logAudit('update', 'players/stats-recompute', {
    players: Object.keys(acc).length,
    matches: Object.keys(matches).length
  })
  return { players: Object.keys(acc).length, matches: Object.keys(matches).length }
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
  const cu = auth.currentUser
  if (!cu) throw new Error('로그인이 필요합니다.')
  const uid = cu.uid
  const userSnap = await get(ref(rtdb, nsPath(`users/${uid}`)))
  const u = userSnap.val() || {}
  await set(ref(rtdb, nsPath(`matches/${matchId}/rsvps/${uid}`)), {
    uid,
    playerId: u.playerId || null,
    displayName: u.displayName || cu.displayName || 'Guest',
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

// ───────────── 가입 요청 (등록 안 된 사용자 → 관리자 승인 대기) ─────────────
// signupRequests/{uid} = { uid, email, displayName, photoURL, requestedAt }
// 승인 시 allowedEmails 에 추가하고 해당 요청 제거.

export async function listSignupRequests() {
  const snap = await get(ref(rtdb, nsPath('signupRequests')))
  const v = snap.val() || {}
  return Object.entries(v).map(([uid, r]) => ({ uid, ...r }))
    .sort((a, b) => (a.requestedAt || 0) - (b.requestedAt || 0))
}

export async function createSignupRequest(user) {
  if (!user?.uid || !user?.email) throw new Error('invalid user')
  await set(ref(rtdb, nsPath(`signupRequests/${user.uid}`)), {
    uid: user.uid,
    email: user.email.toLowerCase(),
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    requestedAt: serverTimestamp()
  })
}

export async function approveSignupRequest(uid, role = 'member', playerId = null) {
  const snap = await get(ref(rtdb, nsPath(`signupRequests/${uid}`)))
  if (!snap.exists()) throw new Error('가입 요청을 찾을 수 없습니다.')
  const req = snap.val()
  // allowedEmails 에 등록 (active=true)
  await addAllowedEmail(req.email, role, '가입 요청 승인', playerId)
  await remove(ref(rtdb, nsPath(`signupRequests/${uid}`)))
  await logAudit('approve', `signupRequests/${uid}`, { email: req.email, role })
}

export async function rejectSignupRequest(uid) {
  await remove(ref(rtdb, nsPath(`signupRequests/${uid}`)))
  await logAudit('reject', `signupRequests/${uid}`)
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

// 관리자: 투표 마감 + MOM 확정 + 칭찬 점수 확정.
// 통계 diff 반영: 이전 MOM 차감/신규 가산 + 미확정 칭찬 누적
export async function finalizeMomVoting(matchId, winnerId) {
  const snap = await get(ref(rtdb, nsPath(`matches/${matchId}`)))
  if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.')
  const data = snap.val()
  const seasonId = data.seasonId
  const prev = data.momPlayerId || null
  const updates = {}

  // MOM diff
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

  // 칭찬/스킬은 castCompliments / castSkillVotes 가 즉시 reconcile —
  // finalize 는 MOM 확정 + votingClosed 잠금만 담당

  updates[nsPath(`matches/${matchId}/momPlayerId`)] = winnerId || null
  updates[nsPath(`matches/${matchId}/votingClosed`)] = true
  updates[nsPath(`matches/${matchId}/updatedAt`)] = serverTimestamp()
  await update(ref(rtdb), updates)
  await logAudit('update', `matches/${matchId}`, { momFinalized: winnerId })
}

// ───────────── 칭찬 (태그 기반, MOM 외) ─────────────
// 한 사람당 최대 N 명 칭찬, 선수당 칭찬 태그는 자유.
// match.compliments = { voterUid: { playerId: [tag1, tag2, ...] } }
// 매너 점수 = 받은 태그 총 개수 (선수가 5개 태그 받으면 +5)

// 한 voter 의 칭찬을 한 번에 저장. picks = { playerId: [tagId, ...] }
// 빈 배열인 선수는 자동 제거, 빈 객체면 전체 삭제.
// + players.stats.complimentCount / complimentTags 즉시 reconcile (스킬과 동일)
export async function castCompliments(matchId, picks) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')

  // sanitize: 알 수 없는 태그 제거 + 중복 제거 + max 인원 제한
  const cleaned = {}
  const entries = Object.entries(picks || {}).filter(([, tags]) => Array.isArray(tags) && tags.length)
  for (const [pid, tags] of entries.slice(0, COMPLIMENT_MAX_PLAYERS)) {
    const valid = [...new Set(tags.filter((t) => COMPLIMENT_TAG_IDS.includes(t)))]
    if (valid.length) cleaned[pid] = valid
  }

  // 이전 vote 와 diff 계산 — finalize 대기 없이 즉시 반영
  const matchSnap = await get(ref(rtdb, nsPath(`matches/${matchId}`)))
  const matchData = matchSnap.val() || {}
  const seasonId = matchData.seasonId || null
  if (matchData.votingClosed) {
    throw new Error('이미 마감된 경기 — 칭찬을 변경할 수 없습니다.')
  }
  const prev = matchData.compliments?.[uid] || {}

  const updates = {}
  const allPids = new Set([...Object.keys(prev), ...Object.keys(cleaned)])
  for (const pid of allPids) {
    const prevTags = new Set(prev[pid] || [])
    const newTags = new Set(cleaned[pid] || [])
    let countDelta = 0
    // 추가된 태그 +1 (count + tag)
    for (const tag of newTags) {
      if (prevTags.has(tag)) continue
      countDelta += 1
      updates[nsPath(`players/${pid}/stats/complimentTags/${tag}`)] = increment(1)
      if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/complimentTags/${tag}`)] = increment(1)
    }
    // 제거된 태그 -1
    for (const tag of prevTags) {
      if (newTags.has(tag)) continue
      countDelta -= 1
      updates[nsPath(`players/${pid}/stats/complimentTags/${tag}`)] = increment(-1)
      if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/complimentTags/${tag}`)] = increment(-1)
    }
    if (countDelta !== 0) {
      updates[nsPath(`players/${pid}/stats/complimentCount`)] = increment(countDelta)
      if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/complimentCount`)] = increment(countDelta)
    }
  }

  updates[nsPath(`matches/${matchId}/compliments/${uid}`)] = Object.keys(cleaned).length ? cleaned : null

  await update(ref(rtdb), updates)
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

// ───────────── 상대팀명 정규화 마이그레이션 ─────────────
// 같은 팀의 다른 표기(국대FC/FC국대 등)를 캐노니컬 이름으로 통일.
export async function migrateOpponentNames() {
  const snap = await get(ref(rtdb, nsPath('matches')))
  const matches = snap.val() || {}
  const updates = {}
  const changes = []
  for (const [mid, m] of Object.entries(matches)) {
    if (!m.opponent) continue
    const c = canonicalOpponent(m.opponent)
    if (c && c !== m.opponent) {
      updates[nsPath(`matches/${mid}/opponent`)] = c
      changes.push({ id: mid, from: m.opponent, to: c })
    }
  }
  if (Object.keys(updates).length === 0) return { changed: 0, changes: [] }
  await update(ref(rtdb), updates)
  await logAudit('update', 'matches/opponent-normalize', { count: changes.length })
  return { changed: changes.length, changes }
}

// ───────────── 스킬 평가 (경기당 투표) ─────────────
// dokkaebi/matches/{matchId}/skillVotes/{voterUid} = { playerId: [tagId, ...] }
// 매너 칭찬과 동일 패턴 — 그 경기 참여자만, 인원·태그 자유 (관찰한 만큼)
// finalizeMomVoting 시 player.stats.skillTags 누적

export async function castSkillVotes(matchId, picks) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  const cleaned = {}
  for (const [pid, tags] of Object.entries(picks || {})) {
    if (!Array.isArray(tags)) continue
    const valid = [...new Set(tags.filter((t) => SKILL_TAG_IDS.includes(t)))]
    if (valid.length) cleaned[pid] = valid
  }

  // 이전 vote 와 비교 — diff 계산 후 players.stats.skillTags 즉시 reconcile
  // finalize 대기 없이 SkillRadarChart / FIFA 능력치에 즉시 반영
  const matchSnap = await get(ref(rtdb, nsPath(`matches/${matchId}`)))
  const matchData = matchSnap.val() || {}
  const seasonId = matchData.seasonId || null
  // 이미 finalize 된 경기 (votingClosed) 는 보호 — finalize 가 이미 누적함
  if (matchData.votingClosed) {
    throw new Error('이미 마감된 경기 — 투표를 변경할 수 없습니다.')
  }
  const prev = matchData.skillVotes?.[uid] || {}

  const updates = {}
  const allPids = new Set([...Object.keys(prev), ...Object.keys(cleaned)])
  for (const pid of allPids) {
    const prevTags = new Set(prev[pid] || [])
    const newTags = new Set(cleaned[pid] || [])
    // 추가된 태그 — +1
    for (const tag of newTags) {
      if (prevTags.has(tag)) continue
      updates[nsPath(`players/${pid}/stats/skillTags/${tag}`)] = increment(1)
      if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/skillTags/${tag}`)] = increment(1)
    }
    // 제거된 태그 — -1
    for (const tag of prevTags) {
      if (newTags.has(tag)) continue
      updates[nsPath(`players/${pid}/stats/skillTags/${tag}`)] = increment(-1)
      if (seasonId) updates[nsPath(`players/${pid}/seasonStats/${seasonId}/skillTags/${tag}`)] = increment(-1)
    }
  }

  // votes 자체 — 빈 객체면 제거, 아니면 set
  updates[nsPath(`matches/${matchId}/skillVotes/${uid}`)] = Object.keys(cleaned).length ? cleaned : null

  await update(ref(rtdb), updates)
}

// ───────────── 구장 (Venues) — 길찾기/즐겨찾기 ─────────────
import { INITIAL_VENUES } from '@/utils/venues'

export async function listVenues() {
  const snap = await get(ref(rtdb, nsPath('venues')))
  return toList(snap).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || (a.name || '').localeCompare(b.name || ''))
}
export async function getVenue(id) {
  const snap = await get(ref(rtdb, nsPath(`venues/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}
export async function createVenue(data) {
  const r = push(ref(rtdb, nsPath('venues')))
  await set(r, {
    name: (data.name || '').trim().slice(0, 60),
    address: (data.address || '').trim().slice(0, 200) || null,
    lat: data.lat != null ? Number(data.lat) : null,
    lng: data.lng != null ? Number(data.lng) : null,
    type: data.type || 'field',
    notes: (data.notes || '').trim().slice(0, 300) || null,
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `venues/${r.key}`)
  return r.key
}
export async function updateVenue(id, data) {
  const patch = { updatedAt: serverTimestamp() }
  if (data.name !== undefined) patch.name = (data.name || '').trim().slice(0, 60)
  if (data.address !== undefined) patch.address = (data.address || '').trim().slice(0, 200) || null
  if (data.lat !== undefined) patch.lat = data.lat != null ? Number(data.lat) : null
  if (data.lng !== undefined) patch.lng = data.lng != null ? Number(data.lng) : null
  if (data.type !== undefined) patch.type = data.type || 'field'
  if (data.notes !== undefined) patch.notes = (data.notes || '').trim().slice(0, 300) || null
  await update(ref(rtdb, nsPath(`venues/${id}`)), patch)
  await logAudit('update', `venues/${id}`)
}
export async function deleteVenue(id) {
  await remove(ref(rtdb, nsPath(`venues/${id}`)))
  await logAudit('delete', `venues/${id}`)
}

// 구장 사용 횟수 증가 (경기 등록·수정 시 venue 변경 후 호출)
export async function incrementVenueUsage(venueId, delta = 1) {
  if (!venueId) return
  await update(ref(rtdb, nsPath(`venues/${venueId}`)), {
    usageCount: increment(delta)
  })
}

// 기존 경기들 중 venueId 없는데 location 이 venue.name 을 포함하면 자동 연결.
// 매칭된 venue 의 usageCount 도 동시 증가.
export async function autoLinkMatchesToVenues() {
  const [venuesSnap, matchesSnap] = await Promise.all([
    get(ref(rtdb, nsPath('venues'))),
    get(ref(rtdb, nsPath('matches')))
  ])
  const venues = toList(venuesSnap)
  const matches = matchesSnap.val() || {}
  if (!venues.length || !Object.keys(matches).length) return { linked: 0, total: 0 }

  const updates = {}
  const venueDelta = {}  // venueId → usageCount delta
  let linked = 0

  for (const [matchId, m] of Object.entries(matches)) {
    if (m.venueId) continue  // 이미 연결됨
    if (!m.location) continue
    const loc = m.location.trim()
    if (!loc) continue
    // location 이 venue.name 을 포함하거나 venue.name 이 location 을 포함
    const match = venues.find((v) => {
      const vn = (v.name || '').trim()
      if (!vn) return false
      return loc.includes(vn) || vn.includes(loc)
    })
    if (!match) continue

    updates[nsPath(`matches/${matchId}/venueId`)] = match.id
    venueDelta[match.id] = (venueDelta[match.id] || 0) + 1
    linked++
  }

  for (const [vid, delta] of Object.entries(venueDelta)) {
    updates[nsPath(`venues/${vid}/usageCount`)] = increment(delta)
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates)
    await logAudit('update', 'matches/venue-autolink', { linked })
  }

  return { linked, total: Object.keys(matches).length }
}

// 초기 구장 시드 일괄 등록 (중복 방지 — 같은 이름이 이미 있으면 skip)
export async function importInitialVenues() {
  const snap = await get(ref(rtdb, nsPath('venues')))
  const existing = toList(snap)
  const existingNames = new Set(existing.map((v) => v.name))
  let added = 0
  for (const seed of INITIAL_VENUES) {
    if (existingNames.has(seed.name)) continue
    const r = push(ref(rtdb, nsPath('venues')))
    await set(r, {
      ...seed,
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    added++
  }
  await logAudit('create', 'venues/seed-import', { added })
  return { added, skipped: INITIAL_VENUES.length - added }
}

// ───────────── 저장된 스쿼드 (멤버가 만든 라인업, 재활용) ─────────────
export async function listSavedSquads() {
  const snap = await get(ref(rtdb, nsPath('savedSquads')))
  return toList(snap).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
}
export async function getSavedSquad(id) {
  const snap = await get(ref(rtdb, nsPath(`savedSquads/${id}`)))
  return snap.exists() ? { id, ...snap.val() } : null
}
export async function createSavedSquad(data) {
  const r = push(ref(rtdb, nsPath('savedSquads')))
  await set(r, {
    name: (data.name || '이름 없는 스쿼드').slice(0, 40),
    formation: data.formation || '',
    lineup: data.lineup || [],
    positions: data.positions || {},
    notes: (data.notes || '').slice(0, 200) || null,
    isPublic: data.isPublic !== false, // 기본 공개
    ...authorMeta(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await logAudit('create', `savedSquads/${r.key}`)
  return r.key
}
export async function updateSavedSquad(id, data) {
  const patch = {
    updatedAt: serverTimestamp()
  }
  if (data.name !== undefined) patch.name = (data.name || '이름 없는 스쿼드').slice(0, 40)
  if (data.formation !== undefined) patch.formation = data.formation || ''
  if (data.lineup !== undefined) patch.lineup = data.lineup || []
  if (data.positions !== undefined) patch.positions = data.positions || {}
  if (data.notes !== undefined) patch.notes = (data.notes || '').slice(0, 200) || null
  if (data.isPublic !== undefined) patch.isPublic = !!data.isPublic
  await update(ref(rtdb, nsPath(`savedSquads/${id}`)), patch)
  await logAudit('update', `savedSquads/${id}`)
}
export async function deleteSavedSquad(id) {
  await remove(ref(rtdb, nsPath(`savedSquads/${id}`)))
  await logAudit('delete', `savedSquads/${id}`)
}

// 좋아요 (사용자당 1개) — 사진첩 패턴 동일
export async function toggleSquadLike(squadId) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  const r = ref(rtdb, nsPath(`savedSquads/${squadId}/likes/${uid}`))
  const snap = await get(r)
  if (snap.exists()) { await remove(r); return false }
  await set(r, true)
  return true
}

// 이모지 반응 (사용자당 1개 — 이모지 변경 가능 / 같은 거 다시 누르면 해제)
export async function setSquadReaction(squadId, emoji) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  const r = ref(rtdb, nsPath(`savedSquads/${squadId}/reactions/${uid}`))
  if (!emoji) await remove(r)
  else await set(r, emoji)
}

// 댓글
export async function addSquadComment(squadId, body) {
  const text = (body || '').trim().slice(0, 500)
  if (!text) throw new Error('댓글 내용을 입력하세요.')
  const r = push(ref(rtdb, nsPath(`savedSquads/${squadId}/comments`)))
  await set(r, { body: text, ...authorMeta(), createdAt: serverTimestamp() })
  return r.key
}
export async function deleteSquadComment(squadId, commentId) {
  await remove(ref(rtdb, nsPath(`savedSquads/${squadId}/comments/${commentId}`)))
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
