<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div>
    <section class="bg-white rounded-2xl shadow p-6">
      <h1 class="text-xl font-bold text-navy">
        환영합니다, {{ authStore.user?.displayName }}님 👋
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        도깨비 FC 경기 일정과 기록을 확인하세요.
      </p>
    </section>

    <p class="text-center text-gray-400 text-sm mt-10">
      다가오는 경기 · 최근 결과 · 랭킹 TOP 3는 다음 단계에서 구현됩니다.
    </p>
  </div>
</template>
