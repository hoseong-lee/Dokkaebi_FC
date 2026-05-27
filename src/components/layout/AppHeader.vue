<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const navLinks = [
  { to: '/', label: '홈' },
  { to: '/matches', label: '경기' },
  { to: '/players', label: '선수' },
  { to: '/rankings', label: '랭킹' }
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-navy text-white shadow">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg">
        <span class="text-dokkaebi">⚽</span>
        도깨비 FC
      </RouterLink>

      <nav v-if="authStore.isAuthed" class="hidden sm:flex items-center gap-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 rounded text-sm hover:bg-white/10 transition-colors"
          active-class="bg-white/15"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          v-if="authStore.isAdmin"
          to="/admin"
          class="px-3 py-1.5 rounded text-sm bg-dokkaebi/90 hover:bg-dokkaebi transition-colors"
        >
          관리자
        </RouterLink>
      </nav>

      <div class="flex items-center gap-3">
        <template v-if="authStore.isAuthed">
          <img
            v-if="authStore.user?.photoURL"
            :src="authStore.user.photoURL"
            alt="profile"
            class="w-8 h-8 rounded-full border border-white/30"
            referrerpolicy="no-referrer"
          />
          <button
            class="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            @click="handleLogout"
          >
            로그아웃
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
