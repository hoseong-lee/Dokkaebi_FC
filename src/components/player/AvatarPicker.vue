<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import { SAMPLE_AVATARS } from '@/utils/sampleAvatars'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/utils/cloudinary'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  current: { type: String, default: '' },
  name: { type: String, default: '' }
})
const emit = defineEmits(['select'])

const sampleOpen = ref(false)
const genderTab = ref('male')
const uploading = ref(false)
const fileInput = ref(null)
const toast = useToast()
const configured = isCloudinaryConfigured()

const filtered = computed(() => SAMPLE_AVATARS.filter((a) => a.gender === genderTab.value))

function pick(url) {
  emit('select', url)
  sampleOpen.value = false
}
function clear() { emit('select', '') }
function triggerUpload() { fileInput.value?.click() }

async function onPick(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!configured) {
    toast.error('Cloudinary 설정이 필요합니다.')
    e.target.value = ''
    return
  }
  uploading.value = true
  try {
    const up = await uploadToCloudinary(file, { folder: 'dokkaebi/avatars' })
    emit('select', up.url)
    toast.success('업로드 완료')
  } catch (err) {
    toast.error(`업로드 실패: ${err.message || err}`)
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <PlayerAvatar :player="{ name, photoURL: current }" :size="64" />
    <div class="flex flex-wrap gap-1.5">
      <BaseButton type="button" size="sm" variant="secondary" @click="sampleOpen = true">
        🎨 샘플 선택
      </BaseButton>
      <BaseButton type="button" size="sm" variant="secondary" :loading="uploading" :disabled="!configured" @click="triggerUpload">
        📁 직접 업로드
      </BaseButton>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPick" />
      <BaseButton v-if="current" type="button" size="sm" variant="ghost" @click="clear">
        ✕ 비우기
      </BaseButton>
    </div>
  </div>

  <BaseModal v-model="sampleOpen" title="샘플 아바타 (도깨비FC 유니폼)">
    <div class="flex bg-gray-100 rounded-lg p-0.5 mb-3 text-sm">
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="genderTab === 'male' ? 'bg-navy text-white font-semibold' : 'text-gray-500'"
        @click="genderTab = 'male'"
      >👨 남자</button>
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="genderTab === 'female' ? 'bg-dokkaebi text-white font-semibold' : 'text-gray-500'"
        @click="genderTab = 'female'"
      >👩 여자</button>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="a in filtered"
        :key="a.id"
        type="button"
        class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
        :class="current === a.url ? 'border-navy bg-navy/5' : 'border-transparent hover:bg-gray-50'"
        @click="pick(a.url)"
      >
        <img
          :src="a.url"
          :alt="a.label"
          class="w-20 h-20 rounded-full bg-gradient-to-br from-onyx to-gray-800"
          loading="lazy"
        />
        <span class="text-[10px] text-gray-500">{{ a.label }}</span>
      </button>
    </div>
    <p class="text-[11px] text-gray-400 mt-3">
      DiceBear 무료 아바타 · 검정 유니폼 통일. 추가 아바타가 필요하면 요청해주세요.
    </p>
    <template #footer>
      <BaseButton variant="secondary" @click="sampleOpen = false">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
