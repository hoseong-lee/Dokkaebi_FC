<script setup>
import { ref, computed } from 'vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import FormationPitch from '@/components/match/FormationPitch.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { FORMATION_NAMES, getSlots } from '@/utils/formations'

// 빠른 선택 칩에 노출할 인기 포메이션 (좌→우)
const POPULAR_FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '4-3-2-1']
const OTHER_FORMATIONS = FORMATION_NAMES.filter((f) => !POPULAR_FORMATIONS.includes(f))
import { suggestFormation } from '@/utils/autoFormation'
import { usePlayersStore } from '@/stores/players'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  squad: { type: Object, required: true }, // { lineup: [], formation: '', positions: {} }
  players: { type: Array, required: true }
})

const s = props.squad
const playersStore = usePlayersStore()
const toast = useToast()

const regulars = computed(() => props.players.filter((p) => p.isRegular))
const lineupPlayers = computed(() =>
  (s.lineup || []).map((id) => props.players.find((p) => p.id === id)).filter(Boolean)
)

function toggleLineup(id) {
  const i = s.lineup.indexOf(id)
  if (i === -1) s.lineup.push(id)
  else {
    s.lineup.splice(i, 1)
    for (const [sid, pid] of Object.entries(s.positions || {})) {
      if (pid === id) delete s.positions[sid]
    }
  }
}

function selectAllRegulars() {
  const next = new Set(s.lineup)
  regulars.value.forEach((p) => next.add(p.id))
  s.lineup = [...next]
  toast.success(`고정멤버 ${regulars.value.length}명 추가`)
}

function clearLineup() {
  s.lineup = []
  s.positions = {}
}

// 용병 즉석 추가
const guestModalOpen = ref(false)
const guestName = ref('')
const guestSaving = ref(false)
async function addGuest() {
  const name = guestName.value.trim()
  if (!name) return
  guestSaving.value = true
  try {
    const id = await playersStore.add({
      name, number: null, position: 'MF',
      mainPosition: null, subPosition: null,
      preferredFoot: 'R', isRegular: false
    })
    if (!s.lineup.includes(id)) s.lineup.push(id)
    toast.success(`용병 "${name}" 추가됨`)
    guestName.value = ''
    guestModalOpen.value = false
  } catch (e) {
    toast.error(`용병 추가 실패: ${e?.code || e?.message || e}`)
  } finally {
    guestSaving.value = false
  }
}

// 자동 포메이션
function autoFormation() {
  if (s.lineup.length === 0) return toast.error('출전 선수를 먼저 선택하세요.')
  const r = suggestFormation(s.lineup, props.players)
  s.formation = r.formation
  s.positions = r.positions
  toast.success(`${r.formation} 자동 배치 완료`)
}

function onFormationChange() {
  const valid = new Set(getSlots(s.formation).map((x) => x.id))
  for (const sid of Object.keys(s.positions || {})) {
    if (!valid.has(sid)) delete s.positions[sid]
  }
}

// 포메이션 슬롯 클릭 → 선수 선택 모달
const slotModalOpen = ref(false)
const activeSlot = ref(null)
function openSlot(slot) {
  activeSlot.value = slot
  slotModalOpen.value = true
}
function assignToSlot(playerId) {
  if (!activeSlot.value) return
  for (const [sid, pid] of Object.entries(s.positions || {})) {
    if (pid === playerId) delete s.positions[sid]
  }
  if (!s.positions) s.positions = {}
  s.positions[activeSlot.value.id] = playerId
  if (!s.lineup.includes(playerId)) s.lineup.push(playerId)
  slotModalOpen.value = false
}
function clearSlot() {
  if (activeSlot.value && s.positions) delete s.positions[activeSlot.value.id]
  slotModalOpen.value = false
}
</script>

<template>
  <div class="space-y-5">
    <!-- 출전 명단 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold text-navy">출전 예정 명단 ({{ lineupPlayers.length }})</h3>
        <div class="flex gap-1.5">
          <button
            type="button"
            class="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200"
            @click="selectAllRegulars"
          >★ 고정 전체</button>
          <button
            type="button"
            class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            @click="guestModalOpen = true"
          >+ 용병</button>
          <button
            type="button"
            class="text-xs px-2.5 py-1 rounded-full bg-white text-gray-500 hover:bg-gray-50"
            @click="clearLineup"
          >전체 해제</button>
        </div>
      </div>
      <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
        <button
          v-for="p in players"
          :key="p.id"
          type="button"
          class="relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors"
          :class="s.lineup.includes(p.id) ? 'border-navy bg-navy/5' : 'border-transparent bg-gray-50'"
          @click="toggleLineup(p.id)"
        >
          <span v-if="p.isRegular" class="absolute top-1 right-1 text-amber-500 text-[10px] leading-none">★</span>
          <span v-else class="absolute top-1 right-1 text-[9px] bg-gray-200 text-gray-600 rounded px-1 leading-tight">용병</span>
          <PlayerAvatar :player="p" :size="36" />
          <span class="text-[11px] truncate w-full text-center">{{ p.name }}</span>
        </button>
      </div>
    </div>

    <!-- 포메이션 -->
    <div>
      <div class="flex items-center justify-between mb-2 gap-2">
        <h3 class="text-sm font-bold text-navy">포메이션</h3>
        <button
          type="button"
          class="text-xs px-3 py-1.5 rounded-full bg-dokkaebi text-white font-semibold hover:bg-dokkaebi/90 disabled:opacity-40"
          :disabled="s.lineup.length === 0"
          @click="autoFormation"
        >
          ⚡ 참석 인원 기반 자동 추천
        </button>
      </div>

      <!-- 인기 포메이션 칩 -->
      <div class="flex flex-wrap gap-1.5 mb-2">
        <button
          v-for="f in POPULAR_FORMATIONS"
          :key="f"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
          :class="s.formation === f ? 'bg-navy text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="() => { s.formation = f; onFormationChange() }"
        >
          {{ f }}
        </button>
        <select
          :value="OTHER_FORMATIONS.includes(s.formation) ? s.formation : ''"
          class="border rounded-full px-3 py-1 text-xs bg-white"
          @change="(e) => { s.formation = e.target.value; onFormationChange() }"
        >
          <option value="">기타…</option>
          <option v-for="f in OTHER_FORMATIONS" :key="f" :value="f">{{ f }}</option>
        </select>
        <button
          v-if="s.formation"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-dokkaebi"
          @click="() => { s.formation = ''; s.positions = {} }"
        >
          해제
        </button>
      </div>

      <FormationPitch
        v-if="s.formation"
        :formation="s.formation"
        :positions="s.positions"
        :players="players"
        editable
        @slot-click="openSlot"
      />
      <p v-else class="text-xs text-gray-400">
        포메이션 칩을 누르거나 명단 선택 후 ⚡ 자동 추천을 눌러보세요.
      </p>
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
          명단에서 선수를 먼저 선택하세요.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="clearSlot">이 자리 비우기</BaseButton>
        <BaseButton variant="secondary" @click="slotModalOpen = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="guestModalOpen" title="용병 추가">
      <p class="text-xs text-gray-500 mb-2">이번 경기에 함께 뛰는 용병/게스트입니다.</p>
      <input
        v-model="guestName"
        type="text"
        placeholder="용병 이름"
        class="w-full border rounded-lg px-3 py-2 text-sm"
        @keyup.enter="addGuest"
      />
      <template #footer>
        <BaseButton variant="secondary" @click="guestModalOpen = false">취소</BaseButton>
        <BaseButton :loading="guestSaving" @click="addGuest">추가</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
