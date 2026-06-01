// Firebase Cloud Messaging — 클라이언트 헬퍼
// 권한 요청 → 토큰 발급 → RTDB 저장 → 포그라운드 onMessage 리스너
import app from './config'
import { getMessaging, getToken, onMessage, deleteToken, isSupported } from 'firebase/messaging'
import { ref as dbRef, set, remove, serverTimestamp } from 'firebase/database'
import { rtdb, auth } from './config'

// ⚠️ Firebase Console → 프로젝트 설정 → Cloud Messaging → 웹 푸시 인증서에서 발급
// 사용자 셋업 필요. 임시 placeholder (운영자가 .env 또는 직접 교체).
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

const SW_PATH = '/Dokkaebi_FC/firebase-messaging-sw.js'
const SW_SCOPE = '/Dokkaebi_FC/'

let cachedMessaging = null

export async function isPushSupported() {
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  try { return await isSupported() } catch { return false }
}

export async function getMessagingInstance() {
  if (cachedMessaging) return cachedMessaging
  if (!(await isPushSupported())) return null
  cachedMessaging = getMessaging(app)
  return cachedMessaging
}

// 알림 권한 상태: 'granted' | 'denied' | 'default' | 'unsupported'
export function notificationPermissionState() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

// FCM SW 등록 (이미 등록되어 있으면 재사용)
export async function registerMessagingSW() {
  if (!('serviceWorker' in navigator)) return null
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE)
  if (existing && existing.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
    return existing
  }
  return navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE })
}

// 권한 요청 → 토큰 발급 → RTDB 저장. 성공 시 token, 실패 시 null
export async function enablePushForCurrentUser() {
  if (!VAPID_KEY) {
    throw new Error('VAPID 키가 설정되지 않았습니다. 관리자에게 문의하세요.')
  }
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인 후 다시 시도하세요.')

  const supported = await isPushSupported()
  if (!supported) throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다. (iOS 는 홈 화면에 추가 후 가능)')

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    throw new Error(perm === 'denied' ? '알림 권한이 거부되었습니다. 브라우저 설정에서 변경하세요.' : '알림 권한이 필요합니다.')
  }

  const registration = await registerMessagingSW()
  const messaging = await getMessagingInstance()
  if (!messaging) throw new Error('Messaging 인스턴스를 초기화할 수 없습니다.')

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration
  })
  if (!token) throw new Error('토큰 발급에 실패했습니다. 다시 시도하세요.')

  // RTDB 저장 — 한 사용자 = 여러 디바이스 가능. tokenHash 키 사용.
  const tokenHash = await sha256Short(token)
  await set(dbRef(rtdb, `dokkaebi/fcmTokens/${uid}/${tokenHash}`), {
    token,
    userAgent: navigator.userAgent.slice(0, 200),
    savedAt: serverTimestamp()
  })
  return token
}

export async function disablePushForCurrentUser() {
  const uid = auth.currentUser?.uid
  if (!uid) return
  try {
    const messaging = await getMessagingInstance()
    if (messaging) {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (token) {
        await deleteToken(messaging)
        const tokenHash = await sha256Short(token)
        await remove(dbRef(rtdb, `dokkaebi/fcmTokens/${uid}/${tokenHash}`))
      }
    }
    // 안전망: 사용자별 전체 토큰 제거 (다른 디바이스 토큰도)
    // → 의도적 미적용. 한 디바이스에서 끈다고 다른 디바이스까지 끄는 건 과함.
  } catch {
    // 무시 — 토큰이 이미 없어도 OK
  }
}

// 포그라운드(앱 열려 있을 때) 푸시 → 콜백
export async function onForegroundMessage(handler) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, handler)
}

async function sha256Short(text) {
  try {
    const buf = new TextEncoder().encode(text)
    const hash = await crypto.subtle.digest('SHA-256', buf)
    const hex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex.slice(0, 16)
  } catch {
    // fallback — 토큰의 마지막 16자
    return text.slice(-16).replace(/[^a-zA-Z0-9]/g, '_')
  }
}
