<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getPost, deletePost, listComments, addComment, deleteComment } from '@/firebase/database'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, fromNow } from '@/utils/date'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const newComment = ref('')
const posting = ref(false)

const canEdit = computed(() => post.value && (post.value.authorUid === auth.user?.uid || auth.isAdmin))

async function load() {
  loading.value = true
  post.value = await getPost(route.params.id)
  if (!post.value) {
    loading.value = false
    return
  }
  comments.value = await listComments(route.params.id)
  loading.value = false
}
onMounted(load)
watch(() => route.params.id, load)

async function postComment() {
  const body = newComment.value.trim()
  if (!body) return
  posting.value = true
  try {
    await addComment(route.params.id, body)
    newComment.value = ''
    comments.value = await listComments(route.params.id)
  } catch (e) {
    toast.error(`댓글 실패: ${e?.code || e?.message || e}`)
  } finally {
    posting.value = false
  }
}

async function removeComment(c) {
  if (c.authorUid !== auth.user?.uid && !auth.isAdmin) return
  const ok = await confirm({ title: '댓글 삭제', message: '댓글을 삭제할까요?', confirmText: '삭제' })
  if (!ok) return
  await deleteComment(route.params.id, c.id)
  comments.value = comments.value.filter((x) => x.id !== c.id)
}

async function remove() {
  const ok = await confirm({ title: '글 삭제', message: '이 글을 삭제할까요? 댓글도 함께 삭제됩니다.', confirmText: '삭제' })
  if (!ok) return
  await deletePost(post.value.id)
  toast.success('삭제했습니다.')
  router.push('/board')
}
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <EmptyState v-else-if="!post" icon="🔍" title="글을 찾을 수 없습니다" />
  <div v-else class="space-y-4">
    <article class="bg-white rounded-2xl shadow p-5">
      <div class="flex items-start justify-between gap-2">
        <h1 class="text-lg font-bold text-navy">{{ post.title }}</h1>
        <div v-if="canEdit" class="flex gap-1 shrink-0">
          <RouterLink :to="`/board/${post.id}/edit`" class="text-xs text-gray-400 hover:text-navy">수정</RouterLink>
          <button class="text-xs text-gray-400 hover:text-dokkaebi" @click="remove">삭제</button>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-1">{{ post.authorName }} · {{ formatDateTime(post.createdAt) }}</p>
      <p class="text-sm text-gray-800 whitespace-pre-line mt-4">{{ post.body }}</p>
    </article>

    <section class="bg-white rounded-2xl shadow p-5">
      <h2 class="font-bold text-navy mb-3">댓글 ({{ comments.length }})</h2>
      <ul class="space-y-2 mb-4">
        <li v-for="c in comments" :key="c.id" class="flex items-start gap-2 text-sm">
          <div class="flex-1">
            <p class="font-medium">{{ c.authorName }} <span class="text-xs text-gray-400">{{ fromNow(c.createdAt) }}</span></p>
            <p class="text-gray-700 whitespace-pre-line">{{ c.body }}</p>
          </div>
          <button
            v-if="c.authorUid === auth.user?.uid || auth.isAdmin"
            class="text-xs text-gray-300 hover:text-dokkaebi"
            @click="removeComment(c)"
          >×</button>
        </li>
      </ul>
      <div class="flex gap-2">
        <input v-model="newComment" type="text" placeholder="댓글 작성" class="flex-1 border rounded-lg px-3 py-2 text-sm" @keyup.enter="postComment" />
        <BaseButton size="sm" :loading="posting" @click="postComment">등록</BaseButton>
      </div>
    </section>
  </div>
</template>
