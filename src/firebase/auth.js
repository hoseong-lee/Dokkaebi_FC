import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

export class NotAllowedError extends Error {
  constructor(message = '등록되지 않은 이메일입니다. 관리자에게 문의하세요.') {
    super(message)
    this.name = 'NotAllowedError'
  }
}

// 화이트리스트 검증 후 users 문서 upsert. 반환: { user, role }
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const user = result.user
  const email = user.email.toLowerCase()

  const allowedSnap = await getDoc(doc(db, 'allowedEmails', email))
  if (!allowedSnap.exists() || !allowedSnap.data().active) {
    await fbSignOut(auth)
    throw new NotAllowedError()
  }

  const { role } = allowedSnap.data()

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role,
      lastLoginAt: serverTimestamp()
    },
    { merge: true }
  )

  return { user, role }
}

// 로그인된 사용자의 권한을 화이트리스트에서 재조회 (세션 복원 시 사용)
export async function fetchRole(user) {
  if (!user?.email) return null
  const email = user.email.toLowerCase()
  const allowedSnap = await getDoc(doc(db, 'allowedEmails', email))
  if (!allowedSnap.exists() || !allowedSnap.data().active) return null
  return allowedSnap.data().role
}

export function signOut() {
  return fbSignOut(auth)
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
