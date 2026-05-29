<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAllowedEmailsStore } from '@/stores/allowedEmails'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { isValidEmail } from '@/utils/validators'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useAllowedEmailsStore()
const playersStore = usePlayersStore()
const auth = useAuthStore()
const toast = useToast()

const adding = ref(false)
const form = reactive({ email: '', role: 'member', note: '', playerId: '' })

const playerOptions = computed(() =>
  [...playersStore.activePlayers]
    .sort((a, b) => (b.isRegular ? 1 : 0) - (a.isRegular ? 1 : 0) || a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      label: `${p.isRegular ? '★ ' : ''}${p.name}${p.number != null ? ' #' + p.number : ''}`
    }))
)
function playerLabel(id) {
  return playerOptions.value.find((o) => o.id === id)?.label || '미연결'
}

async function add() {
  if (!isValidEmail(form.email)) return toast.error('올바른 이메일을 입력하세요.')
  if (store.emails.some((e) => e.email === form.email.toLowerCase().trim())) {
    return toast.error('이미 등록된 이메일입니다.')
  }
  adding.value = true
  try {
    await store.add(form.email, form.role, form.note, form.playerId || null)
    toast.success('화이트리스트에 추가했습니다.')
    Object.assign(form, { email: '', role: 'member', note: '', playerId: '' })
  } catch (e) {
    toast.error(`추가 실패: ${e?.code || e?.message || e}`)
  } finally {
    adding.value = false
  }
}

function isSelf(item) {
  return auth.user?.email?.toLowerCase() === item.email
}
async function toggle(item) {
  if (isSelf(item)) return toast.error('본인 계정은 비활성화할 수 없습니다.')
  await store.toggleActive(item)
  toast.success(item.active ? '비활성화했습니다.' : '활성화했습니다.')
}
async function changeRole(item, role) {
  if (isSelf(item) && role !== 'admin') {
    return toast.error('본인 관리자 권한은 해제할 수 없습니다.')
  }
  await store.setRole(item, role)
}
async function changePlayer(item, playerId) {
  await store.setPlayerId(item.email, playerId || null)
  toast.success(playerId ? '선수 연결됨' : '선수 연결 해제')
}
async function remove(item) {
  if (isSelf(item)) return toast.error('본인 계정은 삭제할 수 없습니다.')
  const ok = await confirm({
    title: '이메일 삭제',
    message: `'${item.email}'을(를) 화이트리스트에서 제거할까요?\n해당 사용자는 더 이상 로그인할 수 없습니다.`,
    confirmText: '삭제'
  })
  if (!ok) return
  await store.remove(item.email)
  toast.success('삭제했습니다.')
}

onMounted(() => {
  store.fetchAll()
  playersStore.fetchAll()
})
</script>

<template>
  <div>
    <h2 class="font-bold text-navy mb-4">화이트리스트 관리</h2>

    <form class="bg-white rounded-2xl shadow p-4 mb-4 space-y-3" @submit.prevent="add">
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          v-model="form.email"
          type="email"
          placeholder="이메일 주소"
          class="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <select v-model="form.role" class="border rounded-lg px-3 py-2 text-sm">
          <option value="member">멤버</option>
          <option value="admin">관리자</option>
        </select>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <select v-model="form.playerId" class="flex-1 border rounded-lg px-3 py-2 text-sm">
          <option value="">선수 연결 (선택 — 로그인 시 자동 매칭)</option>
          <option v-for="o in playerOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <input
          v-model="form.note"
          type="text"
          placeholder="메모 (선택)"
          class="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <BaseButton type="submit" :loading="adding">추가</BaseButton>
      </div>
      <p class="text-[11px] text-gray-400">
        💡 선수를 연결해두면 해당 이메일로 첫 로그인하는 사람이 자동으로 그 선수에 매칭됩니다.
      </p>
    </form>

    <LoadingSpinner v-if="store.loading" />
    <EmptyState v-else-if="store.emails.length === 0" icon="📧" title="등록된 이메일이 없습니다" />
    <ul v-else class="space-y-2">
      <li
        v-for="item in store.emails"
        :key="item.email"
        class="bg-white rounded-xl shadow-sm p-3 space-y-2"
        :class="{ 'opacity-60': !item.active }"
      >
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate text-sm">
              {{ item.email }}
              <span v-if="isSelf(item)" class="text-xs text-navy">(나)</span>
            </p>
            <p v-if="item.note" class="text-xs text-gray-400 truncate">{{ item.note }}</p>
          </div>
          <select
            :value="item.role"
            class="border rounded-lg px-2 py-1 text-xs"
            @change="changeRole(item, $event.target.value)"
          >
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
          </select>
          <button
            class="text-xs px-2 py-1 rounded-full"
            :class="item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            @click="toggle(item)"
          >{{ item.active ? '활성' : '비활성' }}</button>
          <button class="text-gray-300 hover:text-dokkaebi px-1" @click="remove(item)">×</button>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-gray-500 w-12">선수</span>
          <select
            :value="item.playerId || ''"
            class="flex-1 border rounded-lg px-2 py-1 text-xs"
            @change="changePlayer(item, $event.target.value)"
          >
            <option value="">미연결</option>
            <option v-for="o in playerOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
        </div>
      </li>
    </ul>
  </div>
</template>
