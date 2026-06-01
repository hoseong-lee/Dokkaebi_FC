import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { onForegroundMessage } from './firebase/messaging'
import { pushToast } from './composables/useToast'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 메인 Service Worker 등록 (정적 자산 캐싱 + 오프라인)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .catch((e) => console.warn('SW 등록 실패', e))
  })
}

// 포그라운드 FCM 메시지 → 토스트 + 인앱 알림
onForegroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🔔 도깨비FC'
  const body = payload.notification?.body || payload.data?.body || ''
  pushToast(`${title}\n${body}`.trim(), 'info', 6000)
}).catch(() => {})
