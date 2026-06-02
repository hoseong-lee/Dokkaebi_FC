<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { usePlayerEndorsements } from '@/composables/usePlayerEndorsements'
import { SKILL_TAGS, SKILL_TAG_MAP, MASTER_THRESHOLD } from '@/utils/skills'

const props = defineProps({
  player: { type: Object, required: true }
})

const auth = useAuthStore()
const toast = useToast()
const { tally, top3, voterCount, masters, saving, save, myPicksForUid } = usePlayerEndorsements(props.player.id)

const myUid = computed(() => auth.user?.uid || null)
const myPicks = computed(() => myPicksForUid(myUid.value))
const localPicks = ref([])
watch(myPicks, (v) => { localPicks.value = [...v] }, { immediate: true })

const isMyself = computed(() => auth.myPlayerId === props.player.id)
const canEndorse = computed(() => !!auth.isAuthed && !isMyself.value)

function isPicked(tagId) { return localPicks.value.includes(tagId) }

async function toggle(tagId) {
  if (!canEndorse.value) return
  const next = isPicked(tagId)
    ? localPicks.value.filter((t) => t !== tagId)
    : [...localPicks.value, tagId]
  const prev = localPicks.value
  localPicks.value = next
  try {
    await save(next)
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
    localPicks.value = prev
  }
}
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-navy flex items-center gap-2">⭐ 스킬 평판</h2>
        <p class="text-[11px] text-gray-500 mt-0.5">
          이 선수가 평소에 잘하는 것 — {{ voterCount }}명이 추천
        </p>
      </div>
      <div v-if="masters.length" class="flex flex-wrap gap-1 justify-end max-w-[60%]">
        <span
          v-for="m in masters" :key="m.id"
          class="text-[10px] px-2 py-0.5 rounded-full ring-1 font-bold"
          :class="m.tone"
          :title="`${m.label} 마스터 (${MASTER_THRESHOLD}명 이상 인정)`"
        >
          🏆 {{ m.icon }} {{ m.label }} 마스터
        </span>
      </div>
    </div>

    <!-- 상위 3개 강조 -->
    <div v-if="top3.length" class="space-y-2">
      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide">TOP 3 강점</p>
      <div class="space-y-1.5">
        <div v-for="(s, i) in top3" :key="s.id" class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-gray-400 w-6">{{ ['🥇','🥈','🥉'][i] }}</span>
          <span class="text-[11px] px-2 py-1 rounded-full ring-1 font-semibold shrink-0 w-32" :class="s.tone">
            {{ s.icon }} {{ s.label }}
          </span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-full bg-rose-500 rounded-full"
              :style="{ width: Math.min(100, (s.count / Math.max(...top3.map(x => x.count))) * 100) + '%' }"
            ></div>
          </div>
          <span class="text-xs font-bold text-onyx tabular-nums w-12 text-right">{{ s.count }}명</span>
        </div>
      </div>
    </div>

    <!-- 안내 -->
    <div v-if="isMyself" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs">
      🪞 본인은 본인 스킬을 추천할 수 없어요. 동료의 프로필에서 추천해주세요.
    </div>
    <div v-else-if="!auth.isAuthed" class="bg-gray-50 text-gray-500 rounded-lg p-3 text-xs">
      로그인 후 스킬 추천이 가능합니다.
    </div>
    <p v-else class="text-xs text-gray-500 leading-relaxed">
      💡 이 선수가 평소에 어떤 점이 좋은지 자유롭게 추천하세요. 인원 제약 없음 · 언제든 ON/OFF.
    </p>

    <!-- 스킬 칩 그리드 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        v-for="t in SKILL_TAGS" :key="t.id"
        type="button"
        class="text-xs px-3 py-2.5 rounded-xl ring-1 font-semibold transition-all flex items-center justify-between disabled:opacity-30 disabled:cursor-not-allowed"
        :class="isPicked(t.id)
          ? t.tone + ' ring-current shadow-sm scale-[1.02]'
          : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50'"
        :disabled="!canEndorse || saving"
        @click="toggle(t.id)"
      >
        <span class="flex items-center gap-1.5">
          <span>{{ t.icon }}</span>
          <span>{{ t.label }}</span>
        </span>
        <span class="text-[10px] tabular-nums" :class="isPicked(t.id) ? 'opacity-90' : 'text-gray-400'">
          {{ tally[t.id] || 0 }}명
        </span>
      </button>
    </div>

    <p class="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
      {{ MASTER_THRESHOLD }}명 이상이 같은 스킬을 추천하면 🏆 마스터 칭호가 표시됩니다
    </p>
  </section>
</template>
