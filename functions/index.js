// 도깨비FC 푸시 알림 트리거 (RTDB onCreate + Scheduled)
// 배포: firebase deploy --only functions
const { onValueCreated } = require('firebase-functions/v2/database')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')
admin.initializeApp()

const RTDB_INSTANCE = 'hosing-5913f-default-rtdb'  // Firebase project DB instance
const APP_URL = 'https://hoseong-lee.github.io/Dokkaebi_FC'

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
