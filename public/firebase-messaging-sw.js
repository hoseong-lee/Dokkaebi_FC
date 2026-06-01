// Firebase Cloud Messaging — 백그라운드 푸시 전용 SW
// 앱이 닫혀있거나 백그라운드일 때 푸시를 받아 시스템 알림으로 표시.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBPPr7VX6VHXAmx-jRdEjVcZzAbra9EbLs',
  authDomain: 'hosing-5913f.firebaseapp.com',
  projectId: 'hosing-5913f',
  storageBucket: 'hosing-5913f.firebasestorage.app',
  messagingSenderId: '445332229155',
  appId: '1:445332229155:web:eddbe748e4df89769af596'
})

const messaging = firebase.messaging()

// 백그라운드 푸시 수신 → 시스템 알림 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '도깨비FC'
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/Dokkaebi_FC/dokkaebi-emblem-192.png',
    badge: '/Dokkaebi_FC/dokkaebi-emblem-96.png',
    image: payload.notification?.image,
    tag: payload.data?.tag || 'dokkaebi',
    data: {
      link: payload.data?.link || '/Dokkaebi_FC/',
      ...payload.data
    },
    vibrate: [120, 60, 120],
    requireInteraction: false
  }
  self.registration.showNotification(title, options)
})

// 알림 클릭 → 해당 페이지 열기 (sw.js 와 동일)
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
