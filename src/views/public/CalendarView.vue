<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { dayjs } from '@/utils/date'
import { matchResult, RESULT_COLOR } from '@/utils/match'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const store = useMatchesStore()
const router = useRouter()

const cursor = ref(dayjs())

function shift(n) {
  cursor.value = cursor.value.add(n, 'month')
}
function jumpToToday() {
  cursor.value = dayjs()
}

const monthLabel = computed(() => cursor.value.format('YYYY년 M월'))

// 달력 셀: 월의 첫날 요일부터 6주(42칸) 채움
const cells = computed(() => {
  const start = cursor.value.startOf('month').startOf('week') // 일요일 시작 (Sun=0)
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'))
})

const monthMatches = computed(() => {
  const mStart = cursor.value.startOf('month').valueOf()
  const mEnd = cursor.value.endOf('month').valueOf()
  return store.matches
    .filter((m) => m.date >= mStart && m.date <= mEnd)
    .sort((a, b) => (a.date || 0) - (b.date || 0))
})

function matchesOn(d) {
  const ymd = d.format('YYYY-MM-DD')
  return monthMatches.value.filter((m) => dayjs(m.date).format('YYYY-MM-DD') === ymd)
}

function isCurrentMonth(d) {
  return d.month() === cursor.value.month() && d.year() === cursor.value.year()
}

const todayStr = dayjs().format('YYYY-MM-DD')
function isToday(d) {
  return d.format('YYYY-MM-DD') === todayStr
}

function statusClass(m) {
  if (m.status === 'finished') {
    const r = matchResult(m)
    return RESULT_COLOR[r] || 'bg-gray-200 text-gray-600'
  }
  if (m.status === 'cancelled') return 'bg-gray-200 text-gray-500 line-through'
  return 'bg-navy text-white'
}

function shortLabel(m) {
  if (m.status === 'finished' && m.score?.dokkaebi != null) {
    return `${m.score.dokkaebi}:${m.score.opponent} ${m.opponent}`
  }
  return m.opponent
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

onMounted(() => store.fetchAll())
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-navy">📅 달력</h1>
      <div class="flex items-center gap-1.5">
        <button class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm" @click="shift(-1)">◀</button>
        <button class="px-3 py-1 rounded bg-white shadow-sm text-sm font-semibold" @click="jumpToToday">
          {{ monthLabel }}
        </button>
        <button class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm" @click="shift(1)">▶</button>
      </div>
    </div>

    <LoadingSpinner v-if="store.loading && !store.matches.length" />

    <div class="bg-white rounded-2xl shadow overflow-hidden">
      <div class="grid grid-cols-7 text-xs font-medium border-b">
        <div
          v-for="(d, i) in DAY_LABELS"
          :key="d"
          class="py-2 text-center"
          :class="i === 0 ? 'text-dokkaebi' : i === 6 ? 'text-blue-500' : 'text-gray-500'"
        >{{ d }}</div>
      </div>
      <div class="grid grid-cols-7">
        <div
          v-for="d in cells"
          :key="d.valueOf()"
          class="min-h-[84px] border-r border-b last:border-r-0 p-1.5 text-xs"
          :class="{
            'bg-gray-50': !isCurrentMonth(d),
            'bg-amber-50/40': isToday(d)
          }"
        >
          <div
            class="text-right text-[11px]"
            :class="{
              'text-gray-300': !isCurrentMonth(d),
              'text-dokkaebi font-bold': isCurrentMonth(d) && d.day() === 0,
              'text-blue-500': isCurrentMonth(d) && d.day() === 6,
              'text-gray-700': isCurrentMonth(d) && d.day() !== 0 && d.day() !== 6
            }"
          >
            <span v-if="isToday(d)" class="bg-dokkaebi text-white rounded-full px-1.5 py-0.5">{{ d.date() }}</span>
            <span v-else>{{ d.date() }}</span>
          </div>
          <div class="mt-1 space-y-1">
            <button
              v-for="m in matchesOn(d)"
              :key="m.id"
              class="block w-full text-[10px] px-1.5 py-0.5 rounded truncate text-left"
              :class="statusClass(m)"
              :title="`${m.opponent} ${m.score?.dokkaebi ?? ''}:${m.score?.opponent ?? ''}`"
              @click="router.push(`/matches/${m.id}`)"
            >
              {{ shortLabel(m) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <p v-if="monthMatches.length === 0" class="text-xs text-gray-400 mt-3 text-center">
      이 달엔 경기가 없습니다.
    </p>
    <p v-else class="text-[11px] text-gray-400 mt-3">
      이 달 경기 {{ monthMatches.length }}건 · 카드 클릭 시 상세로 이동
    </p>
  </div>
</template>
