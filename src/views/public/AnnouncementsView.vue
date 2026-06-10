<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '@/firebase/database'
import { formatDateTime, fromNow } from '@/utils/date'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const auth = useAuthStore()
const toast = useToast()

const items = ref([])
const loading = ref(true)
const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)

const form = reactive({ title: '', body: '', pinned: false })

async function load() {
  loading.value = true
  try {
    items.value = await listAnnouncements()
  } catch (e) {
    toast.error(`공지 불러오기 실패: ${e?.message || e}`)
    items.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  editingId.value = null
  form.title = ''
  form.body = ''
  form.pinned = false
  modalOpen.value = true
}
function openEdit(a) {
  editingId.value = a.id
  form.title = a.title
  form.body = a.body
  form.pinned = !!a.pinned
  modalOpen.value = true
}

async function save() {
  if (!form.title.trim() || !form.body.trim()) return toast.error('제목과 내용을 입력하세요.')
  saving.value = true
  try {
    if (editingId.value) await updateAnnouncement(editingId.value, { ...form })
    else await createAnnouncement({ ...form })
    toast.success(editingId.value ? '수정했습니다.' : '공지를 올렸습니다.')
    modalOpen.value = false
    await load()
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}

async function remove(a) {
  const ok = await confirm({ title: '공지 삭제', message: `'${a.title}' 공지를 삭제할까요?`, confirmText: '삭제' })
  if (!ok) return
  try {
    await deleteAnnouncement(a.id)
    await load()
    toast.success('삭제했습니다.')
  } catch (e) {
    toast.error(`삭제 실패: ${e?.code || e?.message || e}`)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100">공지사항</h1>
      <BaseButton v-if="auth.isAdmin" size="sm" @click="openCreate">+ 공지 작성</BaseButton>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="items.length === 0" icon="📢" title="등록된 공지가 없습니다" />
    <ul v-else class="space-y-3">
      <li
        v-for="a in items"
        :key="a.id"
        class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-4"
        :class="{ 'ring-2 ring-gold/50': a.pinned }"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="font-bold text-navy dark:text-zinc-100 flex items-center gap-1.5">
            <span v-if="a.pinned" class="text-amber-500 text-xs">📌</span>
            {{ a.title }}
          </h2>
          <div v-if="auth.isAdmin" class="flex gap-1 shrink-0">
            <button class="text-xs text-gray-400 dark:text-zinc-500 hover:text-navy dark:text-zinc-100" @click="openEdit(a)">수정</button>
            <button class="text-xs text-gray-400 dark:text-zinc-500 hover:text-dokkaebi" @click="remove(a)">삭제</button>
          </div>
        </div>
        <p class="text-sm text-gray-700 dark:text-zinc-200 mt-2 whitespace-pre-line">{{ a.body }}</p>
        <p class="text-xs text-gray-400 dark:text-zinc-500 mt-2">{{ a.authorName }} · {{ fromNow(a.createdAt) }}</p>
      </li>
    </ul>

    <BaseModal v-model="modalOpen" :title="editingId ? '공지 수정' : '공지 작성'">
      <div class="space-y-3">
        <input v-model="form.title" type="text" placeholder="제목" class="w-full border rounded-lg px-3 py-2 text-sm" />
        <textarea v-model="form.body" rows="6" placeholder="내용" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.pinned" type="checkbox" class="rounded" />
          📌 상단 고정
        </label>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="modalOpen = false">취소</BaseButton>
        <BaseButton :loading="saving" @click="save">{{ editingId ? '수정' : '작성' }}</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
