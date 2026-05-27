<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { useSeasonStore } from '@/stores/season'
import { MATCH_TYPE_LABEL } from '@/utils/match'
import { toInputDateTime, fromInputDateTime } from '@/utils/date'
import { required } from '@/utils/validators'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const seasonStore = useSeasonStore()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  opponent: '',
  date: '',
  location: '',
  locationUrl: '',
  type: 'friendly'
})

async function load() {
  await seasonStore.ensure()
  if (!isEdit.value) return
  loading.value = true
  const m = await store.fetchOne(route.params.id)
  loading.value = false
  if (!m) {
    toast.error('경기를 찾을 수 없습니다.')
    return router.replace('/admin')
  }
  Object.assign(form, {
    opponent: m.opponent,
    date: toInputDateTime(m.date),
    location: m.location || '',
    locationUrl: m.locationUrl || '',
    type: m.type || 'friendly'
  })
}

async function save() {
  if (!required(form.opponent)) return toast.error('상대팀을 입력하세요.')
  if (!required(form.date)) return toast.error('경기 일시를 입력하세요.')

  saving.value = true
  try {
    const payload = {
      opponent: form.opponent.trim(),
      date: fromInputDateTime(form.date),
      location: form.location.trim(),
      locationUrl: form.locationUrl.trim(),
      type: form.type
    }
    if (isEdit.value) {
      await store.update(route.params.id, payload)
      toast.success('경기를 수정했습니다.')
      router.push(`/matches/${route.params.id}`)
    } else {
      payload.seasonId = seasonStore.activeId
      const id = await store.add(payload)
      toast.success('경기를 등록했습니다.')
      router.push(`/matches/${id}`)
    }
  } catch (e) {
    console.error(e)
    toast.error('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 class="font-bold text-navy mb-4">{{ isEdit ? '경기 수정' : '경기 등록' }}</h2>

    <LoadingSpinner v-if="loading" />
    <form v-else class="bg-white rounded-2xl shadow p-5 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-xs text-gray-500 mb-1">상대팀</label>
        <input v-model="form.opponent" type="text" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="상대팀 이름" />
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">경기 일시</label>
        <input v-model="form.date" type="datetime-local" class="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">경기 종류</label>
        <div class="flex gap-1.5">
          <button
            v-for="(l, k) in MATCH_TYPE_LABEL"
            :key="k"
            type="button"
            class="flex-1 py-2 rounded-lg text-sm transition-colors"
            :class="form.type === k ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'"
            @click="form.type = k"
          >
            {{ l }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">경기장</label>
        <input v-model="form.location" type="text" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="경기장 이름" />
      </div>

      <div>
        <label class="block text-xs text-gray-500 mb-1">지도 링크 (선택)</label>
        <input v-model="form.locationUrl" type="url" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://map..." />
      </div>

      <div class="flex gap-2 pt-2">
        <BaseButton type="button" variant="secondary" block @click="router.back()">취소</BaseButton>
        <BaseButton type="submit" :loading="saving" block>{{ isEdit ? '수정' : '등록' }}</BaseButton>
      </div>
    </form>
  </div>
</template>
