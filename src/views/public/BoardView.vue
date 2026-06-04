<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listPosts } from '@/firebase/database'
import { fromNow } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const posts = ref([])
const loading = ref(true)
const toast = useToast()

onMounted(async () => {
  try {
    posts.value = await listPosts()
  } catch (e) {
    toast.error(`게시글 불러오기 실패: ${e?.message || e}`)
    posts.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-navy">자유게시판</h1>
      <RouterLink to="/board/new"><BaseButton size="sm">+ 글쓰기</BaseButton></RouterLink>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="posts.length === 0" icon="💬" title="첫 글의 주인공이 되어보세요" />
    <ul v-else class="space-y-2">
      <li v-for="p in posts" :key="p.id" class="bg-white rounded-xl shadow-sm">
        <RouterLink :to="`/board/${p.id}`" class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl">
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ p.title }}</p>
            <p class="text-xs text-gray-400">{{ p.authorName }} · {{ fromNow(p.createdAt) }}</p>
          </div>
          <span class="text-xs text-gray-300">›</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
