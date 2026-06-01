// 도깨비FC 푸시 알림 트리거 (RTDB onCreate + Scheduled)
// 배포: firebase deploy --only functions
const { onValueCreated } = require('firebase-functions/v2/database')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')
admin.initializeApp()

const RTDB_INSTANCE = 'hosing-5913f-default-rtdb'  // Firebase project DB instance
const APP_URL = 'https://hoseong-lee.github.io/Dokkaebi_FC'

const VOTING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000  // 2주

// 칭찬 태그 라벨 (frontend utils/compliments.js 와 동기화)
const COMPLIMENT_TAG_LABEL = {
  altruistic: '🤝 이타적인 플레이를 해요',
  effort:     '🔥 열심히 해요',
  pass:       '⚽ 패스를 잘해요',
  dribble:    '🏃 드리블을 잘해요',
  stamina:    '💪 체력이 좋아요',
  defense:    '🛡 수비를 잘해요',
  vision:     '👁 시야가 좋아요',
  shot:       '🎯 슛이 좋아요',
  leadership: '👑 리더십이 좋아요'
}

// playerId → uid 역검색 (한 번 fetch + map 캐싱)
async function findUidByPlayerId(playerId, cachedUsers = null) {
  const users = cachedUsers || (await admin.database().ref('dokkaebi/users').get()).val() || {}
  return Object.entries(users).find(([, u]) => u?.playerId === playerId)?.[0] || null
}

// ── 공통: 모든 활성 토큰 수집 ──
async function fetchAllTokens(excludeUid = null) {
  const snap = await admin.database().ref('dokkaebi/fcmTokens').get()
  const data = snap.val() || {}
  const tokens = []
  for (const [uid, tokenMap] of Object.entries(data)) {
    if (excludeUid && uid === excludeUid) continue
    for (const t of Object.values(tokenMap || {})) {
      if (t?.token) tokens.push(t.token)
    }
  }
  return tokens
}

// 죽은 토큰 자동 정리
async function pruneInvalidTokens(responses, tokens) {
  const deletions = []
  responses.forEach((r, i) => {
    if (r.success) return
    const code = r.error?.code || ''
    if (code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token') {
      deletions.push(removeTokenEverywhere(tokens[i]))
    }
  })
  await Promise.allSettled(deletions)
}

async function removeTokenEverywhere(token) {
  const snap = await admin.database().ref('dokkaebi/fcmTokens').get()
  const data = snap.val() || {}
  const updates = {}
  for (const [uid, tokenMap] of Object.entries(data)) {
    for (const [hash, t] of Object.entries(tokenMap || {})) {
      if (t?.token === token) updates[`dokkaebi/fcmTokens/${uid}/${hash}`] = null
    }
  }
  if (Object.keys(updates).length) await admin.database().ref().update(updates)
}

async function sendToTokens(tokens, payload) {
  console.log(`[sendToTokens] target tokens=${tokens.length} title="${payload.title}"`)
  if (!tokens.length) {
    console.warn('[sendToTokens] 발송할 토큰이 0개 — dokkaebi/fcmTokens 에 토큰 등록 안 됨')
    return { successCount: 0, failureCount: 0 }
  }
  const message = {
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: { link: payload.link || APP_URL, ...(payload.data || {}) },
    webpush: {
      fcmOptions: { link: payload.link || APP_URL },
      notification: {
        icon: APP_URL + '/dokkaebi-emblem-192.png',
        badge: APP_URL + '/dokkaebi-emblem-96.png'
      }
    }
  }
  const res = await admin.messaging().sendEachForMulticast(message)
  console.log(`[sendToTokens] result success=${res.successCount} failure=${res.failureCount}`)
  res.responses.forEach((r, i) => {
    if (!r.success) {
      console.warn(`[sendToTokens] token #${i} 실패 code=${r.error?.code} msg=${r.error?.message}`)
    }
  })
  await pruneInvalidTokens(res.responses, tokens)
  return res
}

// ── 1. 새 공지 → 모든 멤버 ──
exports.onAnnouncementCreate = onValueCreated(
  { ref: '/dokkaebi/announcements/{id}', instance: RTDB_INSTANCE },
  async (event) => {
    const a = event.data.val()
    if (!a) return
    const tokens = await fetchAllTokens(a.authorUid)
    await sendToTokens(tokens, {
      title: '📢 ' + (a.title || '새 공지'),
      body: (a.body || '').slice(0, 100),
      link: `${APP_URL}/announcements`
    })
  }
)

// ── 2. 새 경기 → 모든 멤버 (RSVP 요청 포함) ──
exports.onMatchCreate = onValueCreated(
  { ref: '/dokkaebi/matches/{id}', instance: RTDB_INSTANCE },
  async (event) => {
    const m = event.data.val()
    if (!m) return
    const dateStr = m.date ? new Date(m.date).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : ''
    const tokens = await fetchAllTokens()
    await sendToTokens(tokens, {
      title: '📅 새 경기 등록',
      body: `vs ${m.opponent}${dateStr ? ' · ' + dateStr : ''} · 참석 여부 응답해주세요`,
      link: `${APP_URL}/matches/${event.params.id}`
    })
  }
)

// ── 3. 게시판 댓글 → 글 작성자 ──
exports.onPostCommentCreate = onValueCreated(
  { ref: '/dokkaebi/posts/{postId}/comments/{commentId}', instance: RTDB_INSTANCE },
  async (event) => {
    const c = event.data.val()
    if (!c) return
    const postSnap = await admin.database().ref(`dokkaebi/posts/${event.params.postId}`).get()
    const post = postSnap.val()
    if (!post?.authorUid || post.authorUid === c.authorUid) return
    const tokens = await getUserTokens(post.authorUid)
    await sendToTokens(tokens, {
      title: `💬 ${c.authorName || '누군가'}님이 댓글을 남겼어요`,
      body: (c.body || '').slice(0, 100),
      link: `${APP_URL}/board/${event.params.postId}`
    })
  }
)

// ── 4. 사진 댓글 → 글 작성자 ──
exports.onPhotoCommentCreate = onValueCreated(
  { ref: '/dokkaebi/photoPosts/{postId}/comments/{commentId}', instance: RTDB_INSTANCE },
  async (event) => {
    const c = event.data.val()
    if (!c) return
    const postSnap = await admin.database().ref(`dokkaebi/photoPosts/${event.params.postId}`).get()
    const post = postSnap.val()
    if (!post?.authorUid || post.authorUid === c.authorUid) return
    const tokens = await getUserTokens(post.authorUid)
    await sendToTokens(tokens, {
      title: `💬 ${c.authorName || '누군가'}님이 사진에 댓글을 남겼어요`,
      body: (c.body || '').slice(0, 100),
      link: `${APP_URL}/photos/${event.params.postId}`
    })
  }
)

async function getUserTokens(uid) {
  const snap = await admin.database().ref(`dokkaebi/fcmTokens/${uid}`).get()
  const map = snap.val() || {}
  return Object.values(map).map((t) => t?.token).filter(Boolean)
}

// ── 6. 칭찬 작성 → 받은 선수에게 푸시 ──
exports.onComplimentCreate = onValueCreated(
  { ref: '/dokkaebi/matches/{matchId}/compliments/{voterUid}', instance: RTDB_INSTANCE },
  async (event) => {
    const picks = event.data.val()
    if (!picks || typeof picks !== 'object') return
    const voterUid = event.params.voterUid
    const matchId = event.params.matchId

    // voter 이름
    const voterSnap = await admin.database().ref(`dokkaebi/users/${voterUid}`).get()
    const voterName = voterSnap.val()?.displayName || '누군가'

    // users 노드 한 번 fetch (모든 picks 에 재사용)
    const usersSnap = await admin.database().ref('dokkaebi/users').get()
    const users = usersSnap.val() || {}

    for (const [playerId, tags] of Object.entries(picks)) {
      if (!Array.isArray(tags) || !tags.length) continue
      const receiverUid = await findUidByPlayerId(playerId, users)
      if (!receiverUid || receiverUid === voterUid) continue

      const tokens = await getUserTokens(receiverUid)
      if (!tokens.length) continue

      const labels = tags.map((t) => COMPLIMENT_TAG_LABEL[t] || t).join(' · ')
      await sendToTokens(tokens, {
        title: `💝 ${voterName}님이 칭찬했어요`,
        body: labels,
        link: `${APP_URL}/matches/${matchId}`
      })
    }
  }
)

// ── 7. 매일 KST 03:00 — 2주 만료 경기 자동 MOM/칭찬 마감 + 통계 누적 ──
exports.autoFinalizeExpiredVotes = onSchedule(
  { schedule: 'every day 03:00', timeZone: 'Asia/Seoul' },
  async () => {
    const now = Date.now()
    const snap = await admin.database().ref('dokkaebi/matches').get()
    const matches = snap.val() || {}
    const Inc = admin.database.ServerValue.increment

    for (const [matchId, m] of Object.entries(matches)) {
      if (m.votingClosed) continue
      if (m.status !== 'finished') continue  // 결과 미입력 경기 skip
      if (!m.date) continue
      if (now - m.date < VOTING_WINDOW_MS) continue  // 아직 2주 안 됨

      // MOM 자동 선정 (표 가장 많은 선수)
      const votes = m.votes || {}
      const tally = {}
      for (const candidateId of Object.values(votes)) {
        if (!candidateId) continue
        tally[candidateId] = (tally[candidateId] || 0) + 1
      }
      let winnerId = null, maxVotes = 0
      for (const [pid, cnt] of Object.entries(tally)) {
        if (cnt > maxVotes) { maxVotes = cnt; winnerId = pid }
      }

      // 칭찬 집계 — tag totals + tag breakdown
      const compliments = m.compliments || {}
      const totals = {}  // pid → total
      const breakdown = {}  // pid → { tag: count }
      for (const perVoter of Object.values(compliments)) {
        if (!perVoter || typeof perVoter !== 'object') continue
        for (const [pid, tags] of Object.entries(perVoter)) {
          if (!Array.isArray(tags) || !tags.length) continue
          totals[pid] = (totals[pid] || 0) + tags.length
          if (!breakdown[pid]) breakdown[pid] = {}
          for (const t of tags) {
            breakdown[pid][t] = (breakdown[pid][t] || 0) + 1
          }
        }
      }

      const seasonId = m.seasonId
      const updates = {}
      if (winnerId) {
        updates[`dokkaebi/players/${winnerId}/stats/momCount`] = Inc(1)
        if (seasonId) updates[`dokkaebi/players/${winnerId}/seasonStats/${seasonId}/momCount`] = Inc(1)
      }
      for (const [pid, count] of Object.entries(totals)) {
        updates[`dokkaebi/players/${pid}/stats/complimentCount`] = Inc(count)
        if (seasonId) updates[`dokkaebi/players/${pid}/seasonStats/${seasonId}/complimentCount`] = Inc(count)
      }
      for (const [pid, tags] of Object.entries(breakdown)) {
        for (const [tag, count] of Object.entries(tags)) {
          updates[`dokkaebi/players/${pid}/stats/complimentTags/${tag}`] = Inc(count)
          if (seasonId) updates[`dokkaebi/players/${pid}/seasonStats/${seasonId}/complimentTags/${tag}`] = Inc(count)
        }
      }
      updates[`dokkaebi/matches/${matchId}/momPlayerId`] = winnerId
      updates[`dokkaebi/matches/${matchId}/votingClosed`] = true
      updates[`dokkaebi/matches/${matchId}/autoFinalized`] = true
      updates[`dokkaebi/matches/${matchId}/updatedAt`] = admin.database.ServerValue.TIMESTAMP

      await admin.database().ref().update(updates)
      console.log(`[autoFinalize] match ${matchId} → MOM=${winnerId || 'none'}, players=${Object.keys(totals).length}`)

      // 자동 마감 알림 (그 경기 참여자에게)
      if (winnerId) {
        const playerSnap = await admin.database().ref(`dokkaebi/players/${winnerId}`).get()
        const momName = playerSnap.val()?.name || ''
        const tokens = await fetchAllTokens()
        await sendToTokens(tokens, {
          title: '🏆 MOM 자동 확정',
          body: `vs ${m.opponent} · MOM: ${momName}`,
          link: `${APP_URL}/matches/${matchId}`
        })
      }
    }
  }
)

// ── 5-A. 매일 KST 9:00 — D-5 경기 RSVP 미응답자에게 리마인더 ──
exports.rsvpReminderD5 = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'Asia/Seoul' },
  async () => {
    const now = Date.now()
    // 4.5 ~ 5.5 일 후 사이 경기 (애매한 경계 케이스 회피)
    const winStart = now + 4.5 * 24 * 60 * 60 * 1000
    const winEnd = now + 5.5 * 24 * 60 * 60 * 1000

    const snap = await admin.database().ref('dokkaebi/matches').get()
    const matches = snap.val() || {}
    const target = Object.entries(matches)
      .map(([id, m]) => ({ id, ...m }))
      .filter((m) => m.date && m.date >= winStart && m.date < winEnd && m.status !== 'cancelled')

    if (!target.length) return

    // 미응답/미정자 = users 노드의 모든 멤버 - 이미 yes/no 응답한 멤버
    const usersSnap = await admin.database().ref('dokkaebi/users').get()
    const allUids = Object.keys(usersSnap.val() || {})

    for (const m of target) {
      const responded = new Set()
      for (const [uid, r] of Object.entries(m.rsvps || {})) {
        if (r?.status === 'yes' || r?.status === 'no') responded.add(uid)
      }
      const pendingUids = allUids.filter((uid) => !responded.has(uid))
      if (!pendingUids.length) continue

      // 각 미응답자의 토큰 수집
      const tokens = []
      for (const uid of pendingUids) {
        const userTokens = await getUserTokens(uid)
        tokens.push(...userTokens)
      }
      if (!tokens.length) continue

      const t = new Date(m.date).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      await sendToTokens(tokens, {
        title: '📝 참석 여부 응답해주세요',
        body: `5일 후 경기: vs ${m.opponent} · ${t}`,
        link: `${APP_URL}/matches/${m.id}`
      })
    }
  }
)

// ── 5-B. 매일 정해진 시각 — 경기 D-1 알림 (KST 18:00) ──
exports.dailyMatchReminder = onSchedule(
  { schedule: 'every day 18:00', timeZone: 'Asia/Seoul' },
  async () => {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000
    const tomorrowStart = new Date(tomorrow).setHours(0, 0, 0, 0)
    const tomorrowEnd = tomorrowStart + 24 * 60 * 60 * 1000

    const snap = await admin.database().ref('dokkaebi/matches').get()
    const matches = snap.val() || {}
    const upcoming = Object.entries(matches)
      .map(([id, m]) => ({ id, ...m }))
      .filter((m) => m.date && m.date >= tomorrowStart && m.date < tomorrowEnd && m.status !== 'cancelled')

    if (!upcoming.length) return

    const tokens = await fetchAllTokens()
    for (const m of upcoming) {
      const t = new Date(m.date).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      await sendToTokens(tokens, {
        title: '⚽ 내일 도깨비FC 경기!',
        body: `vs ${m.opponent} · ${t}${m.location ? ' · ' + m.location : ''}`,
        link: `${APP_URL}/matches/${m.id}`
      })
    }
  }
)
