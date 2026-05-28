<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  const ok = await authStore.login()
  loading.value = false
  if (ok) {
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : '/')
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
      <img
        src="/Dokkaebi_FC/dokkaebi-emblem-192.png"
        alt="DOKKEBY FC"
        class="w-24 h-24 mx-auto mb-3 rounded-full ring-2 ring-gold/60 shadow"
      />
      <h1 class="text-2xl font-bold text-onyx tracking-wide">도깨비 FC</h1>
      <p class="text-xs text-gold font-semibold tracking-[0.3em] mt-1">DOKKEBY FOOTBALL CLUB</p>
      <p class="text-sm text-gray-500 mt-3 mb-8">
        등록된 회원만 로그인할 수 있습니다.
      </p>

      <button
        class="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
        :disabled="loading"
        @click="handleLogin"
      >
        <svg class="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.4 35.9 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/>
        </svg>
        {{ loading ? '로그인 중...' : 'Google로 로그인' }}
      </button>

      <p v-if="authStore.error" class="mt-4 text-sm text-dokkaebi">
        {{ authStore.error }}
      </p>
    </div>
  </div>
</template>
