<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { usePlayersStore } from '@/stores/players'
// 사진 업로드 미사용 — import { uploadPlayerPhoto } from '@/firebase/storage'
import { POSITION_LABEL, FOOT_LABEL } from '@/utils/stats'
import { POSITION_OPTIONS, categoryOf } from '@/utils/positions'
import { required, isPositiveInt } from '@/utils/validators'
import { confirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import AvatarPicker from '@/components/player/AvatarPicker.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const store = usePlayersStore()
const toast = useToast()

const modalOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const filter = ref('all') // all | regular | guest

const form = reactive({
  name: '',
  number: '',
  mainPosition: 'CM',
  subPosition: '',
  preferredFoot: 'R',
  photoURL: '',
  isRegular: true,
  active: true
})

function resetForm() {
  Object.assign(form, {
    name: '',
    number: '',
    mainPosition: 'CM',
    subPosition: '',
    preferredFoot: 'R',
    photoURL: '',
    isRegular: true,
    active: true
  })
}

function openCreate() {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(p) {
  editingId.value = p.id
  Object.assign(form, {
    name: p.name,
    number: p.number ?? '',
    mainPosition: p.mainPosition || 'CM',
    subPosition: p.subPosition || '',
    preferredFoot: p.preferredFoot || 'R',
    photoURL: p.photoURL || '',
    isRegular: p.isRegular !== false,
    active: p.active !== false
  })
  modalOpen.value = true
}

async function save() {
  if (!required(form.name)) return toast.error('이름을 입력하세요.')
  if (form.number !== '' && !isPositiveInt(form.number)) return toast.error('등번호는 0 이상 정수여야 합니다.')

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      number: form.number === '' ? null : Number(form.number),
      mainPosition: form.mainPosition,
      subPosition: form.subPosition || null,
      position: categoryOf(form.mainPosition) || 'MF',
      preferredFoot: form.preferredFoot,
      photoURL: form.photoURL || null,
      isRegular: form.isRegular,
      active: form.active
    }
    let id = editingId.value
    if (id) await store.update(id, payload)
    else id = await store.add(payload)

    toast.success(editingId.value ? '선수 정보를 수정했습니다.' : '선수를 등록했습니다.')
    modalOpen.value = false
  } catch (e) {
    console.error(e)
    toast.error('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

async function remove(p) {
  const ok = await confirm({
    title: '선수 삭제',
    message: `'${p.name}' 선수를 삭제할까요?\n관련 경기 기록은 남지만 통계 집계에서 빠질 수 있습니다.`,
    confirmText: '삭제'
  })
  if (!ok) return
  try {
    await store.remove(p.id)
    toast.success('삭제했습니다.')
  } catch {
    toast.error('삭제 중 오류가 발생했습니다.')
  }
}

const visible = computed(() => {
  const list = store.sortedByPosition()
  if (filter.value === 'regular') return list.filter((p) => p.isRegular)
  if (filter.value === 'guest') return list.filter((p) => !p.isRegular)
  return list
})

onMounted(() => store.fetchAll())
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-navy dark:text-zinc-100">선수 관리</h2>
      <BaseButton size="sm" @click="openCreate">+ 선수 등록</BaseButton>
    </div>

    <div class="flex gap-1.5 mb-3">
      <button
        v-for="f in [{k:'all',l:'전체'},{k:'regular',l:'★ 고정'},{k:'guest',l:'용병'}]"
        :key="f.k"
        class="px-3 py-1.5 rounded-full text-xs"
        :class="filter === f.k ? 'bg-navy text-white' : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'"
        @click="filter = f.k"
      >
        {{ f.l }}
      </button>
    </div>

    <LoadingSpinner v-if="store.loading" label="불러오는 중..." />
    <EmptyState v-else-if="visible.length === 0" icon="👥" title="해당 조건의 선수가 없습니다">
      <BaseButton size="sm" @click="openCreate">선수 등록</BaseButton>
    </EmptyState>

    <ul v-else class="space-y-2">
      <li
        v-for="p in visible"
        :key="p.id"
        class="flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-3"
      >
        <PlayerAvatar :player="p" :size="44" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold truncate">
            <span v-if="p.isRegular" class="text-amber-500">★</span>
            {{ p.name }}
            <span class="text-xs text-gray-400 dark:text-zinc-500">#{{ p.number ?? '-' }}</span>
            <span v-if="!p.isRegular" class="text-[10px] bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 rounded px-1.5 py-0.5 ml-1">용병</span>
            <span v-if="p.active === false" class="text-xs text-gray-400 dark:text-zinc-500">(은퇴)</span>
          </p>
          <p class="text-xs text-gray-500 dark:text-zinc-400">
            {{ p.mainPosition || POSITION_LABEL[p.position] }}<span v-if="p.subPosition"> / {{ p.subPosition }}</span>
          </p>
        </div>
        <BaseButton variant="ghost" size="sm" @click="openEdit(p)">수정</BaseButton>
        <BaseButton variant="ghost" size="sm" @click="remove(p)">삭제</BaseButton>
      </li>
    </ul>

    <BaseModal v-model="modalOpen" :title="editingId ? '선수 수정' : '선수 등록'">
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-2">프로필 사진</label>
          <AvatarPicker
            :current="form.photoURL"
            :name="form.name"
            @select="(url) => (form.photoURL = url)"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-1">이름</label>
          <input v-model="form.name" type="text" class="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-1">등번호</label>
            <input v-model="form.number" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-1">주발</label>
            <select v-model="form.preferredFoot" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option v-for="(l, k) in FOOT_LABEL" :key="k" :value="k">{{ l }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-1">메인 포지션</label>
            <select v-model="form.mainPosition" class="w-full border rounded-lg px-3 py-2 text-sm">
              <optgroup v-for="g in POSITION_OPTIONS" :key="g.group" :label="g.group">
                <option v-for="p in g.items" :key="p" :value="p">{{ p }}</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-zinc-400 mb-1">서브 포지션</label>
            <select v-model="form.subPosition" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">없음</option>
              <optgroup v-for="g in POSITION_OPTIONS" :key="g.group" :label="g.group">
                <option v-for="p in g.items" :key="p" :value="p">{{ p }}</option>
              </optgroup>
            </select>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isRegular" type="checkbox" class="rounded" />
          ★ 고정멤버 (체크 해제 시 용병)
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.active" type="checkbox" class="rounded" />
          현역 (은퇴 시 체크 해제)
        </label>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="modalOpen = false">취소</BaseButton>
        <BaseButton :loading="saving" @click="save">저장</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
