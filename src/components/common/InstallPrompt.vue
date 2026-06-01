<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const DISMISS_KEY = 'dokkaebi.installPrompt.dismissedAt'
const DISMISS_DAYS = 7
const emblemSrc = import.meta.env.BASE_URL + 'dokkaebi-emblem-192.png'

// 상태
const deferredEvent = ref(null) // Android beforeinstallprompt 이벤트
const iosShow = ref(false)       // iOS 수동 가이드 표시 여부
const installing = ref(false)

const isStandalone = computed(() =>
  typeof window !== 'undefined' && (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator?.standalone === true
  )
)

const isIOS = computed(() => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPhone/iPad/iPod + iOS 13+ iPad 의 Mac-pretend
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
})

// 안드로이드 자동 prompt 사용 가능 / iOS 수동 가이드 표시 필요
const show = computed(() => {
  if (!auth.isAuthed) return false
  if (isStandalone.value) return false
  if (recentlyDismissed()) return false
  return !!deferredEvent.value || iosShow.value
})

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (!at) return false
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch { return false }
}

function dismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
  deferredEvent.value = null
  iosShow.value = false
}

async function install() {
  if (!deferredEvent.value) return
  installing.value = true
  try {
    deferredEvent.value.prompt()
    await deferredEvent.value.userChoice
    // 결과와 무관하게 prompt 한 번 쓰면 재사용 X
    deferredEvent.value = null
  } finally {
    installing.value = false
  }
}

onMounted(() => {
  if (isStandalone.value) return

  // Android Chrome / Edge / Samsung Internet
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredEvent.value = e
  })

  // iOS Safari: 이벤트 없으므로 수동 표시
  if (isIOS.value && !recentlyDismissed()) {
    iosShow.value = true
  }

  // 설치 완료 후 정리
  window.addEventListener('appinstalled', () => {
    deferredEvent.value = null
    iosShow.value = false
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="install">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
        style="padding-bottom: calc(env(safe-area-inset-bottom) + 16px);"
      >
        <div class="pointer-events-auto max-w-sm mx-auto bg-white rounded-2xl shadow-2xl ring-1 ring-gray-200 overflow-hidden">
          <!-- 헤더 -->
          <div class="flex items-center gap-3 p-4 bg-gradient-to-r from-navy to-navy/90 text-white">
            <img
              :src="emblemSrc"
              alt=""
              class="w-12 h-12 rounded-full ring-2 ring-gold/80"
            />
            <div class="flex-1 min-w-0">
              <p class="font-bold text-base leading-tight">⚽ 도깨비FC 앱 설치</p>
              <p class="text-[11px] text-gold/90 mt-0.5">홈 화면에 추가하고 알림 받기</p>
            </div>
            <button
              type="button"
              class="text-white/70 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center"
              @click="dismiss"
              aria-label="닫기"
            >×</button>
          </div>

          <!-- 본문 — Android (자동 설치 가능) -->
          <div v-if="deferredEvent" class="p-4 space-y-3">
            <p class="text-sm text-onyx leading-relaxed">
              앱처럼 설치하면 <span class="font-semibold text-navy">홈 화면 아이콘</span>으로 빠르게 열고
              <span class="font-semibold text-navy">알림</span>을 받을 수 있어요.
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
                @click="dismiss"
              >나중에</button>
              <button
                type="button"
                class="flex-1 px-4 py-2.5 rounded-lg bg-navy hover:bg-navy/90 text-white text-sm font-bold transition-colors disabled:opacity-50"
                :disabled="installing"
                @click="install"
              >📲 {{ installing ? '설치 중...' : '앱 설치' }}</button>
            </div>
          </div>

          <!-- 본문 — iOS (수동 가이드) -->
          <div v-else class="p-4 space-y-3">
            <p class="text-sm text-onyx leading-relaxed">
              <span class="font-semibold text-navy">iOS 는 자동 설치가 안 됩니다.</span>
              아래 순서로 홈 화면에 추가해 주세요:
            </p>
            <ol class="text-sm text-onyx space-y-1.5 pl-1">
              <li class="flex items-start gap-2">
                <span class="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">1</span>
                <span>Safari 하단 <span class="inline-block px-1.5 py-0.5 bg-gray-100 rounded font-mono text-xs">공유 ↑</span> 버튼 탭</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>스크롤 → <span class="font-semibold">홈 화면에 추가</span> 탭</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center">3</span>
                <span>우측 상단 <span class="font-semibold">추가</span> 탭</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">!</span>
                <span class="text-amber-700">홈 화면 도깨비 아이콘으로 다시 열어야 알림이 작동합니다.</span>
              </li>
            </ol>
            <button
              type="button"
              class="w-full px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
              @click="dismiss"
            >알겠습니다</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.install-enter-active,
.install-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.install-enter-from,
.install-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
</style>
