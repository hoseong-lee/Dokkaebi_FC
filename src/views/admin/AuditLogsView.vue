<script setup>
import { ref, onMounted } from 'vue'
import { listAuditLogs } from '@/firebase/database'
import { formatDateTime } from '@/utils/date'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const auth = useAuthStore()
const logs = ref([])
const loading = ref(true)

const ACTION_LABEL = { create: '생성', update: '수정', delete: '삭제', approve: '승인', reject: '거절' }
const ACTION_COLOR = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-dokkaebi',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'
}

onMounted(async () => {
  if (!auth.isSuperAdmin) { loading.value = false; return }
  try {
    logs.value = await listAuditLogs(100)
  } catch (e) {
    console.error('audit logs load failed', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h2 class="font-bold text-navy dark:text-zinc-100 mb-4 flex items-center gap-2">
      변경 이력
      <span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">🔒 슈퍼관리자 전용</span>
    </h2>

    <div v-if="!auth.isSuperAdmin" class="bg-rose-50 ring-1 ring-rose-200 rounded-2xl p-5 text-center text-sm text-rose-700">
      슈퍼관리자만 변경 이력을 확인할 수 있습니다.
    </div>
    <template v-else>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="logs.length === 0" icon="📋" title="기록된 변경 이력이 없습니다" />
    <ul v-else class="space-y-2">
      <li v-for="log in logs" :key="log.id" class="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-3 text-sm">
        <div class="flex items-center gap-2">
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="ACTION_COLOR[log.action] || 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400'"
          >
            {{ ACTION_LABEL[log.action] || log.action }}
          </span>
          <span class="font-mono text-xs text-gray-500 dark:text-zinc-400 truncate flex-1">{{ log.target }}</span>
        </div>
        <div class="flex items-center justify-between mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
          <span>{{ log.userDisplayName }}</span>
          <span>{{ formatDateTime(log.timestamp) }}</span>
        </div>
      </li>
    </ul>
    </template>
  </div>
</template>
