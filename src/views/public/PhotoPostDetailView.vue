<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  getPhotoPost, deletePhotoPost,
  togglePhotoLike,
  listPhotoComments, addPhotoComment, deletePhotoComment
} from '@/firebase/database'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { cldThumb } from '@/utils/cloudinary'
import { formatDateTime, fromNow, formatDate } from '@/utils/date'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const matchesStore = useMatchesStore()
const toast = useToast()

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const newComment = ref('')
const posting = ref(false)
const liking = ref(false)
const activeIdx = ref(0)
const lightbox = ref(false)

const canEdit = computed(() => post.value && (post.value.authorUid === auth.user?.uid || auth.isAdmin))
const likeCount = computed(() => (post.value?.likes ? Object.keys(post.value.likes).length : 0))
const liked = computed(() => !!post.value?.likes?.[auth.user?.uid])
const images = computed(() => post.value?.imageUrls || [])

async function load() {
  loading.value = true
  post.value = await getPhotoPost(route.params.id)
  if (!post.value) { loading.value = false; return }
  comments.value = await listPhotoComments(route.params.id)
  matchesStore.fetchAll()
  loading.value = false
  activeIdx.value = 0
}
onMounted(load)
watch(() => route.params.id, load)

async function toggleLike() {
  if (!auth.user?.uid) return toast.error('로그인이 필요합니다.')
  liking.value = true
  try {
    const nowLiked = await togglePhotoLike(post.value.id)
    if (!post.value.likes) post.value.likes = {}
    if (nowLiked) post.value.likes[auth.user.uid] = true
    else delete post.value.likes[auth.user.uid]
    // 반응성 강제
    post.value = { ...post.value }
  } catch (e) {
    toast.error(`좋아요 실패: ${e?.code || e?.message || e}`)
  } finally { liking.value = false }
}

async function postComment() {
  const body = newComment.value.trim()
  if (!body) return
  posting.value = true
  try {
    await addPhotoComment(route.params.id, body)
    newComment.value = ''
    comments.value = await listPhotoComments(route.params.id)
  } catch (e) {
    toast.error(`댓글 실패: ${e?.code || e?.message || e}`)
  } finally { posting.value = false }
}

async function removeComment(c) {
  if (c.authorUid !== auth.user?.uid && !auth.isAdmin) return
  const ok = await confirm({ title: '댓글 삭제', message: '댓글을 삭제할까요?', confirmText: '삭제' })
  if (!ok) return
  await deletePhotoComment(route.params.id, c.id)
  comments.value = comments.value.filter((x) => x.id !== c.id)
}

async function remove() {
  const ok = await confirm({
    title: '글 삭제',
    message: '이 글을 삭제할까요? 댓글도 함께 삭제됩니다.\n(Cloudinary 원본 이미지는 그대로 남습니다)',
    confirmText: '삭제'
  })
  if (!ok) return
  await deletePhotoPost(post.value.id)
  toast.success('삭제했습니다.')
  router.push('/photos')
}

function matchLabel(id) {
  const m = matchesStore.getById(id)
  return m ? `${formatDate(m.date, 'YYYY.MM.DD')} vs ${m.opponent}` : ''
}
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <EmptyState v-else-if="!post" icon="🔍" title="글을 찾을 수 없습니다" />
  <div v-else class="space-y-4">
    <article class="bg-white dark:bg-zinc-800 rounded-2xl shadow overflow-hidden">
      <div class="p-5">
        <div class="flex items-start justify-between gap-2">
          <h1 class="text-lg font-bold text-navy dark:text-zinc-100">{{ post.title || '(제목 없음)' }}</h1>
          <div v-if="canEdit" class="flex gap-1 shrink-0">
            <RouterLink :to="`/photos/${post.id}/edit`" class="text-xs text-gray-400 dark:text-zinc-500 hover:text-navy dark:text-zinc-100">수정</RouterLink>
            <button class="text-xs text-gray-400 dark:text-zinc-500 hover:text-dokkaebi" @click="remove">삭제</button>
          </div>
        </div>
        <p class="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          {{ post.authorName }} · {{ formatDateTime(post.createdAt) }}
          <RouterLink v-if="post.matchId" :to="`/matches/${post.matchId}`" class="ml-1 text-navy dark:text-zinc-100">
            · {{ matchLabel(post.matchId) }}
          </RouterLink>
        </p>
      </div>

      <!-- 이미지 캐러셀 -->
      <div v-if="images.length" class="relative bg-gray-100 dark:bg-zinc-700">
        <img
          :src="cldThumb(images[activeIdx], 1080)"
          alt=""
          class="w-full aspect-[4/3] object-contain cursor-zoom-in"
          @click="lightbox = true"
        />
        <template v-if="images.length > 1">
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-9 h-9 rounded-full"
            :disabled="activeIdx === 0"
            @click="activeIdx = Math.max(0, activeIdx - 1)"
          >‹</button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-9 h-9 rounded-full"
            :disabled="activeIdx === images.length - 1"
            @click="activeIdx = Math.min(images.length - 1, activeIdx + 1)"
          >›</button>
          <div class="absolute bottom-2 inset-x-0 flex justify-center gap-1">
            <span
              v-for="(_, i) in images"
              :key="i"
              class="w-1.5 h-1.5 rounded-full"
              :class="i === activeIdx ? 'bg-white dark:bg-zinc-800' : 'bg-white dark:bg-zinc-800/40'"
            ></span>
          </div>
        </template>
      </div>

      <div class="p-5 space-y-3">
        <p v-if="post.body" class="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-line">{{ post.body }}</p>
        <div v-if="post.tags?.length" class="flex flex-wrap gap-1">
          <span
            v-for="t in post.tags"
            :key="t"
            class="text-[10px] text-navy dark:text-zinc-100 bg-navy/5 px-1.5 py-0.5 rounded"
          >#{{ t }}</span>
        </div>

        <div class="flex items-center gap-4 pt-2 border-t">
          <button
            class="flex items-center gap-1.5 text-sm transition-transform disabled:opacity-50"
            :class="liked ? 'text-dokkaebi' : 'text-gray-500 dark:text-zinc-400'"
            :disabled="liking"
            @click="toggleLike"
          >
            <span class="text-lg leading-none">{{ liked ? '❤️' : '🤍' }}</span>
            <span class="font-semibold tabular-nums">{{ likeCount }}</span>
          </button>
          <span class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
            💬 <span class="font-semibold tabular-nums">{{ comments.length }}</span>
          </span>
        </div>
      </div>
    </article>

    <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-5">
      <h2 class="font-bold text-navy dark:text-zinc-100 mb-3">댓글 ({{ comments.length }})</h2>
      <ul v-if="comments.length" class="space-y-2 mb-4">
        <li v-for="c in comments" :key="c.id" class="flex items-start gap-2 text-sm">
          <div class="flex-1">
            <p class="font-medium">
              {{ c.authorName }}
              <span class="text-xs text-gray-400 dark:text-zinc-500 font-normal">{{ fromNow(c.createdAt) }}</span>
            </p>
            <p class="text-gray-700 dark:text-zinc-200 whitespace-pre-line">{{ c.body }}</p>
          </div>
          <button
            v-if="c.authorUid === auth.user?.uid || auth.isAdmin"
            class="text-xs text-gray-300 hover:text-dokkaebi"
            @click="removeComment(c)"
          >×</button>
        </li>
      </ul>
      <p v-else class="text-xs text-gray-400 dark:text-zinc-500 mb-4">첫 댓글을 남겨보세요.</p>
      <div class="flex gap-2">
        <input
          v-model="newComment"
          type="text"
          placeholder="댓글 작성"
          class="flex-1 border rounded-lg px-3 py-2 text-sm"
          @keyup.enter="postComment"
        />
        <BaseButton size="sm" :loading="posting" @click="postComment">등록</BaseButton>
      </div>
    </section>

    <!-- 라이트박스 -->
    <Teleport to="body">
      <div
        v-if="lightbox"
        class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        @click="lightbox = false"
      >
        <img :src="images[activeIdx]" alt="" class="max-w-full max-h-full object-contain" />
      </div>
    </Teleport>
  </div>
</template>
