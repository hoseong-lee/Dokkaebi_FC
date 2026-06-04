<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAllowedEmailsStore } from '@/stores/allowedEmails'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { isValidEmail } from '@/utils/validators'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { listSignupRequests, approveSignupRequest, rejectSignupRequest } from '@/firebase/database'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = useAllowedEmailsStore()
const playersStore = usePlayersStore()
const auth = useAuthStore()
const toast = useToast()

const adding = ref(false)
const form = reactive({ email: '', role: 'member', note: '', playerId: '' })

// 가입 요청
const signupRequests = ref([])
const requestsLoading = ref(false)
const approvingUid = ref(null)
async function loadRequests() {
  requestsLoading.value = true
  try {
    signupRequests.value = await listSignupRequests()
  } catch (e) {
    toast.error(`가입 요청 불러오기 실패: ${e?.message || e}`)
  } finally {
    requestsLoading.value = false
  }
}
async function approveRequest(req, role = 'member', playerId = null) {
  if (!auth.isSuperAdmin) return toast.error('슈퍼관리자만 승인할 수 있습니다.')
  approvingUid.value = req.uid
  try {
    await approveSignupRequest(req.uid, role, playerId)
    toast.success(`${req.email} 승인됨 — 다음 로그인 시 사용 가능`)
    await Promise.all([loadRequests(), store.fetchAll()])
  } catch (e) {
    toast.error(`승인 실패: ${e?.message || e}`)
  } finally {
    approvingUid.value = null
  }
}
async function rejectRequest(req) {
  if (!auth.isSuperAdmin) return toast.error('슈퍼관리자만 거절할 수 있습니다.')
  const ok = await confirm({
    title: '가입 요청 거절',
    message: `'${req.email}'의 가입 요청을 거절할까요?\n사용자는 다시 로그인 시 새 요청을 보낼 수 있습니다.`,
    confirmText: '거절'
  })
  if (!ok) return
  try {
    await rejectSignupRequest(req.uid)
    toast.success('거절됨')
    await loadRequests()
  } catch (e) {
    toast.error(`거절 실패: ${e?.message || e}`)
  }
}

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
  if (!auth.isSuperAdmin) return toast.error('슈퍼관리자만 화이트리스트에 추가할 수 있습니다.')
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
function ensureSuperAdmin() {
  if (!auth.isSuperAdmin) {
    toast.error('슈퍼관리자만 변경할 수 있습니다.')
    return false
  }
  return true
}
async function toggle(item) {
  if (!ensureSuperAdmin()) return
  if (isSelf(item)) return toast.error('본인 계정은 비활성화할 수 없습니다.')
  await store.toggleActive(item)
  toast.success(item.active ? '비활성화했습니다.' : '활성화했습니다.')
}
async function changeRole(item, role) {
  if (!ensureSuperAdmin()) return
  if (isSelf(item) && role !== 'superAdmin') {
    return toast.error('본인 슈퍼관리자 권한은 해제할 수 없습니다.')
  }
  await store.setRole(item, role)
}
async function changePlayer(item, playerId) {
  if (!ensureSuperAdmin()) return
  await store.setPlayerId(item.email, playerId || null)
  toast.success(playerId ? '선수 연결됨' : '선수 연결 해제')
}
async function remove(item) {
  if (!ensureSuperAdmin()) return
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

const ROLE_LABEL = { member: '멤버', admin: '관리자', superAdmin: '슈퍼관리자' }

onMounted(async () => {
  if (!auth.isSuperAdmin) return // 가드 — UI 도 차단되어 있지만 fetch 도 막음
  await Promise.all([store.fetchAll(), playersStore.fetchAll(), loadRequests()])
})
</script>

<template>
  <div>
    <h2 class="font-bold text-navy mb-4 flex items-center gap-2">
      화이트리스트 관리
      <span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">🔒 슈퍼관리자 전용</span>
    </h2>

    <!-- superAdmin 이 아니면 차단 안내 -->
    <div v-if="!auth.isSuperAdmin" class="bg-rose-50 ring-1 ring-rose-200 rounded-2xl p-5 text-center text-sm text-rose-700">
      슈퍼관리자만 화이트리스트와 권한을 관리할 수 있습니다.
    </div>

    <template v-else>

    <!-- 가입 요청 (대기) -->
    <section class="bg-white rounded-2xl shadow p-4 mb-4">
      <h3 class="font-bold text-navy text-sm mb-3 flex items-center gap-2">
        📨 가입 요청
        <span v-if="signupRequests.length" class="text-[10px] bg-amber-400 text-navy px-1.5 py-0.5 rounded-full font-bold">{{ signupRequests.length }}</span>
      </h3>
      <LoadingSpinner v-if="requestsLoading" />
      <p v-else-if="signupRequests.length === 0" class="text-xs text-gray-400 text-center py-3">대기 중인 요청이 없습니다.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="req in signupRequests" :key="req.uid"
          class="flex items-center gap-2 p-2 rounded-lg bg-amber-50 ring-1 ring-amber-200"
        >
          <img
            v-if="req.photoURL"
            :src="req.photoURL"
            referrerpolicy="no-referrer"
            class="w-9 h-9 rounded-full ring-1 ring-gray-200"
          />
          <div v-else class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">👤</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ req.displayName || '이름 없음' }}</p>
            <p class="text-[11px] text-gray-500 truncate">{{ req.email }}</p>
          </div>
          <button
            type="button"
            class="text-xs px-2 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            :disabled="approvingUid === req.uid"
            @click="approveRequest(req)"
          >승인</button>
          <button
            type="button"
            class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            @click="rejectRequest(req)"
          >거절</button>
        </li>
      </ul>
      <p class="text-[10px] text-gray-400 mt-2">💡 승인 시 자동으로 멤버 권한으로 화이트리스트에 추가됩니다. 선수 연결은 아래에서 별도로 지정하세요.</p>
    </section>

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
          <option value="superAdmin">슈퍼관리자</option>
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
            <option value="superAdmin">슈퍼관리자</option>
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

    </template>
  </div>
</template>
