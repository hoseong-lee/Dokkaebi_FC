import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loginWithGoogle,
  signOut as fbSignOut,
  watchAuth,
  fetchRole,
  NotAllowedError
} from '@/firebase/auth'
import { getUserProfile, linkUserToPlayer } from '@/firebase/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const role = ref(null)
  const profile = ref(null) // users/{uid} 데이터 (playerId 등)
  const ready = ref(false)
  const error = ref('')

  const isAdmin = computed(() => role.value === 'admin')
  const isAuthed = computed(() => !!user.value)
  const myPlayerId = computed(() => profile.value?.playerId || null)

  let readyPromise = null

  async function loadProfile(uid) {
    try {
      profile.value = await getUserProfile(uid)
    } catch (e) {
      console.warn('profile load failed', e)
      profile.value = null
    }
  }

  function ensureReady() {
    if (readyPromise) return readyPromise
    readyPromise = new Promise((resolve) => {
      watchAuth(async (fbUser) => {
        if (fbUser) {
          const r = await fetchRole(fbUser)
          if (r) {
            user.value = fbUser
            role.value = r
            await loadProfile(fbUser.uid)
          } else {
            await fbSignOut()
            user.value = null
            role.value = null
            profile.value = null
          }
        } else {
          user.value = null
          role.value = null
          profile.value = null
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
      await loadProfile(u.uid)
      return true
    } catch (e) {
      console.error('login error', e)
      if (e instanceof NotAllowedError) {
        error.value = e.message
      } else if (e?.code === 'auth/popup-closed-by-user') {
        error.value = ''
      } else {
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
    profile.value = null
  }

  async function linkPlayer(playerId) {
    if (!user.value) throw new Error('not signed in')
    await linkUserToPlayer(user.value.uid, playerId)
    profile.value = { ...(profile.value || {}), playerId: playerId || null }
  }

  return {
    user, role, profile, ready, error,
    isAdmin, isAuthed, myPlayerId,
    ensureReady, login, logout, linkPlayer
  }
})
