<script setup>
defineProps({
  label: { type: String, default: '' },
  size: { type: Number, default: 32 }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-10 text-gray-400 dark:text-zinc-500">
    <svg
      class="animate-spin text-navy dark:text-zinc-100"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <span v-if="label" class="text-sm">{{ label }}</span>
  </div>
</template>
