<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatDateTime, dDay } from '@/utils/date'
import {
  MATCH_TYPE_LABEL,
  matchResult,
  RESULT_LABEL,
  RESULT_COLOR
} from '@/utils/match'

const props = defineProps({
  match: { type: Object, required: true }
})

const result = computed(() => matchResult(props.match))
const isFinished = computed(() => props.match.status === 'finished')
const isCancelled = computed(() => props.match.status === 'cancelled')
const dday = computed(() => (props.match.status === 'scheduled' ? dDay(props.match.date) : ''))
</script>

<template>
  <RouterLink
    :to="`/matches/${match.id}`"
    class="block bg-white rounded-xl shadow-sm p-4 hover:shadow transition-shadow"
    :class="{ 'opacity-60': isCancelled }"
  >
    <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
      <span class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {{ MATCH_TYPE_LABEL[match.type] || match.type }}
        </span>
        <span
          v-if="dday && dday !== '종료'"
          class="px-2 py-0.5 rounded-full bg-dokkaebi/10 text-dokkaebi font-bold"
        >
          {{ dday }}
        </span>
      </span>
      <span>{{ formatDateTime(match.date) }}</span>
    </div>

    <div class="flex items-center justify-center gap-4 py-1">
      <span class="flex-1 text-right font-bold text-navy">도깨비 FC</span>
      <span v-if="isFinished" class="text-lg font-bold tabular-nums">
        {{ match.score.dokkaebi }} : {{ match.score.opponent }}
      </span>
      <span v-else-if="isCancelled" class="text-sm text-gray-400">취소됨</span>
      <span v-else class="text-sm text-gray-400">vs</span>
      <span class="flex-1 font-bold text-gray-700">{{ match.opponent }}</span>
    </div>

    <div class="flex items-center justify-between mt-2 text-xs">
      <span class="text-gray-400 truncate">📍 {{ match.location || '장소 미정' }}</span>
      <span
        v-if="result"
        class="px-2 py-0.5 rounded-full font-bold"
        :class="RESULT_COLOR[result]"
      >
        {{ RESULT_LABEL[result] }}
      </span>
    </div>
  </RouterLink>
</template>
