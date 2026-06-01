<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { useSeasonStore } from '@/stores/season'
import { usePlayersStore } from '@/stores/players'
import { MATCH_TYPE_LABEL } from '@/utils/match'
import { toInputDateTime, fromInputDateTime, dayjs } from '@/utils/date'
import { required } from '@/utils/validators'
import { useToast } from '@/composables/useToast'
import { parseTimeString, formatTime } from '@/utils/youtube'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SquadMaker from '@/components/match/SquadMaker.vue'

const route = useRoute()
const router = useRouter()
const store = useMatchesStore()
const seasonStore = useSeasonStore()
const playersStore = usePlayersStore()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const squadOpen = ref(false)

const form = reactive({
  opponent: '',
  date: '',
  location: '',
  locationUrl: '',
  type: 'friendly'
})

// 영상 N개. { label, url, startStr, endStr, highlight }
// highlight=true 면 "🏅 베스트 골 모음" 페이지에 자동 노출
const videos = reactive([])
function addVideo() { videos.push({ label: `${videos.length + 1}Q`, url: '', startStr: '', endStr: '', highlight: false }) }
function removeVideo(i) { videos.splice(i, 1) }

function emptySquad() {
  return { lineup: [], formation: '', positions: {} }
}
const squads = reactive([emptySquad(), emptySquad(), emptySquad(), emptySquad()])

const matchForShare = computed(() => ({
  opponent: form.opponent,
  date: form.date ? dayjs(form.date).valueOf() : null,
  location: form.location
}))

const squadCount = computed(() => squads.reduce((n, s) => n + (s.lineup?.length ? 1 : 0), 0))

function loadSquad(i, src) {
  squads[i].lineup = [...(src?.lineup || [])]
  squads[i].formation = src?.formation || ''
  squads[i].positions = { ...(src?.positions || {}) }
}

async function load() {
  await Promise.all([seasonStore.ensure(), playersStore.fetchAll()])
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
  videos.splice(0, videos.length)
  if (Array.isArray(m.videoUrls)) {
    m.videoUrls.forEach((v) => videos.push({
      label: v.label || '',
      url: v.url || '',
      startStr: v.start != null ? formatTime(v.start) : '',
      endStr: v.end != null ? formatTime(v.end) : '',
      highlight: !!v.highlight
    }))
  }
  if (Array.isArray(m.plannedSquads)) {
    for (let i = 0; i < 4; i++) loadSquad(i, m.plannedSquads[i])
    if (m.plannedSquads.some((s) => s?.lineup?.length)) squadOpen.value = true
  } else if (m.plannedSquad) {
    loadSquad(0, m.plannedSquad)
    if (m.plannedSquad.lineup?.length) squadOpen.value = true
  }
}

async function save() {
  if (!required(form.opponent)) return toast.error('상대팀을 입력하세요.')
  if (!required(form.date)) return toast.error('경기 일시를 입력하세요.')

  saving.value = true
  try {
    const plannedSquads = squads.some((s) => s.lineup?.length)
      ? squads.map((s) => ({
          lineup: s.lineup,
          formation: s.formation || null,
          positions: s.positions || {}
        }))
      : null

    const cleanVideos = videos
      .map((v) => {
        const start = parseTimeString(v.startStr)
        const end = parseTimeString(v.endStr)
        return {
          label: (v.label || '').trim(),
          url: (v.url || '').trim(),
          start: start != null ? start : null,
          end: end != null ? end : null,
          highlight: !!v.highlight
        }
      })
      .filter((v) => v.url)
      .map((v) => {
        const out = { label: v.label, url: v.url }
        if (v.start != null) out.start = v.start
        if (v.end != null) out.end = v.end
        if (v.highlight) out.highlight = true
        return out
      })
    const payload = {
      opponent: form.opponent.trim(),
      date: fromInputDateTime(form.date),
      location: form.location.trim(),
      locationUrl: form.locationUrl.trim(),
      type: form.type,
      plannedSquads,
      plannedSquad: null,
      videoUrls: cleanVideos.length ? cleanVideos : null
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
    toast.error(`저장 중 오류: ${e?.code || e?.message || e}`)
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
    <form v-else class="space-y-4" @submit.prevent="save">
      <!-- 기본 정보 -->
      <div class="bg-white rounded-2xl shadow p-5 space-y-4">
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
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="(l, k) in MATCH_TYPE_LABEL"
              :key="k"
              type="button"
              class="flex-1 min-w-[4rem] py-2 rounded-lg text-sm transition-colors"
              :class="form.type === k ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'"
              @click="form.type = k"
            >{{ l }}</button>
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
      </div>

      <!-- 경기 영상 (선택, 쿼터별 분리 가능) -->
      <div class="bg-white rounded-2xl shadow p-5 space-y-3">
        <div class="flex items-center justify-between">
          <p class="font-bold text-navy">📹 경기 영상 (선택)</p>
          <button type="button" class="text-xs px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100" @click="addVideo">+ 영상 추가</button>
        </div>
        <p v-if="videos.length === 0" class="text-xs text-gray-400">유튜브 영상 URL을 등록하면 경기 상세 페이지에서 임베드로 재생됩니다.</p>
        <div v-for="(v, i) in videos" :key="i" class="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
          <div class="flex gap-2 items-center">
            <input v-model="v.label" type="text" maxlength="10" placeholder="라벨 (예: 1Q, 하이라이트)" class="w-32 border rounded-lg px-2 py-1.5 text-sm shrink-0" />
            <input v-model="v.url" type="url" placeholder="https://youtu.be/..." class="flex-1 border rounded-lg px-3 py-1.5 text-sm font-mono min-w-0" />
            <button type="button" class="text-rose-500 hover:bg-rose-50 rounded-full w-7 h-7 flex items-center justify-center shrink-0" @click="removeVideo(i)" title="제거">✕</button>
          </div>
          <div class="flex gap-2 items-center pl-1">
            <span class="text-[11px] text-gray-500 font-semibold shrink-0">⏱ 구간 (선택)</span>
            <input v-model="v.startStr" type="text" placeholder="시작 (1:30)" class="w-24 border rounded-lg px-2 py-1 text-xs font-mono" />
            <span class="text-gray-400 text-xs">~</span>
            <input v-model="v.endStr" type="text" placeholder="끝 (2:45)" class="w-24 border rounded-lg px-2 py-1 text-xs font-mono" />
            <span class="text-[10px] text-gray-400">비워두면 전체 재생</span>
          </div>
          <label class="flex items-center gap-2 pl-1 cursor-pointer">
            <input type="checkbox" v-model="v.highlight" class="w-4 h-4 accent-amber-500" />
            <span class="text-xs text-amber-700 font-semibold">🏅 베스트 골 모음에 노출</span>
          </label>
        </div>
        <p v-if="videos.length > 0" class="text-[11px] text-gray-400">
          ✓ 지원 URL: youtube.com/watch?v= / youtu.be/ / shorts/ / embed/<br>
          ✓ 시간 포맷: <span class="font-mono">1:30</span> (1분 30초) · <span class="font-mono">90</span> (90초) · <span class="font-mono">1:02:30</span> (1시간 2분 30초)
        </p>
      </div>

      <!-- 스쿼드 메이커 (접이식, 4쿼터) -->
      <div class="bg-white rounded-2xl shadow">
        <button
          type="button"
          class="w-full flex items-center justify-between p-5 text-left"
          @click="squadOpen = !squadOpen"
        >
          <span>
            <span class="font-bold text-navy">스쿼드 메이커</span>
            <span class="text-xs text-gray-400 ml-2">
              쿼터별 명단·포메이션 ({{ squadCount }}/4쿼터 작성됨)
            </span>
          </span>
          <span class="text-gray-400">{{ squadOpen ? '▾' : '▸' }}</span>
        </button>
        <div v-if="squadOpen" class="px-5 pb-5 border-t pt-4">
          <SquadMaker :squads="squads" :players="playersStore.activePlayers" :match="matchForShare" />
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <BaseButton type="button" variant="secondary" block @click="router.back()">취소</BaseButton>
        <BaseButton type="submit" :loading="saving" block>{{ isEdit ? '수정' : '등록' }}</BaseButton>
      </div>
    </form>
  </div>
</template>
