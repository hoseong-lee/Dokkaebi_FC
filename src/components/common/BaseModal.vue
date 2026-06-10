<script setup>
import { watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
        @click.self="close"
      >
        <div
          class="bg-white dark:bg-zinc-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col"
        >
          <header
            v-if="title || $slots.header"
            class="flex items-center justify-between px-5 py-3 border-b"
          >
            <slot name="header">
              <h2 class="font-bold text-navy dark:text-zinc-100">{{ title }}</h2>
            </slot>
            <button class="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:text-zinc-400 text-xl leading-none" @click="close">
              ×
            </button>
          </header>
          <div class="px-5 py-4 overflow-y-auto"><slot /></div>
          <footer v-if="$slots.footer" class="px-5 py-3 border-t flex justify-end gap-2">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
