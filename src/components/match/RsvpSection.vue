<script setup>
import { useRsvp } from '@/composables/useRsvp'
import { useToast } from '@/composables/useToast'
import RsvpButtons from './RsvpButtons.vue'

const props = defineProps({ matchId: { type: String, required: true } })

const { loading, saving, myRsvp, grouped, respond } = useRsvp(props.matchId)
const toast = useToast()

async function onRespond(status) {
  try {
    await respond(status)
    toast.success('참석 여부를 저장했습니다.')
  } catch {
    toast.error('저장 중 오류가 발생했습니다.')
  }
}

const groups = [
  { key: 'attending', label: '참석', color: 'text-green-600' },
  { key: 'maybe', label: '미정', color: 'text-amber-500' },
  { key: 'declined', label: '불참', color: 'text-dokkaebi' }
]
</script>

<template>
  <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-6">
    <h2 class="font-bold text-navy dark:text-zinc-100 mb-3">참석 여부</h2>

    <RsvpButtons :current="myRsvp?.status" :saving="saving" @respond="onRespond" />

    <div v-if="!loading" class="mt-5 space-y-3">
      <div v-for="g in groups" :key="g.key">
        <div class="flex items-center gap-2 text-sm mb-1">
          <span class="font-semibold" :class="g.color">{{ g.label }}</span>
          <span class="text-xs text-gray-400 dark:text-zinc-500">{{ grouped[g.key].length }}명</span>
        </div>
        <div v-if="grouped[g.key].length" class="flex flex-wrap gap-1.5">
          <span
            v-for="r in grouped[g.key]"
            :key="r.uid"
            class="text-xs bg-gray-100 dark:bg-zinc-700 rounded-full px-2.5 py-1"
          >
            {{ r.displayName }}
            <span v-if="r.note" class="text-gray-400 dark:text-zinc-500">· {{ r.note }}</span>
          </span>
        </div>
        <p v-else class="text-xs text-gray-300">없음</p>
      </div>
    </div>
  </section>
</template>
