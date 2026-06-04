<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSavedSquadsStore } from '@/stores/savedSquads'
import { usePlayersStore } from '@/stores/players'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SquadEditor from '@/components/match/SquadEditor.vue'

const route = useRoute()
const router = useRouter()
const store = useSavedSquadsStore()
const playersStore = usePlayersStore()
const auth = useAuthStore()
const toast = useToast()

const editingId = computed(() => route.params.id || null)
const isEdit = computed(() => !!editingId.value)

const loading = ref(true)
const saving = ref(false)
const name = ref('')
const notes = ref('')
const isPublic = ref(true)

// SquadEditor 가 직접 mutate 하므로 reactive 로 (lineup/formation/positions)
const squad = reactive({
  lineup: [],
  formation: '',
  positions: {},
  events: [],         // SquadEditor 가 안 쓰는 dummy 필드
  opponentScore: 0    // dummy
})

async function load() {
  loading.value = true
  await Promise.all([
    store.fetchAll(),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll()
  ])
  if (isEdit.value) {
    // 항상 fresh fetch — 캐시 stale 방지
    const s = await store.fetchOne(editingId.value, true)
    if (!s) {
      toast.error('스쿼드를 찾을 수 없습니다.')
      router.replace('/squads')
      return
    }
    // 소유자 확인
    if (s.authorUid && s.authorUid !== auth.user?.uid && !auth.isAdmin) {
      toast.error('이 스쿼드를 편집할 권한이 없습니다.')
      router.replace(`/squads/${s.id}`)
      return
    }
    name.value = s.name || ''
    notes.value = s.notes || ''
    isPublic.value = s.isPublic !== false
    squad.lineup = [...(s.lineup || [])]
    squad.formation = s.formation || ''
    squad.positions = { ...(s.positions || {}) }
  }
  loading.value = false
}
onMounted(load)

async function submit() {
  if (!name.value.trim()) return toast.error('스쿼드 이름을 입력하세요.')
  if (squad.lineup.length === 0) return toast.error('최소 1명 이상 출전 선수를 선택하세요.')
  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      formation: squad.formation || '',
      lineup: squad.lineup,
      positions: squad.positions || {},
      notes: notes.value.trim() || null,
      isPublic: isPublic.value
    }
    if (isEdit.value) {
      await store.update(editingId.value, payload)
      toast.success('수정했습니다.')
      router.push(`/squads/${editingId.value}`)
    } else {
      const id = await store.create(payload)
      toast.success('저장했습니다.')
      router.push(`/squads/${id}`)
    }
  } catch (e) {
    toast.error(`저장 실패: ${e?.message || e}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else class="space-y-4">
    <div>
      <h1 class="text-xl font-bold text-navy flex items-center gap-2">
        ⚔️ <span>{{ isEdit ? '스쿼드 편집' : '새 스쿼드' }}</span>
      </h1>
      <p class="text-xs text-gray-500 mt-1">라인업과 포메이션을 짜고 저장하세요. 추후 경기에 적용할 수 있습니다.</p>
    </div>

    <!-- 메타 정보 -->
    <section class="bg-white rounded-2xl shadow p-5 space-y-3">
      <div>
        <label class="block text-xs text-gray-500 font-semibold mb-1">스쿼드 이름</label>
        <input
          v-model="name"
          type="text"
          maxlength="40"
          placeholder="예: 주말 6인제 A안 / 토너먼트 베스트11"
          class="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-500 font-semibold mb-1">메모 (선택)</label>
        <textarea
          v-model="notes"
          rows="2"
          maxlength="200"
          placeholder="이 스쿼드의 의도, 컨디션 메모 등"
          class="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <p class="text-[11px] text-gray-400 text-right mt-0.5">{{ notes.length }}/200</p>
      </div>
      <div class="flex items-center gap-2">
        <input id="public-toggle" v-model="isPublic" type="checkbox" class="w-4 h-4 accent-navy" />
        <label for="public-toggle" class="text-sm text-onyx cursor-pointer">
          🌐 공개 — 다른 멤버도 이 스쿼드를 볼 수 있습니다
        </label>
      </div>
    </section>

    <!-- 스쿼드 에디터 -->
    <section class="bg-white rounded-2xl shadow p-5">
      <SquadEditor :squad="squad" :players="playersStore.activePlayers" />
    </section>

    <!-- 저장 -->
    <div class="flex gap-2">
      <BaseButton variant="secondary" block @click="router.back()">취소</BaseButton>
      <BaseButton variant="primary" :loading="saving" block @click="submit">
        {{ isEdit ? '수정 저장' : '스쿼드 저장' }}
      </BaseButton>
    </div>
  </div>
</template>
