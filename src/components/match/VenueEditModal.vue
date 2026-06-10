<script setup>
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useVenuesStore } from '@/stores/venues'
import { useToast } from '@/composables/useToast'
import { VENUE_TYPE_LABEL, isValidCoord } from '@/utils/venues'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  venue: { type: Object, default: null }  // null 이면 신규
})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useVenuesStore()
const toast = useToast()
const saving = ref(false)

const form = ref(emptyForm())
function emptyForm() {
  return { name: '', address: '', lat: '', lng: '', type: 'field', notes: '' }
}

const isEdit = computed(() => !!props.venue)
const coordOK = computed(() => isValidCoord(form.value.lat, form.value.lng))

watch(() => props.modelValue, (open) => {
  if (open) {
    if (props.venue) {
      form.value = {
        name: props.venue.name || '',
        address: props.venue.address || '',
        lat: props.venue.lat != null ? String(props.venue.lat) : '',
        lng: props.venue.lng != null ? String(props.venue.lng) : '',
        type: props.venue.type || 'field',
        notes: props.venue.notes || ''
      }
    } else {
      form.value = emptyForm()
    }
  }
}, { immediate: true })

async function save() {
  if (!form.value.name.trim()) return toast.error('이름을 입력하세요.')
  saving.value = true
  try {
    const data = {
      name: form.value.name,
      address: form.value.address,
      lat: form.value.lat !== '' ? Number(form.value.lat) : null,
      lng: form.value.lng !== '' ? Number(form.value.lng) : null,
      type: form.value.type,
      notes: form.value.notes
    }
    if (isEdit.value) {
      await store.update(props.venue.id, data)
      toast.success('구장을 수정했습니다.')
    } else {
      await store.create(data)
      toast.success('구장을 등록했습니다.')
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="isEdit ? '구장 수정' : '구장 등록'"
  >
    <div class="space-y-3">
      <div>
        <label class="block text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1">이름 *</label>
        <input v-model="form.name" type="text" maxlength="60" placeholder="예: 다락원체육공원" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1">종류</label>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="(label, key) in VENUE_TYPE_LABEL" :key="key"
            type="button"
            class="text-xs px-3 py-1.5 rounded-full transition-colors"
            :class="form.type === key ? 'bg-navy text-white font-bold' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'"
            @click="form.type = key"
          >{{ label }}</button>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1">주소</label>
        <input v-model="form.address" type="text" maxlength="200" placeholder="예: 서울 도봉구 창포원로 45" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p class="text-xs text-amber-800 font-semibold mb-2">📍 좌표 (네이버지도/카카오맵에서 우클릭 → "좌표 복사")</p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] text-amber-700 mb-0.5">위도 (lat)</label>
            <input v-model="form.lat" type="text" placeholder="37.6896" class="w-full border rounded-lg px-2 py-1.5 text-sm font-mono" />
          </div>
          <div>
            <label class="block text-[10px] text-amber-700 mb-0.5">경도 (lng)</label>
            <input v-model="form.lng" type="text" placeholder="127.0464" class="w-full border rounded-lg px-2 py-1.5 text-sm font-mono" />
          </div>
        </div>
        <p v-if="form.lat || form.lng" class="text-[10px] mt-1.5" :class="coordOK ? 'text-emerald-700' : 'text-rose-600'">
          {{ coordOK ? '✓ 좌표 유효' : '⚠ 좌표 형식이 올바르지 않습니다' }}
        </p>
      </div>

      <div>
        <label class="block text-xs text-gray-500 dark:text-zinc-400 font-semibold mb-1">메모 (선택)</label>
        <textarea v-model="form.notes" rows="2" maxlength="300" placeholder="예: 주차 가능 / 샤워실 OK / 야간 조명" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      <details class="bg-gray-50 dark:bg-zinc-900 rounded-lg p-2.5">
        <summary class="text-xs text-gray-600 dark:text-zinc-400 cursor-pointer font-semibold">💡 좌표 찾는 법</summary>
        <ol class="text-[11px] text-gray-600 dark:text-zinc-400 space-y-1 mt-2 pl-3">
          <li>1. <a href="https://map.naver.com" target="_blank" class="text-emerald-700 underline">네이버지도</a> 또는 <a href="https://map.kakao.com" target="_blank" class="text-yellow-700 underline">카카오맵</a> 접속</li>
          <li>2. 구장 검색 → 정확한 위치 클릭</li>
          <li>3. 마우스 우클릭 → <span class="font-semibold">"이 위치 좌표 보기"</span> 또는 <span class="font-semibold">"좌표 복사"</span></li>
          <li>4. 위도/경도 위 입력란에 붙여넣기</li>
        </ol>
      </details>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('update:modelValue', false)">취소</BaseButton>
      <BaseButton variant="primary" :loading="saving" @click="save">
        {{ isEdit ? '수정 저장' : '등록' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
