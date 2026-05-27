import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { ref as dbRef, get, set, serverTimestamp } from 'firebase/database'
import { rtdb, auth } from './config'
import { encodeEmailKey, upsertUser } from './database'

// 부트스트랩 관리자: allowedEmails 가 비어 있어도 항상 로그인/관리 가능.
export const BOOTSTRAP_ADMINS = ['3hosungo@gmail.com']

export class NotAllowedError extends Error {
  constructor(message = '등록되지 않은 이메일입니다. 관리자에게 문의하세요.') {
    super(message)
    this.name = 'NotAllowedError'
  }
}

function isBootstrapAdmin(email) {
  return BOOTSTRAP_ADMINS.includes((email || '').toLowerCase())
}

// 부트스트랩 관리자의 allowedEmails 노드를 보장 (없으면 생성)
async function ensureBootstrapDoc(email) {
  const lower = email.toLowerCase()
  const r = dbRef(rtdb, `allowedEmails/${encodeEmailKey(lower)}`)
  const snap = await get(r)
  if (!snap.exists()) {
    await set(r, {
      email: lower,
      role: 'admin',
      active: true,
      note: '부트스트랩 관리자',
      addedBy: 'system',
      addedAt: serverTimestamp()
    })
  }
}

// 이메일 → role 결정. allowedEmails 우선, 없으면 부트스트랩 관리자 검사.
async function resolveRole(email) {
  const lower = email.toLowerCase()
  const snap = await get(dbRef(rtdb, `allowedEmails/${encodeEmailKey(lower)}`))
  if (snap.exists() && snap.val().active) return snap.val().role
  if (isBootstrapAdmin(lower)) return 'admin'
  return null
}

// 화이트리스트 검증 후 users 노드 upsert. 반환: { user, role }
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  let result
  try {
    result = await signInWithPopup(auth, provider)
  } catch (e) {
    // 모바일/팝업 차단 환경은 redirect 로 폴백 (travel 패턴)
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw e
  }

  const user = result.user
  const email = user.email.toLowerCase()
  const role = await resolveRole(email)
  if (!role) {
    await fbSignOut(auth)
    throw new NotAllowedError()
  }

  if (isBootstrapAdmin(email)) await ensureBootstrapDoc(email)

  await upsertUser(user.uid, {
    email,
    displayName: user.displayName,
    role,
    lastLoginAt: serverTimestamp()
  })

  return { user, role }
}

// 세션 복원 시 권한 재조회
export async function fetchRole(user) {
  if (!user?.email) return null
  return resolveRole(user.email)
}

export function signOut() {
  return fbSignOut(auth)
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
