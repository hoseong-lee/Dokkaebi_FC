<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '데이터가 없습니다' },
  description: { type: String, default: '' },
  // 다음 행동 유도(CTA) — actionTo(라우터 링크) 또는 @action(클릭)
  actionLabel: { type: String, default: '' },
  actionTo: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<template>
  <div class="text-center py-12 text-gray-400 dark:text-zinc-500">
    <div class="text-4xl mb-2">{{ icon }}</div>
    <p class="font-medium text-gray-500 dark:text-zinc-400">{{ title }}</p>
    <p v-if="description" class="text-sm mt-1 max-w-xs mx-auto leading-relaxed">{{ description }}</p>

    <!-- CTA 버튼 (actionLabel 있을 때) -->
    <div v-if="actionLabel" class="mt-4">
      <RouterLink
        v-if="actionTo"
        :to="actionTo"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
      >{{ actionLabel }}</RouterLink>
      <button
        v-else
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
        @click="$emit('action')"
      >{{ actionLabel }}</button>
    </div>

    <div class="mt-4"><slot /></div>
  </div>
</template>
