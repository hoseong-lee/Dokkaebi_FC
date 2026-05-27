import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
// 사진 업로드(Storage)는 사용하지 않음 — 필요 시 아래 주석 해제.
// import { getStorage } from 'firebase/storage'

// 기존 개인 프로젝트(hosing-5913f) 재사용 — travel 프로젝트와 동일.
// 웹 API key 는 비밀이 아니며, Authorized domains + RTDB Security Rules 로 보호된다.
// 환경변수(.env.local / GitHub secrets)가 있으면 그것이 우선한다.
const env = import.meta.env
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBPPr7VX6VHXAmx-jRdEjVcZzAbra9EbLs',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'hosing-5913f.firebaseapp.com',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://hosing-5913f-default-rtdb.firebaseio.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'hosing-5913f',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'hosing-5913f.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '445332229155',
  appId: env.VITE_FIREBASE_APP_ID || '1:445332229155:web:eddbe748e4df89769af596'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const rtdb = getDatabase(app)
// export const storage = getStorage(app)
export default app
