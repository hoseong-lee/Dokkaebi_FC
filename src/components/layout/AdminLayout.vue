<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// superOnly 가 true 인 메뉴는 슈퍼관리자만 표시
const allLinks = [
  { to: '/admin', label: '대시보드', exact: true },
  { to: '/admin/players', label: '선수 관리' },
  { to: '/admin/matches/new', label: '경기 등록' },
  { to: '/admin/fees', label: '회비 관리' },
  { to: '/admin/allowed-emails', label: '🔒 화이트리스트', superOnly: true },
  { to: '/admin/audit-logs', label: '🔒 변경 이력', superOnly: true }
]
const links = computed(() => allLinks.filter((l) => !l.superOnly || auth.isSuperAdmin))
</script>

<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <span class="text-dokkaebi font-bold">●</span>
      <h1 class="font-bold text-navy">관리자</h1>
      <span
        v-if="auth.isSuperAdmin"
        class="text-[10px] bg-gradient-to-br from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold"
      >👑 슈퍼</span>
    </div>

    <nav class="flex gap-1 overflow-x-auto pb-2 mb-4 border-b">
      <RouterLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="whitespace-nowrap px-3 py-1.5 rounded-t text-sm text-gray-500 hover:text-navy"
        :class="{ 'text-navy font-semibold border-b-2 border-dokkaebi': l.exact ? $route.path === l.to : $route.path.startsWith(l.to) }"
      >
        {{ l.label }}
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>
