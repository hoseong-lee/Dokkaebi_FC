<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { rtdb } from '@/firebase/config'
import { nsPath, toggleSquadLike, setSquadReaction, addSquadComment, deleteSquadComment } from '@/firebase/database'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/date'
import { confirm } from '@/composables/useConfirm'

const props = defineProps({ squadId: { type: String, required: true } })
const auth = useAuthStore()
const toast = useToast()

const REACTIONS = ['🔥', '👍', '😂', '🎯', '😮', '🤔']

const likes = ref({})       // { uid: true }
const reactions = ref({})   // { uid: emoji }
const comments = ref([])    // [{ id, body, authorUid, authorName, createdAt }]
const newComment = ref('')
const submitting = ref(false)

const myUid = computed(() => auth.user?.uid || null)
const liked = computed(() => myUid.value && !!likes.value[myUid.value])
const likeCount = computed(() => Object.keys(likes.value).length)
const myReaction = computed(() => myUid.value ? reactions.value[myUid.value] : null)

// 이모지별 개수 (정렬용)
const reactionCounts = computed(() => {
  const map = {}
  for (const e of Object.values(reactions.value)) {
    map[e] = (map[e] || 0) + 1
  }
  return map
})
const sortedReactions = computed(() =>
  REACTIONS.map((e) => ({ emoji: e, count: reactionCounts.value[e] || 0 }))
)

const unsubL = onValue(dbRef(rtdb, nsPath(`savedSquads/${props.squadId}/likes`)), (snap) => {
  likes.value = snap.val() || {}
})
const unsubR = onValue(dbRef(rtdb, nsPath(`savedSquads/${props.squadId}/reactions`)), (snap) => {
  reactions.value = snap.val() || {}
})
const unsubC = onValue(dbRef(rtdb, nsPath(`savedSquads/${props.squadId}/comments`)), (snap) => {
  const v = snap.val() || {}
  comments.value = Object.entries(v).map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
})
onUnmounted(() => { unsubL(); unsubR(); unsubC() })

async function onLike() {
  if (!auth.isAuthed) return toast.error('로그인 후 이용 가능합니다.')
  try {
    await toggleSquadLike(props.squadId)
  } catch (e) {
    toast.error(`실패: ${e?.message || e}`)
  }
}

async function onReact(emoji) {
  if (!auth.isAuthed) return toast.error('로그인 후 이용 가능합니다.')
  try {
    await setSquadReaction(props.squadId, myReaction.value === emoji ? null : emoji)
  } catch (e) {
    toast.error(`실패: ${e?.message || e}`)
  }
}

async function submit() {
  const text = newComment.value.trim()
  if (!text) return
  submitting.value = true
  try {
    await addSquadComment(props.squadId, text)
    newComment.value = ''
  } catch (e) {
    toast.error(`댓글 실패: ${e?.message || e}`)
  } finally {
    submitting.value = false
  }
}

async function removeComment(c) {
  const ok = await confirm({
    title: '댓글 삭제',
    message: '이 댓글을 삭제할까요?',
    confirmText: '삭제',
    variant: 'danger'
  })
  if (!ok) return
  try {
    await deleteSquadComment(props.squadId, c.id)
  } catch (e) {
    toast.error(`삭제 실패: ${e?.message || e}`)
  }
}

function canDelete(c) {
  return auth.isAdmin || (c.authorUid && c.authorUid === myUid.value)
}
</script>

<template>
  <section class="bg-white rounded-2xl shadow p-5 space-y-4">
    <!-- 좋아요 + 이모지 반응 -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-bold disabled:opacity-50"
        :class="liked ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        :disabled="!auth.isAuthed"
        @click="onLike"
      >
        <span>{{ liked ? '❤️' : '🤍' }}</span>
        <span class="tabular-nums">{{ likeCount }}</span>
      </button>

      <div class="flex items-center gap-1 ml-2">
        <button
          v-for="r in sortedReactions" :key="r.emoji"
          type="button"
          class="text-lg w-9 h-9 rounded-full transition-all flex items-center justify-center relative disabled:opacity-50"
          :class="myReaction === r.emoji ? 'bg-amber-100 ring-2 ring-amber-400 scale-110' : 'hover:bg-gray-100'"
          :disabled="!auth.isAuthed"
          @click="onReact(r.emoji)"
          :title="r.emoji + ' ' + r.count + '명'"
        >
          {{ r.emoji }}
          <span v-if="r.count" class="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold bg-navy text-white rounded-full px-1 leading-[14px] min-w-[14px] text-center">{{ r.count }}</span>
        </button>
      </div>
    </div>

    <!-- 댓글 -->
    <div class="border-t border-gray-100 pt-3 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm font-bold text-navy">💬 댓글 <span class="text-xs text-gray-400 font-normal">{{ comments.length }}개</span></p>
      </div>

      <!-- 댓글 입력 -->
      <form v-if="auth.isAuthed" class="flex gap-2" @submit.prevent="submit">
        <input
          v-model="newComment"
          type="text"
          maxlength="500"
          placeholder="댓글 남기기..."
          class="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          class="px-4 py-2 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy/90 disabled:opacity-50"
          :disabled="submitting || !newComment.trim()"
        >등록</button>
      </form>
      <p v-else class="text-xs text-gray-400 text-center py-2">로그인 후 댓글을 남길 수 있어요.</p>

      <!-- 댓글 목록 -->
      <ul v-if="comments.length" class="space-y-2">
        <li v-for="c in comments" :key="c.id" class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-baseline justify-between gap-2 mb-0.5">
            <span class="text-xs font-bold text-navy">{{ c.authorName || '익명' }}</span>
            <span class="text-[10px] text-gray-400">{{ formatDateTime(c.createdAt) }}</span>
          </div>
          <p class="text-sm text-onyx leading-relaxed whitespace-pre-line">{{ c.body }}</p>
          <button
            v-if="canDelete(c)"
            type="button"
            class="text-[10px] text-rose-500 hover:underline mt-1"
            @click="removeComment(c)"
          >삭제</button>
        </li>
      </ul>
      <p v-else class="text-xs text-gray-400 text-center py-3">아직 댓글이 없어요.</p>
    </div>
  </section>
</template>
