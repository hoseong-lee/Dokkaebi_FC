<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.ensureReady()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
