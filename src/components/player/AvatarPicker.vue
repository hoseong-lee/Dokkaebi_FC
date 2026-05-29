<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import { SAMPLE_AVATARS } from '@/utils/sampleAvatars'
import { ANIMAL_AVATARS } from '@/utils/animalAvatars'
import { CLUBS, clubLogo, LEAGUE_LABEL } from '@/utils/clubs'
import { uploadToCloudinary, isCloudinaryConfigured } from '@/utils/cloudinary'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  current: { type: String, default: '' },
  name: { type: String, default: '' }
})
const emit = defineEmits(['select'])

const sampleOpen = ref(false)
const tab = ref('male') // male | female | animal | club
const uploading = ref(false)
const fileInput = ref(null)
const toast = useToast()
const configured = isCloudinaryConfigured()

const peopleFiltered = computed(() => SAMPLE_AVATARS.filter((a) => a.gender === tab.value))

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

  <BaseModal v-model="sampleOpen" title="프로필 사진 선택">
    <!-- 4탭: 남자 / 여자 / 동물 / 클럽 -->
    <div class="flex bg-gray-100 rounded-lg p-0.5 mb-3 text-xs">
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="tab === 'male' ? 'bg-navy text-white font-semibold' : 'text-gray-500'"
        @click="tab = 'male'"
      >👨 남자</button>
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="tab === 'female' ? 'bg-dokkaebi text-white font-semibold' : 'text-gray-500'"
        @click="tab = 'female'"
      >👩 여자</button>
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="tab === 'animal' ? 'bg-amber-500 text-white font-semibold' : 'text-gray-500'"
        @click="tab = 'animal'"
      >🐯 동물</button>
      <button
        type="button"
        class="flex-1 py-1.5 rounded-md transition-colors"
        :class="tab === 'club' ? 'bg-emerald-600 text-white font-semibold' : 'text-gray-500'"
        @click="tab = 'club'"
      >⚽ 클럽</button>
    </div>

    <!-- 남/여 — DiceBear 캐릭터 -->
    <div v-if="tab === 'male' || tab === 'female'" class="grid grid-cols-3 gap-3">
      <button
        v-for="a in peopleFiltered"
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

    <!-- 동물 — twemoji SVG -->
    <div v-else-if="tab === 'animal'" class="grid grid-cols-3 gap-3">
      <button
        v-for="a in ANIMAL_AVATARS"
        :key="a.id"
        type="button"
        class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
        :class="current === a.url ? 'border-amber-500 bg-amber-50' : 'border-transparent hover:bg-gray-50'"
        @click="pick(a.url)"
      >
        <div class="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
          <img :src="a.url" :alt="a.label" class="w-14 h-14" loading="lazy" />
        </div>
        <span class="text-[10px] text-gray-500">{{ a.emoji }} {{ a.label }}</span>
      </button>
    </div>

    <!-- 클럽 — api-sports CDN -->
    <div v-else-if="tab === 'club'" class="grid grid-cols-3 gap-3">
      <button
        v-for="c in CLUBS"
        :key="c.id"
        type="button"
        class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
        :class="current === clubLogo(c.id) ? 'border-emerald-600 bg-emerald-50' : 'border-transparent hover:bg-gray-50'"
        @click="pick(clubLogo(c.id))"
      >
        <div class="w-20 h-20 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center p-2">
          <img :src="clubLogo(c.id)" :alt="c.name" class="w-full h-full object-contain" loading="lazy" />
        </div>
        <span class="text-[10px] text-gray-500 text-center leading-tight">
          {{ c.short }}
          <span class="block text-[9px] opacity-60">{{ LEAGUE_LABEL[c.league] }}</span>
        </span>
      </button>
    </div>

    <p class="text-[11px] text-gray-400 mt-3">
      <template v-if="tab === 'male' || tab === 'female'">DiceBear 무료 아바타 · 검정 유니폼 통일.</template>
      <template v-else-if="tab === 'animal'">Twemoji 동물 이모지 (Twitter, CC-BY 4.0).</template>
      <template v-else-if="tab === 'club'">api-sports.io CDN · 유럽 주요 클럽 24팀.</template>
    </p>
    <template #footer>
      <BaseButton variant="secondary" @click="sampleOpen = false">닫기</BaseButton>
    </template>
  </BaseModal>
</template>
