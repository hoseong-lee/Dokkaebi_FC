<script setup>
import { computed } from 'vue'
import { SKILL_TAGS, SKILL_TAG_MAP, MASTER_THRESHOLD, topSkills, masterTags } from '@/utils/skills'

const props = defineProps({
  player: { type: Object, required: true },
  seasonId: { type: String, default: null }  // null = 통산
})

const skillTags = computed(() => {
  const p = props.player
  if (!p) return {}
  if (props.seasonId) return p.seasonStats?.[props.seasonId]?.skillTags || {}
  return p.stats?.skillTags || {}
})

const totalEndorsements = computed(() =>
  Object.values(skillTags.value).reduce((sum, n) => sum + (n || 0), 0)
)
const top3 = computed(() => topSkills(skillTags.value, 3))
const masters = computed(() => masterTags(skillTags.value))
const sortedAll = computed(() =>
  SKILL_TAGS
    .map((t) => ({ ...t, count: skillTags.value[t.id] || 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
)
const maxCount = computed(() => Math.max(1, ...sortedAll.value.map((s) => s.count)))
</script>

<template>
  <section v-if="totalEndorsements > 0" class="bg-white rounded-2xl shadow p-6 space-y-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="font-bold text-navy flex items-center gap-2">⭐ 스킬 평판</h2>
        <p class="text-[11px] text-gray-500 mt-0.5">
          경기 후 동료들이 인정한 기술 · 누적 <span class="font-bold text-blue-600">{{ totalEndorsements }}</span> 평가
        </p>
      </div>
      <div v-if="masters.length" class="flex flex-wrap gap-1 justify-end max-w-[60%]">
        <span
          v-for="m in masters" :key="m.id"
          class="text-[10px] px-2 py-0.5 rounded-full ring-1 font-bold"
          :class="m.tone"
          :title="`${m.label} 마스터 (${MASTER_THRESHOLD}회 이상 인정)`"
        >
          🏆 {{ m.icon }} {{ m.label }} 마스터
        </span>
      </div>
    </div>

    <!-- 상위 3 강점 -->
    <div v-if="top3.length">
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">TOP 3 강점</p>
      <div class="space-y-1.5">
        <div v-for="(s, i) in top3" :key="s.id" class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-gray-400 w-5">{{ ['🥇','🥈','🥉'][i] }}</span>
          <span class="text-[11px] px-2 py-1 rounded-full ring-1 font-semibold shrink-0 w-28" :class="s.tone">
            {{ s.icon }} {{ s.label }}
          </span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full" :style="{ width: (s.count / maxCount) * 100 + '%' }"></div>
          </div>
          <span class="text-xs font-bold text-onyx tabular-nums w-12 text-right">{{ s.count }}회</span>
        </div>
      </div>
    </div>

    <!-- 받은 모든 스킬 (3 이하면 표시 안 함, 4 이상이면 펼침) -->
    <details v-if="sortedAll.length > 3" class="text-xs">
      <summary class="cursor-pointer text-gray-500 font-semibold py-1">전체 스킬 분포 ({{ sortedAll.length }}종)</summary>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="s in sortedAll.slice(3)" :key="s.id"
          class="text-[11px] px-2 py-1 rounded-full ring-1 font-semibold"
          :class="s.tone"
        >
          {{ s.icon }} {{ s.label }} <span class="opacity-70">{{ s.count }}</span>
        </span>
      </div>
    </details>

    <p class="text-[10px] text-gray-400 leading-relaxed">
      💡 경기 상세의 ⭐ 투표 탭에서 동료들이 평가합니다. 같은 스킬 {{ MASTER_THRESHOLD }}회 이상 받으면 🏆 마스터.
    </p>
  </section>
</template>
