<script setup>
import { ref, watch } from 'vue'
import { generateSeasonReviewCards, canvasToBlob, downloadBlob } from '@/utils/seasonReview'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  players: { type: Array, required: true },
  matches: { type: Array, required: true },
  seasonId: { type: String, default: null },
  seasonName: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const cards = ref([])    // [{ key, label, canvas }]
const previews = ref([]) // dataURL
const loading = ref(false)
const downloadingAll = ref(false)

async function build() {
  loading.value = true
  try {
    const emblemUrl = (import.meta.env.BASE_URL || '/') + 'dokkaebi-emblem.png'
    const arr = await generateSeasonReviewCards({
      players: props.players,
      matches: props.matches,
      seasonId: props.seasonId,
      seasonName: props.seasonName,
      emblemUrl
    })
    cards.value = arr
    previews.value = arr.map((c) => c.canvas.toDataURL('image/png', 0.7))
  } catch (e) {
    toast.error(`결산 생성 실패: ${e?.message || e}`)
  } finally {
    loading.value = false
  }
}

async function downloadOne(idx) {
  const card = cards.value[idx]
  if (!card) return
  const blob = await canvasToBlob(card.canvas)
  const safe = (props.seasonName || 'season').replace(/[^\w가-힣\s-]/g, '_').trim()
  downloadBlob(blob, `dokkaebi-${safe}-${idx + 1}-${card.key}.png`)
}

async function downloadAll() {
  if (downloadingAll.value) return
  downloadingAll.value = true
  try {
    for (let i = 0; i < cards.value.length; i++) {
      await downloadOne(i)
      // 브라우저 다운로드 매니저 동시 호출 제한 회피
      await new Promise((r) => setTimeout(r, 250))
    }
    toast.success(`${cards.value.length}장 다운로드 완료`)
  } finally {
    downloadingAll.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) build()
  else { cards.value = []; previews.value = [] }
})
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" title="📸 시즌 결산 카드">
    <p class="text-sm text-gray-600 dark:text-zinc-400 mb-3 leading-relaxed">
      <span class="font-semibold text-navy dark:text-zinc-100">{{ seasonName }} 시즌</span>의 1년 결산을 1080×1080 카드로 생성합니다.
      각 카드를 인스타그램·단톡에 바로 공유할 수 있어요.
    </p>

    <div v-if="loading" class="text-center py-12 text-gray-400 dark:text-zinc-500">
      🎨 결산 카드 생성 중...
    </div>

    <div v-else-if="previews.length === 0" class="text-center py-8 text-gray-400 dark:text-zinc-500">
      카드를 불러올 수 없습니다.
    </div>

    <div v-else>
      <div class="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        <div v-for="(p, i) in previews" :key="i" class="space-y-1">
          <div class="aspect-square rounded-lg overflow-hidden bg-navy/5 ring-1 ring-gray-200 dark:ring-zinc-700">
            <img :src="p" class="w-full h-full object-cover" :alt="cards[i]?.label" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-onyx dark:text-zinc-100">{{ i + 1 }}. {{ cards[i]?.label }}</span>
            <button
              type="button"
              class="text-xs text-rose-600 hover:underline"
              @click="downloadOne(i)"
            >📥 다운로드</button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('update:modelValue', false)">닫기</BaseButton>
      <BaseButton
        v-if="cards.length"
        variant="primary"
        :loading="downloadingAll"
        @click="downloadAll"
      >📥 {{ cards.length }}장 모두 받기</BaseButton>
    </template>
  </BaseModal>
</template>
