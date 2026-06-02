<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSavedSquadsStore } from '@/stores/savedSquads'
import { usePlayersStore } from '@/stores/players'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/date'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const store = useSavedSquadsStore()
const playersStore = usePlayersStore()
const auth = useAuthStore()

const tab = ref('mine') // mine | public
const loading = ref(true)

const myUid = computed(() => auth.user?.uid || null)
const mySquads = computed(() =>
  store.squads.filter((s) => s.authorUid === myUid.value)
)
// "공개" 탭은 본인 것 포함 — 본인이 공개로 만들었으면 거기도 표시되어야 자연스러움
const publicSquads = computed(() =>
  store.squads.filter((s) => s.isPublic !== false)
)

const visible = computed(() => (tab.value === 'mine' ? mySquads.value : publicSquads.value))

async function load() {
  loading.value = true
  await Promise.all([
    store.fetchAll(true),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll()
  ])
  loading.value = false
}
onMounted(load)

function playerNames(squad) {
  return (squad.lineup || [])
    .slice(0, 6)
    .map((id) => playersStore.getById(id)?.name)
    .filter(Boolean)
    .join(', ')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-navy flex items-center gap-2">⚔️ <span>스쿼드 메이커</span></h1>
        <p class="text-xs text-gray-500 mt-1">라인업을 미리 짜고 저장해서 재활용하세요</p>
      </div>
      <RouterLink to="/squads/new">
        <BaseButton size="sm" variant="primary">+ 새 스쿼드</BaseButton>
      </RouterLink>
    </div>

    <!-- 탭 -->
    <div class="flex bg-white rounded-xl p-1 mb-4 shadow-sm text-sm">
      <button
        type="button"
        class="flex-1 py-2 rounded-lg font-medium transition-colors"
        :class="tab === 'mine' ? 'bg-navy text-white shadow' : 'text-gray-500'"
        @click="tab = 'mine'"
      >🧑 내가 만든 <span class="text-xs opacity-70">({{ mySquads.length }})</span></button>
      <button
        type="button"
        class="flex-1 py-2 rounded-lg font-medium transition-colors"
        :class="tab === 'public' ? 'bg-navy text-white shadow' : 'text-gray-500'"
        @click="tab = 'public'"
      >🌐 공개 <span class="text-xs opacity-70">({{ publicSquads.length }})</span></button>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="visible.length === 0" class="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
      <p class="text-4xl mb-2">⚔️</p>
      <p class="text-sm">
        <template v-if="tab === 'mine'">아직 만든 스쿼드가 없어요.<br>새 스쿼드를 만들어보세요!</template>
        <template v-else>공개된 스쿼드가 없어요.</template>
      </p>
    </div>

    <div v-else class="space-y-3">
      <RouterLink
        v-for="s in visible" :key="s.id"
        :to="`/squads/${s.id}`"
        class="block bg-white rounded-2xl shadow-sm hover:shadow transition-shadow p-4"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-navy truncate">{{ s.name }}</p>
            <p class="text-[11px] text-gray-400 mt-0.5">
              {{ s.authorName || '익명' }} · {{ formatDate(s.updatedAt || s.createdAt) }}
            </p>
          </div>
          <div class="flex gap-1 shrink-0">
            <span v-if="s.formation" class="text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-bold tabular-nums">{{ s.formation }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{{ (s.lineup || []).length }}명</span>
            <span v-if="!s.isPublic" class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">🔒</span>
          </div>
        </div>
        <p v-if="s.notes" class="text-xs text-gray-600 leading-snug mb-2 line-clamp-2">💬 {{ s.notes }}</p>
        <p class="text-[11px] text-gray-500 truncate">{{ playerNames(s) }}<span v-if="(s.lineup?.length || 0) > 6">…</span></p>
      </RouterLink>
    </div>
  </div>
</template>
