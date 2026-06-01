<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const items = [
  { to: '/', label: '홈', icon: '🏠', exact: true },
  { to: '/matches', label: '경기', icon: '📅' },
  { to: '/players', label: '선수', icon: '👥' },
  { to: '/rankings', label: '랭킹', icon: '🏆' },
  { to: '/more', label: '더보기', icon: '⋯' }
]
</script>

<template>
  <nav
    v-if="auth.isAuthed"
    class="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t shadow-lg flex"
  >
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] text-gray-400"
      :class="{ 'text-navy font-semibold': item.exact ? $route.path === item.to : $route.path.startsWith(item.to) }"
    >
      <span class="text-lg leading-none">{{ item.icon }}</span>
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
