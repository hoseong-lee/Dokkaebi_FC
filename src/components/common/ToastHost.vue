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
    <!--
      모바일: 하단 네비(높이 ≈ 56px) 위에 + iOS safe-area 회피 → bottom 20 + safe-area inset
      데스크탑(sm+): 하단 우측 코너
      위쪽 표시는 iOS PWA 다이나믹 아일랜드와 겹쳐서 하단으로 이동
    -->
    <div
      class="fixed z-[70] flex flex-col items-center gap-2 pointer-events-none px-4
             inset-x-0 bottom-20 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto sm:px-0"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
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
  transform: translateY(8px);
}
</style>
