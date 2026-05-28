<script setup>
import { ref, watch } from 'vue'
import { generateResultCard, downloadBlob, shareBlob } from '@/utils/resultCard'
import { usePlayersStore } from '@/stores/players'
import { useToast } from '@/composables/useToast'
import { dayjs } from '@/utils/date'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  match: { type: Object, required: true }
})
const model = defineModel({ type: Boolean, default: false })

const playersStore = usePlayersStore()
const toast = useToast()

const generating = ref(false)
const previewUrl = ref('')
let lastBlob = null

async function build() {
  generating.value = true
  previewUrl.value = ''
  try {
    if (!playersStore.loaded) await playersStore.fetchAll()
    const blob = await generateResultCard(props.match, playersStore.players)
    lastBlob = blob
    previewUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    toast.error(`카드 생성 실패: ${e?.message || e}`)
  } finally {
    generating.value = false
  }
}

watch(model, (open) => { if (open) build() })

function filename() {
  const d = dayjs(props.match.date).format('YYYYMMDD')
  const safeOpp = (props.match.opponent || 'match').replace(/[^\p{L}\p{N}-]+/gu, '_')
  return `dokkaebi_${d}_${safeOpp}.png`
}

function downloadCard() {
  if (!lastBlob) return
  downloadBlob(lastBlob, filename())
  toast.success('이미지를 저장했습니다.')
}

async function shareCard() {
  if (!lastBlob) return
  const ok = await shareBlob(lastBlob, {
    title: '도깨비FC 경기 결과',
    text: `vs ${props.match.opponent} ${props.match.score?.dokkaebi}:${props.match.score?.opponent}`,
    filename: filename()
  })
  if (!ok) toast.info('공유 기능을 지원하지 않는 환경입니다. 다운로드 후 직접 업로드해 주세요.')
}
</script>

<template>
  <BaseModal v-model="model" title="결과 카드">
    <div class="space-y-3">
      <div class="bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
        <div v-if="generating" class="text-sm text-gray-400">생성 중...</div>
        <img v-else-if="previewUrl" :src="previewUrl" alt="결과 카드" class="w-full h-full object-contain" />
      </div>
      <p class="text-[11px] text-gray-500">1080×1080 (인스타그램 정사각). 모바일에서 카톡 공유는 '공유하기' 버튼이 가능한 브라우저에서 동작합니다.</p>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="model = false">닫기</BaseButton>
      <BaseButton variant="ghost" :disabled="!lastBlob" @click="shareCard">공유하기</BaseButton>
      <BaseButton :disabled="!lastBlob" @click="downloadCard">다운로드</BaseButton>
    </template>
  </BaseModal>
</template>
