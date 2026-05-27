<script setup>
import { useToast } from '@/composables/useToast'

const { state } = useToast()

const styles = {
  success: 'bg-green-600',
  error: 'bg-dokkaebi',
  info: 'bg-navy'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 inset-x-0 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4">
      <TransitionGroup name="toast">
        <div
          v-for="t in state.items"
          :key="t.id"
          class="text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-sm"
          :class="styles[t.type] || styles.info"
        >
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
