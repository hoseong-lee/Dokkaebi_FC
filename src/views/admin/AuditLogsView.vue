<script setup>
import { ref, onMounted } from 'vue'
import { listAuditLogs } from '@/firebase/database'
import { formatDateTime } from '@/utils/date'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const logs = ref([])
const loading = ref(true)

const ACTION_LABEL = { create: '생성', update: '수정', delete: '삭제' }
const ACTION_COLOR = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-dokkaebi'
}

onMounted(async () => {
  try {
    logs.value = await listAuditLogs(100)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h2 class="font-bold text-navy mb-4">변경 이력</h2>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="logs.length === 0" icon="📋" title="기록된 변경 이력이 없습니다" />
    <ul v-else class="space-y-2">
      <li v-for="log in logs" :key="log.id" class="bg-white rounded-xl shadow-sm p-3 text-sm">
        <div class="flex items-center gap-2">
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-600'"
          >
            {{ ACTION_LABEL[log.action] || log.action }}
          </span>
          <span class="font-mono text-xs text-gray-500 truncate flex-1">{{ log.target }}</span>
        </div>
        <div class="flex items-center justify-between mt-1.5 text-xs text-gray-400">
          <span>{{ log.userDisplayName }}</span>
          <span>{{ formatDateTime(log.timestamp) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
