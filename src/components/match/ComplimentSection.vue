<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useMatchCompliments } from '@/composables/useMatchCompliments'
import { useToast } from '@/composables/useToast'
import { COMPLIMENT_TAGS, COMPLIMENT_TAG_MAP, COMPLIMENT_MAX_PLAYERS } from '@/utils/compliments'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({ match: { type: Object, required: true } })
const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()
const { map, totals, tagBreakdown, totalVoters, saving, save } = useMatchCompliments(props.match.id)

const candidates = computed(() =>
  (props.match.lineup || [])
    .map((id) => playersStore.getById(id))
    .filter(Boolean)
)

const myUid = computed(() => auth.user?.uid || null)
const myPicks = computed(() => (myUid.value ? (map.value[myUid.value] || {}) : {}))

// 로컬 ref — { pid: [tagId, ...] }
const localPicks = ref({})
watch(myPicks, (v) => { localPicks.value = JSON.parse(JSON.stringify(v || {})) }, { immediate: true })

const eligible = computed(() => {
  const pid = auth.myPlayerId
  if (!pid) return false
  return (props.match.lineup || []).includes(pid)
})
const closed = computed(() => !!props.match.votingClosed)

const myPickedPlayerCount = computed(() =>
  Object.values(localPicks.value).filter((tags) => Array.isArray(tags) && tags.length).length
)

function isPickedTag(pid, tagId) {
  return (localPicks.value[pid] || []).includes(tagId)
}

async function toggleTag(pid, tagId) {
  if (!eligible.value) return toast.error('이 경기에 참여한 선수만 칭찬할 수 있습니다.')
  if (closed.value) return
  if (pid === auth.myPlayerId) return  // 본인 제외

  const prev = JSON.parse(JSON.stringify(localPicks.value))
  const current = localPicks.value[pid] ? [...localPicks.value[pid]] : []
  const idx = current.indexOf(tagId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    // 새로 선수 추가 시 최대 인원 체크
    const newlyAdded = current.length === 0
    if (newlyAdded && myPickedPlayerCount.value >= COMPLIMENT_MAX_PLAYERS) {
      return toast.error(`최대 ${COMPLIMENT_MAX_PLAYERS}명까지 칭찬할 수 있어요.`)
    }
    current.push(tagId)
  }
  // local 반영 (빈 배열은 키 제거)
  if (current.length) {
    localPicks.value = { ...localPicks.value, [pid]: current }
  } else {
    const { [pid]: _, ...rest } = localPicks.value
    localPicks.value = rest
  }
  try {
    await save(localPicks.value)
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
    localPicks.value = prev
  }
}

// 상위 순위 (마감 후 강조용)
const ranking = computed(() => {
  return Object.entries(totals.value)
    .map(([pid, count]) => ({ pid, count }))
    .sort((a, b) => b.count - a.count)
})
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold text-navy">💝 칭찬합니다</h2>
      <span class="text-xs text-gray-400">{{ totalVoters }}명 참여</span>
    </div>

    <p v-if="closed" class="text-xs text-gray-500 mb-3">
      칭찬 투표가 마감되었습니다. 받은 태그 개수가 매너 점수로 누적됐어요.
    </p>
    <p v-else-if="!eligible" class="text-xs text-gray-500 mb-3">
      <template v-if="!auth.myPlayerId">먼저 헤더의 "내 선수 연결"에서 본인 선수를 지정하세요.</template>
      <template v-else>이 경기에 참여한 선수만 칭찬할 수 있습니다.</template>
    </p>
    <p v-else class="text-xs text-gray-500 mb-3 leading-relaxed">
      좋은 플레이를 보여준 동료에게 어떤 점이 인상적이었는지 태그로 골라주세요.
      <br>
      최대 <span class="font-bold text-navy">{{ COMPLIMENT_MAX_PLAYERS }}명</span> · 자기 자신 제외 · 한 명에게 여러 태그 가능
    </p>

    <!-- 태그 범례 -->
    <div class="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-gray-100">
      <span
        v-for="t in COMPLIMENT_TAGS" :key="t.id"
        class="text-[10px] px-2 py-0.5 rounded-full ring-1"
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
        :class="(localPicks[c.id] || []).length ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-gray-50'"
      >
        <div class="flex items-center gap-3 mb-2">
          <span v-if="closed && ranking[0]?.pid === c.id && ranking[0]?.count > 0" class="text-amber-500 text-lg">🏅</span>
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
                :title="COMPLIMENT_TAG_MAP[tag]?.label"
              >
                {{ COMPLIMENT_TAG_MAP[tag]?.icon }} {{ count }}
              </span>
            </div>
          </div>
          <span class="text-sm font-bold text-rose-600 tabular-nums shrink-0">
            💝 {{ totals[c.id] || 0 }}
          </span>
        </div>

        <!-- 태그 칩 — 본인이 아니고 마감 전일 때만 클릭 가능 -->
        <div v-if="!closed && c.id !== auth.myPlayerId" class="flex flex-wrap gap-1.5">
          <button
            v-for="t in COMPLIMENT_TAGS" :key="t.id"
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

    <p v-if="!closed && eligible" class="text-[11px] text-gray-400 mt-3 text-right">
      칭찬한 선수: <span class="font-bold text-rose-600">{{ myPickedPlayerCount }}</span>/{{ COMPLIMENT_MAX_PLAYERS }}
    </p>
  </section>
</template>
