<script setup>
const props = defineProps({
  current: { type: String, default: null }, // attending | maybe | declined
  saving: { type: Boolean, default: false }
})
const emit = defineEmits(['respond'])

const options = [
  { key: 'attending', label: '참석', icon: '✅', active: 'bg-green-600 text-white ring-2 ring-green-300 scale-[1.03]' },
  { key: 'maybe', label: '미정', icon: '🤔', active: 'bg-amber-500 text-white ring-2 ring-amber-300 scale-[1.03]' },
  { key: 'declined', label: '불참', icon: '❌', active: 'bg-dokkaebi text-white ring-2 ring-rose-300 scale-[1.03]' }
]
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="o in options"
      :key="o.key"
      type="button"
      class="flex flex-col items-center justify-center gap-1 py-4 min-h-[68px] rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
      :class="current === o.key ? o.active : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-600'"
      :disabled="saving"
      :aria-pressed="current === o.key"
      @click="emit('respond', o.key)"
    >
      <span class="text-2xl">{{ o.icon }}</span>
      <span>{{ o.label }}</span>
    </button>
  </div>
</template>
