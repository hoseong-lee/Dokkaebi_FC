<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useToast } from '@/composables/useToast'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, castSkillVotes } from '@/firebase/database'
import { SKILL_TAGS, SKILL_TAG_MAP, tallySkillTags } from '@/utils/skills'
import { isVotingPeriodExpired } from '@/utils/match'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({ match: { type: Object, required: true } })
const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()

const map = ref({})       // { voterUid: { playerId: [tag, ...] } }
const saving = ref(false)
const unsub = onValue(
  dbRef(rtdb, nsPath(`matches/${props.match.id}/skillVotes`)),
  (snap) => { map.value = snap.val() || {} },
  () => {}
)
onUnmounted(() => unsub())

const candidates = computed(() =>
  (props.match.lineup || []).map((id) => playersStore.getById(id)).filter(Boolean)
)
const myUid = computed(() => auth.user?.uid || null)
const myPicks = computed(() => (myUid.value ? (map.value[myUid.value] || {}) : {}))
const localPicks = ref({})
watch(myPicks, (v) => { localPicks.value = JSON.parse(JSON.stringify(v || {})) }, { immediate: true })

const eligible = computed(() => {
  const pid = auth.myPlayerId
  if (!pid) return false
  return (props.match.lineup || []).includes(pid)
})
const expired = computed(() => isVotingPeriodExpired(props.match))
const closed = computed(() => !!props.match.votingClosed || expired.value)
const totalVoters = computed(() => Object.keys(map.value).length)
const tagBreakdown = computed(() => tallySkillTags(map.value))

function isPickedTag(pid, tagId) {
  return (localPicks.value[pid] || []).includes(tagId)
}

async function toggleTag(pid, tagId) {
  if (!eligible.value) return toast.error('이 경기에 참여한 선수만 평가할 수 있습니다.')
  if (expired.value) return toast.error('경기 후 2주가 지나 평가가 종료되었습니다.')
  if (closed.value) return
  if (pid === auth.myPlayerId) return  // 본인 제외

  const prev = JSON.parse(JSON.stringify(localPicks.value))
  const current = localPicks.value[pid] ? [...localPicks.value[pid]] : []
  const idx = current.indexOf(tagId)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(tagId)

  if (current.length) {
    localPicks.value = { ...localPicks.value, [pid]: current }
  } else {
    const { [pid]: _, ...rest } = localPicks.value
    localPicks.value = rest
  }
  saving.value = true
  try {
    await castSkillVotes(props.match.id, localPicks.value)
    // DB 의 players.stats.skillTags 가 atomic update 됐으므로
    // 클라이언트 캐시도 새로 fetch — SkillRadarChart 즉시 갱신
    await playersStore.fetchAll(true)
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
    localPicks.value = prev
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold text-navy">⭐ 스킬 평가</h2>
      <span class="text-xs text-gray-400">{{ totalVoters }}명 참여</span>
    </div>

    <p v-if="match.votingClosed" class="text-xs text-gray-500 mb-3">
      스킬 평가가 마감되었습니다. 받은 태그가 누적 평판으로 더해졌어요.
    </p>
    <p v-else-if="expired" class="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-3">
      ⏰ 경기 후 2주가 지나 평가가 종료되었습니다.
    </p>
    <p v-else-if="!eligible" class="text-xs text-gray-500 mb-3">
      <template v-if="!auth.myPlayerId">먼저 "내 선수 연결"에서 본인 선수를 지정하세요.</template>
      <template v-else>이 경기에 참여한 선수만 평가할 수 있습니다.</template>
    </p>
    <p v-else class="text-xs text-gray-500 mb-3 leading-relaxed">
      이 경기에서 동료가 어떤 기술/능력을 보여줬는지 자유롭게 평가하세요.
      <br>인원·태그 제약 없음 · 자기 자신 제외 · 누적되어 평판이 됩니다.
    </p>

    <!-- 태그 범례 -->
    <div class="flex flex-wrap gap-1 mb-4 pb-3 border-b border-gray-100">
      <span
        v-for="t in SKILL_TAGS" :key="t.id"
        class="text-[10px] px-1.5 py-0.5 rounded-full ring-1"
        :class="t.tone"
      >
        {{ t.icon }} {{ t.label }}
      </span>
    </div>

    <!-- 선수 리스트 -->
    <ul class="space-y-3">
      <li
        v-for="c in candidates" :key="c.id"
        class="p-3 rounded-xl transition-colors"
        :class="(localPicks[c.id] || []).length ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'"
      >
        <div class="flex items-center gap-3 mb-2">
          <PlayerAvatar :player="c" :size="36" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-onyx truncate">
              {{ c.name }}
              <span v-if="c.id === auth.myPlayerId" class="text-[10px] text-gray-400 font-normal">(나)</span>
            </p>
            <div v-if="tagBreakdown[c.id] && Object.keys(tagBreakdown[c.id]).length" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="(count, tag) in tagBreakdown[c.id]" :key="tag"
                class="text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-600 ring-1 ring-gray-200"
                :title="SKILL_TAG_MAP[tag]?.label"
              >
                {{ SKILL_TAG_MAP[tag]?.icon }} {{ count }}
              </span>
            </div>
          </div>
          <span class="text-sm font-bold text-blue-600 tabular-nums shrink-0">
            ⭐ {{ Object.values(tagBreakdown[c.id] || {}).reduce((s, n) => s + n, 0) }}
          </span>
        </div>

        <!-- 태그 칩 — 본인이 아니고 마감 전 -->
        <div v-if="!closed && c.id !== auth.myPlayerId" class="flex flex-wrap gap-1.5">
          <button
            v-for="t in SKILL_TAGS" :key="t.id"
            type="button"
            class="text-xs px-2.5 py-1 rounded-full font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            :class="isPickedTag(c.id, t.id) ? t.tone + ' ring-1 ring-current scale-105 shadow-sm' : 'bg-white text-gray-500 ring-1 ring-gray-200'"
            :disabled="!eligible || saving"
            @click="toggleTag(c.id, t.id)"
          >
            {{ t.icon }} {{ t.label }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
