<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '@/firebase/database'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const form = reactive({ title: '', body: '' })

onMounted(async () => {
  if (!isEdit.value) return
  loading.value = true
  const p = await getPost(route.params.id)
  loading.value = false
  if (!p) {
    toast.error('글을 찾을 수 없습니다.')
    return router.replace('/board')
  }
  if (p.authorUid !== auth.user?.uid && !auth.isAdmin) {
    toast.error('수정 권한이 없습니다.')
    return router.replace(`/board/${p.id}`)
  }
  form.title = p.title
  form.body = p.body
})

async function save() {
  if (!form.title.trim() || !form.body.trim()) return toast.error('제목과 내용을 입력하세요.')
  saving.value = true
  try {
    let id = route.params.id
    if (id) await updatePost(id, { ...form })
    else id = await createPost({ ...form })
    toast.success(isEdit.value ? '수정했습니다.' : '게시했습니다.')
    router.push(`/board/${id}`)
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">{{ isEdit ? '글 수정' : '글쓰기' }}</h1>
    <LoadingSpinner v-if="loading" />
    <form v-else class="bg-white rounded-2xl shadow p-5 space-y-3" @submit.prevent="save">
      <input v-model="form.title" type="text" placeholder="제목" class="w-full border rounded-lg px-3 py-2 text-sm" />
      <textarea v-model="form.body" rows="10" placeholder="내용을 작성하세요" class="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
      <div class="flex gap-2 pt-2">
        <BaseButton type="button" variant="secondary" block @click="router.back()">취소</BaseButton>
        <BaseButton type="submit" :loading="saving" block>{{ isEdit ? '수정' : '게시' }}</BaseButton>
      </div>
    </form>
  </div>
</template>
