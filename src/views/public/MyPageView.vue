<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useToast } from '@/composables/useToast'
import { POSITION_LABEL, POSITION_BADGE_STRONG } from '@/utils/stats'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import AvatarPicker from '@/components/player/AvatarPicker.vue'
import LinkPlayerModal from '@/components/layout/LinkPlayerModal.vue'

const auth = useAuthStore()
const playersStore = usePlayersStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const bio = ref('')
const photoURL = ref('')
const linkModalOpen = ref(false)

const myPlayer = computed(() =>
  auth.myPlayerId ? playersStore.getById(auth.myPlayerId) : null
)

async function load() {
  loading.value = true
  if (!playersStore.loaded) await playersStore.fetchAll()
  if (myPlayer.value) {
    bio.value = myPlayer.value.bio || ''
    photoURL.value = myPlayer.value.photoURL || ''
  }
  loading.value = false
}
onMounted(load)
watch(() => auth.myPlayerId, load)

async function save() {
  if (!myPlayer.value) return
  saving.value = true
  try {
    await playersStore.update(myPlayer.value.id, {
      bio: bio.value.trim() || null,
      photoURL: photoURL.value || null
    })
    toast.success('내 정보를 저장했습니다.')
  } catch (e) {
    toast.error(`저장 실패: ${e?.code || e?.message || e}`)
  } finally {
    saving.value = false
  }
}

function onAvatarSelect(url) {
  photoURL.value = url
}
</script>

<template>
  <div>
    <h1 class="text-xl font-bold text-navy mb-4">내 정보</h1>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-4">
      <!-- 계정 정보 -->
      <section class="bg-white rounded-2xl shadow p-5">
        <h2 class="font-bold text-navy mb-3">계정</h2>
        <div class="flex items-center gap-3">
          <img
            v-if="auth.user?.photoURL"
            :src="auth.user.photoURL"
            referrerpolicy="no-referrer"
            alt="google"
            class="w-14 h-14 rounded-full ring-1 ring-gray-200"
          />
          <div class="flex-1 min-w-0">
            <p class="font-semibold truncate">{{ auth.user?.displayName }}</p>
            <p class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              권한: {{ auth.isAdmin ? '관리자' : '멤버' }}
            </p>
          </div>
        </div>
      </section>

      <!-- 연결된 선수 -->
      <section class="bg-white rounded-2xl shadow p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-navy">연결된 선수</h2>
          <BaseButton size="sm" variant="ghost" @click="linkModalOpen = true">
            {{ myPlayer ? '변경' : '연결' }}
          </BaseButton>
        </div>
        <div v-if="myPlayer" class="flex items-center gap-3">
          <PlayerAvatar :player="myPlayer" :size="56" />
          <div class="flex-1 min-w-0">
            <p class="font-semibold">
              {{ myPlayer.name }}
              <span v-if="myPlayer.number != null" class="text-dokkaebi font-bold">#{{ myPlayer.number }}</span>
              <span v-if="myPlayer.isRegular" class="text-amber-500 text-xs">★</span>
            </p>
            <div class="flex items-center gap-1.5 mt-1">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                :class="POSITION_BADGE_STRONG[myPlayer.position] || 'bg-gray-300 text-white'"
              >
                {{ POSITION_LABEL[myPlayer.position] || myPlayer.position }}
              </span>
              <span v-if="myPlayer.mainPosition" class="text-[10px] text-gray-500">
                {{ myPlayer.mainPosition }}<span v-if="myPlayer.subPosition"> / {{ myPlayer.subPosition }}</span>
              </span>
            </div>
          </div>
        </div>
        <div v-else class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          <p class="font-medium">아직 본인 선수가 연결되지 않았어요.</p>
          <p class="text-xs mt-1">
            관리자가 화이트리스트 추가 시 선수를 지정하면 자동 연결됩니다.<br>
            없으면 위 [연결] 버튼으로 직접 골라주세요. MOM 투표·내 통계 표시에 필요합니다.
          </p>
        </div>
      </section>

      <!-- 프로필 사진 + 한마디 (연결된 선수에만 적용) -->
      <section v-if="myPlayer" class="bg-white rounded-2xl shadow p-5 space-y-5">
        <div>
          <h2 class="font-bold text-navy mb-2">프로필 사진</h2>
          <AvatarPicker :current="photoURL" :name="myPlayer.name" @select="onAvatarSelect" />
          <p class="text-[11px] text-gray-400 mt-2">
            샘플 캐릭터(도깨비FC 유니폼) 또는 직접 사진 업로드.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-navy mb-2">한마디</h2>
          <textarea
            v-model="bio"
            rows="2"
            maxlength="80"
            placeholder="ex) 슈팅보다 도움 더 좋아하는 윙백"
            class="w-full border rounded-lg px-3 py-2 text-sm"
          ></textarea>
          <p class="text-[11px] text-gray-400 mt-1 text-right">{{ bio.length }}/80</p>
        </div>

        <BaseButton :loading="saving" block @click="save">저장</BaseButton>
      </section>
    </div>

    <LinkPlayerModal v-model="linkModalOpen" />
  </div>
</template>
