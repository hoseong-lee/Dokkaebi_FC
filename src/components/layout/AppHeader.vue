<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LinkPlayerModal from './LinkPlayerModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const emblemSrc = import.meta.env.BASE_URL + 'dokkaebi-emblem-192.png'
const linkOpen = ref(false)

const navLinks = [
  { to: '/', label: '홈' },
  { to: '/matches', label: '경기' },
  { to: '/players', label: '선수' },
  { to: '/rankings', label: '랭킹' },
  { to: '/announcements', label: '공지' },
  { to: '/board', label: '게시판' },
  { to: '/photos', label: '사진첩' }
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-onyx text-white shadow border-b border-gold/30">
    <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-2 font-bold text-lg">
        <img
          :src="emblemSrc"
          alt="DOKKEBY FC"
          class="w-8 h-8 rounded-full ring-1 ring-gold/40"
        />
        <span class="tracking-wide">도깨비 FC</span>
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
          class="px-3 py-1.5 rounded text-sm bg-gold/90 text-onyx font-semibold hover:bg-gold transition-colors"
        >
          관리자
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2">
        <template v-if="authStore.isAuthed">
          <button
            class="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            :title="authStore.myPlayerId ? '내 선수 연결됨' : '내 선수 연결'"
            @click="linkOpen = true"
          >
            <span v-if="authStore.myPlayerId" class="text-gold">★ 내 선수</span>
            <span v-else>내 선수 연결</span>
          </button>
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
    <LinkPlayerModal v-model="linkOpen" />
  </header>
</template>
