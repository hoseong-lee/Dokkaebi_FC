<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const model = defineModel({ type: Boolean, default: false })

const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()

const search = ref('')
const saving = ref(false)

watch(model, (open) => {
  if (open) {
    playersStore.fetchAll()
    search.value = ''
  }
})

const filtered = computed(() => {
  const q = search.value.trim()
  const list = playersStore.activePlayers
  if (!q) return list
  return list.filter((p) => p.name.includes(q))
})

const linkedPlayer = computed(() =>
  auth.myPlayerId ? playersStore.getById(auth.myPlayerId) : null
)

async function pick(playerId) {
  saving.value = true
  try {
    await auth.linkPlayer(playerId)
    toast.success(playerId ? '본인 선수가 연결되었습니다.' : '연결을 해제했습니다.')
    model.value = false
  } catch (e) {
    toast.error(`연결 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal v-model="model" title="내 선수 연결">
    <p class="text-xs text-gray-500 mb-3">
      앱에서 본인이 어떤 선수인지 지정하세요. MOM 투표 권한과 본인 통계 표시에 사용됩니다.
    </p>
    <p v-if="linkedPlayer" class="text-sm mb-3">
      현재 연결됨: <span class="font-bold text-navy">{{ linkedPlayer.name }}</span>
      <button class="ml-2 text-xs text-dokkaebi" :disabled="saving" @click="pick(null)">해제</button>
    </p>

    <input
      v-model="search"
      type="text"
      placeholder="이름 검색"
      class="w-full border rounded-lg px-3 py-2 text-sm mb-3"
    />

    <ul class="max-h-80 overflow-y-auto divide-y">
      <li v-for="p in filtered" :key="p.id">
        <button
          type="button"
          class="w-full flex items-center gap-3 p-2 hover:bg-gray-50 disabled:opacity-50"
          :disabled="saving"
          @click="pick(p.id)"
        >
          <PlayerAvatar :player="p" :size="36" />
          <div class="flex-1 text-left min-w-0">
            <p class="font-medium truncate">
              <span v-if="p.isRegular" class="text-amber-500">★</span>
              {{ p.name }}
              <span class="text-xs text-gray-400">#{{ p.number ?? '-' }}</span>
            </p>
            <p class="text-xs text-gray-500">
              {{ p.mainPosition || p.position }}<span v-if="p.subPosition"> / {{ p.subPosition }}</span>
            </p>
          </div>
          <span v-if="p.id === auth.myPlayerId" class="text-amber-500 text-xs">선택됨</span>
        </button>
      </li>
    </ul>
  </BaseModal>
</template>
