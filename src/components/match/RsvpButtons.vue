<script setup>
const props = defineProps({
  current: { type: String, default: null }, // attending | maybe | declined
  saving: { type: Boolean, default: false }
})
const emit = defineEmits(['respond'])

const options = [
  { key: 'attending', label: '참석', icon: '✅', active: 'bg-green-600 text-white' },
  { key: 'maybe', label: '미정', icon: '🤔', active: 'bg-amber-500 text-white' },
  { key: 'declined', label: '불참', icon: '❌', active: 'bg-dokkaebi text-white' }
]
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <button
      v-for="o in options"
      :key="o.key"
      type="button"
      class="flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
      :class="current === o.key ? o.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      :disabled="saving"
      @click="emit('respond', o.key)"
    >
      <span class="text-lg">{{ o.icon }}</span>
      {{ o.label }}
    </button>
  </div>
</template>
