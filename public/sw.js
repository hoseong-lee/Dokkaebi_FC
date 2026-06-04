// 도깨비FC 메인 Service Worker — 정적 자산 캐싱 + 오프라인 fallback
// 빌드 시 캐시 키를 갱신해 새 버전 자동 활성화
const CACHE = 'dokkaebi-v2'
const PRECACHE = [
  '/Dokkaebi_FC/',
  '/Dokkaebi_FC/index.html',
  '/Dokkaebi_FC/manifest.webmanifest',
  '/Dokkaebi_FC/dokkaebi-emblem-192.png',
  '/Dokkaebi_FC/dokkaebi-emblem-512.png',
  '/Dokkaebi_FC/dokkaebi-emblem.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 전략: Firebase API/DB/cdn 은 네트워크 우선, 정적 자산은 캐시 우선
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Firebase / Google API / DiceBear / api-sports / jsdelivr / youtube — 네트워크 우선
  const isExternalApi = /(firebaseio|firebasestorage|googleapis|gstatic|dicebear|api-sports|jsdelivr|youtube|ytimg|cloudinary)/.test(url.hostname)
  if (isExternalApi) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    )
    return
  }

  // 같은 origin 정적 자산 — 캐시 우선 + 백그라운드 갱신
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(req, clone))
        }
        return res
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})

// 알림 클릭 시 해당 페이지로 이동 (FCM SW 와 공유)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.link || '/Dokkaebi_FC/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/Dokkaebi_FC/') && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
