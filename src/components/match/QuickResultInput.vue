<script setup>
import { computed } from 'vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const props = defineProps({
  players: { type: Array, required: true } // 후보 선수 전체
})

const lineup = defineModel('lineup', { default: () => [] })
const events = defineModel('events', { default: () => [] })
const momPlayerId = defineModel('momPlayerId', { default: null })
const opponentScore = defineModel('opponentScore', { default: 0 })

const lineupPlayers = computed(() =>
  lineup.value.map((id) => props.players.find((p) => p.id === id)).filter(Boolean)
)

const dokkaebiScore = computed(() => events.value.filter((e) => e.type === 'goal').length)

function name(id) {
  return props.players.find((p) => p.id === id)?.name || ''
}

function toggleLineup(id) {
  const i = lineup.value.indexOf(id)
  if (i === -1) {
    lineup.value = [...lineup.value, id]
  } else {
    lineup.value = lineup.value.filter((x) => x !== id)
    // 출전 제외 시 관련 이벤트/MOM 정리
    events.value = events.value.filter((e) => e.playerId !== id && e.assistPlayerId !== id)
    if (momPlayerId.value === id) momPlayerId.value = null
  }
}

function addGoal() {
  if (lineupPlayers.value.length === 0) return
  events.value = [
    ...events.value,
    { minute: 0, type: 'goal', playerId: lineupPlayers.value[0].id, assistPlayerId: null }
  ]
}

function removeEvent(idx) {
  events.value = events.value.filter((_, i) => i !== idx)
}
</script>

<template>
  <div class="space-y-5">
    <!-- 스코어 -->
    <div class="bg-navy text-white rounded-xl p-4 flex items-center justify-center gap-4">
      <span class="flex-1 text-right font-bold">도깨비</span>
      <span class="text-3xl font-bold tabular-nums">{{ dokkaebiScore }}</span>
      <span class="text-xl">:</span>
      <input
        :value="opponentScore"
        type="number"
        min="0"
        class="w-14 text-center text-3xl font-bold bg-white/10 rounded tabular-nums"
        @input="opponentScore = Math.max(0, Number($event.target.value) || 0)"
      />
      <span class="flex-1 font-bold">상대</span>
    </div>
    <p class="text-xs text-gray-400 text-center -mt-3">
      도깨비 득점은 골 기록 수로 자동 계산됩니다.
    </p>

    <!-- 출전 명단 -->
    <div>
      <h3 class="text-sm font-bold text-navy mb-2">출전 명단 (탭하여 선택)</h3>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        <button
          v-for="p in players"
          :key="p.id"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
          :class="lineup.includes(p.id) ? 'border-navy bg-navy/5' : 'border-transparent bg-gray-50'"
          @click="toggleLineup(p.id)"
        >
          <PlayerAvatar :player="p" :size="40" />
          <span class="text-[11px] truncate w-full text-center">{{ p.name }}</span>
        </button>
      </div>
    </div>

    <!-- 골 기록 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold text-navy">골 기록</h3>
        <button
          type="button"
          class="text-xs px-3 py-1 rounded-full bg-dokkaebi text-white disabled:opacity-40"
          :disabled="lineupPlayers.length === 0"
          @click="addGoal"
        >
          + 골 추가
        </button>
      </div>

      <p v-if="events.length === 0" class="text-xs text-gray-400 py-2">
        기록된 골이 없습니다. 출전 선수를 먼저 선택한 뒤 골을 추가하세요.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="(ev, idx) in events"
          :key="idx"
          class="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm"
        >
          <input
            v-model.number="ev.minute"
            type="number"
            min="0"
            class="w-12 border rounded px-1.5 py-1 text-center text-xs"
            placeholder="분"
          />
          <span class="text-xs text-gray-400">⚽</span>
          <select v-model="ev.playerId" class="flex-1 border rounded px-2 py-1 text-xs">
            <option v-for="p in lineupPlayers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <span class="text-xs text-gray-400">↳</span>
          <select v-model="ev.assistPlayerId" class="flex-1 border rounded px-2 py-1 text-xs">
            <option :value="null">도움 없음</option>
            <option
              v-for="p in lineupPlayers"
              :key="p.id"
              :value="p.id"
              :disabled="p.id === ev.playerId"
            >
              {{ p.name }}
            </option>
          </select>
          <button type="button" class="text-gray-400 hover:text-dokkaebi px-1" @click="removeEvent(idx)">
            ×
          </button>
        </li>
      </ul>
    </div>

    <!-- MOM -->
    <div>
      <h3 class="text-sm font-bold text-navy mb-2">⭐ MOM (선택)</h3>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in lineupPlayers"
          :key="p.id"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs transition-colors"
          :class="momPlayerId === p.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'"
          @click="momPlayerId = momPlayerId === p.id ? null : p.id"
        >
          {{ p.name }}
        </button>
        <span v-if="lineupPlayers.length === 0" class="text-xs text-gray-400 py-1.5">
          출전 선수를 먼저 선택하세요.
        </span>
      </div>
    </div>
  </div>
</template>
