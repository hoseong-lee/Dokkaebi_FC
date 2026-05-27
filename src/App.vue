<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ToastHost from '@/components/common/ToastHost.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.ensureReady()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <RouterView />
    </main>
    <AppNav />
    <ConfirmDialog />
    <ToastHost />
  </div>
</template>
