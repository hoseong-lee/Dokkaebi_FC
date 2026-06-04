<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const tiles = [
  { to: '/announcements', label: '공지사항', icon: '📢', desc: '팀 공지·일정 안내' },
  { to: '/board', label: '자유게시판', icon: '💬', desc: '회원 소통' },
  { to: '/photos', label: '사진첩', icon: '📷', desc: '경기·일상 사진 공유' },
  { to: '/calendar', label: '달력', icon: '📅', desc: '월간 경기 일정 한눈에' },
  { to: '/hall-of-fame', label: '명예의 전당', icon: '🏆', desc: '시즌별 자동 시상' },
  { to: '/guide', label: '축구 가이드', icon: '⚽', desc: '포지션·포메이션 한눈에' },
  { to: '/squads', label: '스쿼드 메이커', icon: '⚔️', desc: '라인업 저장·재활용·이미지 공유' },
  { to: '/analytics', label: '승률 분석', icon: '📊', desc: '포메이션·선수·상대팀별 인사이트' },
  { to: '/highlights', label: '베스트 골 모음', icon: '🏅', desc: '시즌 명장면 영상 모아보기 + 단톡 공유' },
  { to: '/venues', label: '우리 구장', icon: '🗺', desc: '자주 가는 구장 + 네이버지도 길찾기' },
  { to: '/gps-analysis', label: 'GPS 분석 🚧', icon: '🏃', desc: '경기 GPS 트랙 → 거리/활동범위 (개발중)' }
]
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">더보기</h1>
    <div class="grid grid-cols-2 gap-3">
      <RouterLink
        v-for="t in tiles"
        :key="t.to"
        :to="t.to"
        class="bg-white rounded-2xl shadow-sm p-5 hover:shadow transition-shadow"
      >
        <div class="text-3xl">{{ t.icon }}</div>
        <p class="font-bold text-navy mt-2">{{ t.label }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ t.desc }}</p>
      </RouterLink>
      <RouterLink
        v-if="auth.isAdmin"
        to="/admin"
        class="bg-gradient-to-br from-gold/90 to-gold/70 text-onyx rounded-2xl shadow-sm p-5 hover:shadow transition-shadow"
      >
        <div class="text-3xl">⚙️</div>
        <p class="font-bold mt-2">관리자</p>
        <p class="text-xs opacity-80 mt-1">선수·경기·화이트리스트</p>
      </RouterLink>
    </div>
  </div>
</template>
