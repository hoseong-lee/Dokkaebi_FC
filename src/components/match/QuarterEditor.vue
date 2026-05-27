<script setup>
import { ref, computed } from 'vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import FormationPitch from '@/components/match/FormationPitch.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { FORMATION_NAMES, getSlots } from '@/utils/formations'

const props = defineProps({
  quarter: { type: Object, required: true }, // { opponentScore, lineup, events, formation, positions }
  players: { type: Array, required: true }
})

const q = props.quarter

const lineupPlayers = computed(() =>
  (q.lineup || []).map((id) => props.players.find((p) => p.id === id)).filter(Boolean)
)
const dokkaebiScore = computed(() => (q.events || []).filter((e) => e.type === 'goal').length)

function toggleLineup(id) {
  const i = q.lineup.indexOf(id)
  if (i === -1) {
    q.lineup.push(id)
  } else {
    q.lineup.splice(i, 1)
    q.events = q.events.filter((e) => e.playerId !== id && e.assistPlayerId !== id)
    for (const [sid, pid] of Object.entries(q.positions || {})) {
      if (pid === id) delete q.positions[sid]
    }
  }
}

function addGoal() {
  if (lineupPlayers.value.length === 0) return
  q.events.push({ minute: 0, type: 'goal', playerId: lineupPlayers.value[0].id, assistPlayerId: null })
}
function removeEvent(idx) {
  q.events.splice(idx, 1)
}

// 포메이션
const slotModalOpen = ref(false)
const activeSlot = ref(null)
function openSlot(slot) {
  activeSlot.value = slot
  slotModalOpen.value = true
}
function assignToSlot(playerId) {
  if (!activeSlot.value) return
  for (const [sid, pid] of Object.entries(q.positions || {})) {
    if (pid === playerId) delete q.positions[sid]
  }
  if (!q.positions) q.positions = {}
  q.positions[activeSlot.value.id] = playerId
  if (!q.lineup.includes(playerId)) q.lineup.push(playerId)
  slotModalOpen.value = false
}
function clearSlot() {
  if (activeSlot.value && q.positions) delete q.positions[activeSlot.value.id]
  slotModalOpen.value = false
}
function onFormationChange() {
  const valid = new Set(getSlots(q.formation).map((s) => s.id))
  for (const sid of Object.keys(q.positions || {})) {
    if (!valid.has(sid)) delete q.positions[sid]
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- 스코어 -->
    <div class="bg-navy text-white rounded-xl p-3 flex items-center justify-center gap-3">
      <span class="flex-1 text-right font-bold text-sm">도깨비</span>
      <span class="text-2xl font-bold tabular-nums">{{ dokkaebiScore }}</span>
      <span>:</span>
      <input
        :value="q.opponentScore"
        type="number"
        min="0"
        class="w-12 text-center text-2xl font-bold bg-white/10 rounded tabular-nums"
        @input="q.opponentScore = Math.max(0, Number($event.target.value) || 0)"
      />
      <span class="flex-1 font-bold text-sm">상대</span>
    </div>

    <!-- 출전 명단 -->
    <div>
      <h4 class="text-sm font-bold text-navy mb-2">출전 명단 ({{ lineupPlayers.length }})</h4>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        <button
          v-for="p in players"
          :key="p.id"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
          :class="q.lineup.includes(p.id) ? 'border-navy bg-navy/5' : 'border-transparent bg-gray-50'"
          @click="toggleLineup(p.id)"
        >
          <PlayerAvatar :player="p" :size="36" />
          <span class="text-[11px] truncate w-full text-center">{{ p.name }}</span>
        </button>
      </div>
    </div>

    <!-- 골 기록 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-navy">골 기록</h4>
        <button
          type="button"
          class="text-xs px-3 py-1 rounded-full bg-dokkaebi text-white disabled:opacity-40"
          :disabled="lineupPlayers.length === 0"
          @click="addGoal"
        >
          + 골 추가
        </button>
      </div>
      <p v-if="q.events.length === 0" class="text-xs text-gray-400 py-1">기록된 골이 없습니다.</p>
      <ul v-else class="space-y-2">
        <li v-for="(ev, idx) in q.events" :key="idx" class="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
          <input v-model.number="ev.minute" type="number" min="0" class="w-12 border rounded px-1.5 py-1 text-center text-xs" placeholder="분" />
          <span class="text-xs">⚽</span>
          <select v-model="ev.playerId" class="flex-1 border rounded px-2 py-1 text-xs">
            <option v-for="p in lineupPlayers" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <span class="text-xs text-gray-400">↳</span>
          <select v-model="ev.assistPlayerId" class="flex-1 border rounded px-2 py-1 text-xs">
            <option :value="null">도움 없음</option>
            <option v-for="p in lineupPlayers" :key="p.id" :value="p.id" :disabled="p.id === ev.playerId">{{ p.name }}</option>
          </select>
          <button type="button" class="text-gray-400 hover:text-dokkaebi px-1" @click="removeEvent(idx)">×</button>
        </li>
      </ul>
    </div>

    <!-- 포메이션 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-bold text-navy">포메이션 (선택)</h4>
        <select v-model="q.formation" class="border rounded-lg px-2 py-1 text-xs" @change="onFormationChange">
          <option value="">없음</option>
          <option v-for="f in FORMATION_NAMES" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
      <FormationPitch
        v-if="q.formation"
        :formation="q.formation"
        :positions="q.positions"
        :players="players"
        editable
        @slot-click="openSlot"
      />
    </div>

    <BaseModal v-model="slotModalOpen" :title="`${activeSlot?.role || ''} 자리에 배치`">
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="p in lineupPlayers"
          :key="p.id"
          type="button"
          class="flex flex-col items-center gap-1 p-2 rounded-lg border text-center hover:bg-gray-50"
          @click="assignToSlot(p.id)"
        >
          <PlayerAvatar :player="p" :size="36" />
          <span class="text-[11px] truncate w-full">{{ p.name }}</span>
        </button>
        <p v-if="lineupPlayers.length === 0" class="col-span-full text-xs text-gray-400 py-2">
          먼저 출전 명단에서 선수를 선택하세요.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="clearSlot">이 자리 비우기</BaseButton>
        <BaseButton variant="secondary" @click="slotModalOpen = false">닫기</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
