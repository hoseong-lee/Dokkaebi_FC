<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { CLUBS, LEAGUE_LABEL, clubLogo, findClub } from '@/utils/clubs'

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const modalOpen = ref(false)
const search = ref('')
const customInput = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return CLUBS
  return CLUBS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.short.toLowerCase().includes(q) ||
      c.league.toLowerCase() === q
  )
})

const selected = computed(() => findClub(props.modelValue))

function pick(c) {
  emit('update:modelValue', c.name)
  modalOpen.value = false
}
function applyCustom() {
  const v = customInput.value.trim()
  if (!v) return
  emit('update:modelValue', v)
  customInput.value = ''
  modalOpen.value = false
}
function clear() {
  emit('update:modelValue', '')
  modalOpen.value = false
}
</script>

<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center gap-3 border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:bg-zinc-900 transition-colors"
      @click="modalOpen = true"
    >
      <img
        v-if="selected"
        :src="clubLogo(selected.id)"
        :alt="selected.name"
        class="w-7 h-7 object-contain bg-white dark:bg-zinc-800 rounded shrink-0"
        loading="lazy"
      />
      <span v-else class="w-7 h-7 rounded bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 flex items-center justify-center text-sm shrink-0">⚽</span>
      <span class="flex-1 text-left truncate" :class="modelValue ? 'text-gray-800 dark:text-zinc-200' : 'text-gray-400 dark:text-zinc-500'">
        {{ modelValue || '클럽 선택' }}
      </span>
      <span class="text-gray-300 text-xs">변경</span>
    </button>
  </div>

  <BaseModal v-model="modalOpen" title="좋아하는 클럽 선택">
    <div class="space-y-3">
      <input
        v-model="search"
        type="text"
        placeholder="이름·약식·리그(PL/LL/BL...) 검색"
        class="w-full border rounded-lg px-3 py-2 text-sm"
      />

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[420px] overflow-y-auto">
        <button
          v-for="c in filtered"
          :key="c.id"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
          :class="selected?.id === c.id ? 'border-navy bg-navy/5' : 'border-transparent hover:bg-gray-50 dark:bg-zinc-900'"
          @click="pick(c)"
        >
          <img
            :src="clubLogo(c.id)"
            :alt="c.name"
            class="w-14 h-14 object-contain bg-white dark:bg-zinc-800 rounded shrink-0"
            loading="lazy"
          />
          <span class="text-[11px] font-semibold text-center truncate w-full">{{ c.short }}</span>
          <span class="text-[9px] text-gray-400 dark:text-zinc-500">{{ LEAGUE_LABEL[c.league] || c.league }}</span>
        </button>
        <p v-if="filtered.length === 0" class="col-span-full text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
          검색 결과가 없습니다.
        </p>
      </div>

      <div class="pt-3 border-t">
        <p class="text-xs text-gray-500 dark:text-zinc-400 mb-2">목록에 없으면 직접 입력</p>
        <div class="flex gap-2">
          <input
            v-model="customInput"
            type="text"
            maxlength="30"
            placeholder="예: 빌리아레알"
            class="flex-1 border rounded-lg px-3 py-2 text-sm"
            @keyup.enter="applyCustom"
          />
          <BaseButton size="sm" :disabled="!customInput.trim()" @click="applyCustom">적용</BaseButton>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton v-if="modelValue" variant="ghost" @click="clear">✕ 비우기</BaseButton>
      <BaseButton variant="secondary" @click="modalOpen = false">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
