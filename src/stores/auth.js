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
      if (e instanceof NotAllowedError) {
        error.value = e.message
      } else if (e?.code === 'auth/popup-closed-by-user') {
        error.value = ''
      } else {
        error.value = '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.'
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
