<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import { useMatchesStore } from '@/stores/matches'
import { useToast } from '@/composables/useToast'
import { POSITION_LABEL, POSITION_BADGE_STRONG, seasonStatsOf } from '@/utils/stats'
import { personalPartners } from '@/utils/duos'
import { computePlayerBadges, BADGE_TONE } from '@/utils/badges'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'
import PlayerStatsCards from '@/components/player/PlayerStatsCards.vue'
import AvatarPicker from '@/components/player/AvatarPicker.vue'
import ClubPicker from '@/components/player/ClubPicker.vue'
import LinkPlayerModal from '@/components/layout/LinkPlayerModal.vue'

const auth = useAuthStore()
const playersStore = usePlayersStore()
const seasonStore = useSeasonStore()
const matchesStore = useMatchesStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const bio = ref('')
const photoURL = ref('')
const favoriteClub = ref('')
const favoritePlayer = ref('')
const linkModalOpen = ref(false)

const myPlayer = computed(() =>
  auth.myPlayerId ? playersStore.getById(auth.myPlayerId) : null
)

const seasonName = computed(() => seasonStore.activeSeason?.name || '이번 시즌')
const seasonStats = computed(() => {
  if (!myPlayer.value) return null
  if (seasonStore.activeId) return seasonStatsOf(myPlayer.value, seasonStore.activeId)
  return myPlayer.value.stats || {}
})
const totalStats = computed(() => myPlayer.value?.stats || {})

const topPartners = computed(() => {
  if (!myPlayer.value) return []
  return personalPartners(myPlayer.value.id, matchesStore.matches).slice(0, 2)
    .map((p) => ({ ...p, player: playersStore.getById(p.partnerId) }))
    .filter((p) => p.player)
})

const myBadges = computed(() => {
  if (!myPlayer.value) return []
  return computePlayerBadges(
    myPlayer.value,
    matchesStore.matches,
    playersStore.players,
    seasonStore.list
  ).slice(0, 4)
})

async function load() {
  loading.value = true
  await Promise.all([
    seasonStore.ensure(),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll(),
    matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll()
  ])
  if (myPlayer.value) {
    bio.value = myPlayer.value.bio || ''
    photoURL.value = myPlayer.value.photoURL || ''
    favoriteClub.value = myPlayer.value.favoriteClub || ''
    favoritePlayer.value = myPlayer.value.favoritePlayer || ''
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
      photoURL: photoURL.value || null,
      favoriteClub: favoriteClub.value.trim() || null,
      favoritePlayer: favoritePlayer.value.trim() || null
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

      <!-- 내 시즌 통계 (연결된 선수에만) -->
      <section v-if="myPlayer && seasonStats" class="bg-white rounded-2xl shadow p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-navy">내 기록 · {{ seasonName }}</h2>
          <RouterLink :to="`/players/${myPlayer.id}`" class="text-xs text-navy hover:underline">
            전체 보기 →
          </RouterLink>
        </div>
        <PlayerStatsCards :stats="seasonStats" />
        <p class="text-center text-xs text-gray-400 mt-2">
          통산 {{ totalStats.appearances || 0 }}경기 · {{ totalStats.goals || 0 }}G · {{ totalStats.assists || 0 }}A · {{ totalStats.momCount || 0 }}MOM
        </p>
      </section>

      <!-- 내 단짝 + 뱃지 -->
      <section v-if="myPlayer && (topPartners.length || myBadges.length)" class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div v-if="topPartners.length">
          <h2 class="font-bold text-navy mb-2">⭐ 내 단짝</h2>
          <ul class="space-y-1.5">
            <li
              v-for="p in topPartners"
              :key="p.partnerId"
              class="flex items-center gap-2 text-sm"
            >
              <PlayerAvatar :player="p.player" :size="32" />
              <RouterLink :to="`/players/${p.partnerId}`" class="flex-1 font-medium hover:underline">
                {{ p.player.name }}
              </RouterLink>
              <span class="text-xs text-gray-500">콤비 <span class="font-bold text-navy">{{ p.count }}</span>회</span>
            </li>
          </ul>
        </div>
        <div v-if="myBadges.length">
          <h2 class="font-bold text-navy mb-2">🏅 내 뱃지</h2>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="b in myBadges"
              :key="b.id"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold"
              :class="BADGE_TONE[b.icon] || 'bg-gray-50 text-gray-700 border-gray-200'"
              :title="b.desc"
            >
              <span>{{ b.icon }}</span>{{ b.label }}
            </span>
          </div>
          <RouterLink :to="`/players/${myPlayer.id}`" class="text-[11px] text-navy hover:underline mt-2 inline-block">
            전체 뱃지 보기 →
          </RouterLink>
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h2 class="font-bold text-navy mb-2">⚽ 좋아하는 클럽</h2>
            <ClubPicker v-model="favoriteClub" />
          </div>
          <div>
            <h2 class="font-bold text-navy mb-2">⭐ 최애 선수</h2>
            <input
              v-model="favoritePlayer"
              type="text"
              maxlength="30"
              placeholder="예: 메시"
              class="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <BaseButton :loading="saving" block @click="save">저장</BaseButton>
      </section>
    </div>

    <LinkPlayerModal v-model="linkModalOpen" />
  </div>
</template>
