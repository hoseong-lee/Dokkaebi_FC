import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loginWithGoogle,
  signOut as fbSignOut,
  watchAuth,
  fetchRole,
  NotAllowedError
} from '@/firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null)
  const ready = ref(false)
  const error = ref('')

  const isAdmin = computed(() => role.value === 'admin')
  const isAuthed = computed(() => !!user.value)

  let readyPromise = null

  // onAuthStateChanged 가 최초 1회 resolve 될 때까지 대기 (라우터 가드용)
  function ensureReady() {
    if (readyPromise) return readyPromise

    readyPromise = new Promise((resolve) => {
      watchAuth(async (fbUser) => {
        if (fbUser) {
          const r = await fetchRole(fbUser)
          if (r) {
            user.value = fbUser
            role.value = r
          } else {
            // 화이트리스트에서 제거/비활성화된 경우 강제 로그아웃
            await fbSignOut()
            user.value = null
            role.value = null
          }
        } else {
          user.value = null
          role.value = null
        }
        ready.value = true
        resolve()
      })
    })
    return readyPromise
  }

  async function login() {
    error.value = ''
    try {
      const { user: u, role: r } = await loginWithGoogle()
      user.value = u
      role.value = r
      return true
    } catch (e) {
      console.error('login error', e)
      if (e instanceof NotAllowedError) {
        error.value = e.message
      } else if (e?.code === 'auth/popup-closed-by-user') {
        error.value = ''
      } else {
        // 원인 코드를 노출해 진단을 돕는다 (예: PERMISSION_DENIED = RTDB 규칙 미배포)
        const detail = e?.code || e?.message || String(e)
        error.value = `로그인 중 오류가 발생했습니다: ${detail}`
      }
      return false
    }
  }

  async function logout() {
    await fbSignOut()
    user.value = null
    role.value = null
  }

  return {
    user,
    role,
    ready,
    error,
    isAdmin,
    isAuthed,
    ensureReady,
    login,
    logout
  }
})
