<script setup>
import { useConfirm } from '@/composables/useConfirm'
import BaseButton from './BaseButton.vue'

const { state, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="state.open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        @click.self="cancel"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
          <h3 class="font-bold text-navy">{{ state.title }}</h3>
          <p class="text-sm text-gray-600 mt-2 whitespace-pre-line">{{ state.message }}</p>
          <div class="flex gap-2 mt-6">
            <BaseButton variant="secondary" block @click="cancel">{{ state.cancelText }}</BaseButton>
            <BaseButton :variant="state.variant" block @click="accept">
              {{ state.confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
