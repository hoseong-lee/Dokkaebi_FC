<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '데이터가 없습니다' },
  description: { type: String, default: '' }
})
</script>

<template>
  <div class="text-center py-12 text-gray-400">
    <div class="text-4xl mb-2">{{ icon }}</div>
    <p class="font-medium text-gray-500">{{ title }}</p>
    <p v-if="description" class="text-sm mt-1">{{ description }}</p>
    <div class="mt-4"><slot /></div>
  </div>
</template>
