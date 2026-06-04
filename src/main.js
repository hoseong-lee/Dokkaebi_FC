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
      .then((reg) => {
        // 새 버전 install 감지 → 사용자에게 알림
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing
          if (!sw) return
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              pushToast('🆕 새 버전 준비 완료 — 화면을 새로고침해주세요.', 'info', 8000)
            }
          })
        })
      })
      .catch((e) => console.warn('SW 등록 실패', e))

    // SW controller 교체 시 1회 자동 reload (캐시 stale chunk 즉시 해소)
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    })
  })
}

// 포그라운드 FCM 메시지 → 토스트 + 인앱 알림
onForegroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🔔 도깨비FC'
  const body = payload.notification?.body || payload.data?.body || ''
  pushToast(`${title}\n${body}`.trim(), 'info', 6000)
}).catch(() => {})
