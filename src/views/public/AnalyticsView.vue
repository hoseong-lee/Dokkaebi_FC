<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useMatchesStore } from '@/stores/matches'
import { usePlayersStore } from '@/stores/players'
import { useSeasonStore } from '@/stores/season'
import {
  analyzableMatches,
  formationStats,
  playerImpact,
  opponentStats,
  duoWinRates,
  overallRecord
} from '@/utils/analytics'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PlayerAvatar from '@/components/player/PlayerAvatar.vue'

const matchesStore = useMatchesStore()
const playersStore = usePlayersStore()
const seasonStore = useSeasonStore()

const tab = ref('formation') // formation | player | opponent | duo
const seasonFilter = ref('all') // all | seasonId
const loading = ref(true)

const seasonOptions = computed(() => [
  { id: 'all', label: '전체 시즌' },
  ...seasonStore.list.map((s) => ({ id: s.id, label: s.name }))
])

const matches = computed(() =>
  analyzableMatches(
    matchesStore.matches,
    seasonFilter.value === 'all' ? null : seasonFilter.value
  )
)

const overall = computed(() => overallRecord(matches.value))
const formations = computed(() => formationStats(matches.value))
const impacts = computed(() => playerImpact(matches.value, playersStore.players))
const opponents = computed(() => opponentStats(matches.value))
const duos = computed(() => duoWinRates(matches.value, playersStore.players).slice(0, 20))

const topImpact = computed(() => impacts.value.slice(0, 12))
const bottomImpact = computed(() =>
  [...impacts.value].sort((a, b) => a.impact - b.impact).slice(0, 5)
)

async function load() {
  loading.value = true
  await Promise.all([
    seasonStore.ensure(),
    matchesStore.loaded ? Promise.resolve() : matchesStore.fetchAll(),
    playersStore.loaded ? Promise.resolve() : playersStore.fetchAll()
  ])
  loading.value = false
}
onMounted(load)

function pct(n) { return `${Math.round((n || 0) * 100)}%` }
function signed(n) {
  const s = n > 0 ? '+' : ''
  return `${s}${Math.round((n || 0) * 100)}%`
}
function impactTone(impact) {
  if (impact >= 0.15) return 'bg-emerald-500 text-white'
  if (impact >= 0.05) return 'bg-emerald-100 text-emerald-700'
  if (impact <= -0.15) return 'bg-rose-500 text-white'
  if (impact <= -0.05) return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'
}
function rateBar(rate, color = 'bg-emerald-500') {
  return { width: `${Math.max(2, Math.round((rate || 0) * 100))}%` }
}
</script>

<template>
  <div class="pb-8">
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy dark:text-zinc-100 flex items-center gap-2">📊 <span>승률 분석</span></h1>
      <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">포메이션·선수·상대팀·라인업 조합별 승률 인사이트</p>
    </div>

    <!-- 시즌 필터 + 전체 기록 카드 -->
    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4 mb-4">
      <select v-model="seasonFilter" class="w-full border rounded-lg px-3 py-2 text-sm mb-3">
        <option v-for="opt in seasonOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
      </select>
      <div class="grid grid-cols-4 gap-2 text-center">
        <div><p class="text-[10px] text-gray-500 dark:text-zinc-400">경기</p><p class="text-xl font-bold text-navy dark:text-zinc-100">{{ overall.played }}</p></div>
        <div><p class="text-[10px] text-blue-500">승</p><p class="text-xl font-bold text-blue-600">{{ overall.wins }}</p></div>
        <div><p class="text-[10px] text-gray-500 dark:text-zinc-400">무</p><p class="text-xl font-bold text-gray-600 dark:text-zinc-400">{{ overall.draws }}</p></div>
        <div><p class="text-[10px] text-rose-500">패</p><p class="text-xl font-bold text-rose-600">{{ overall.losses }}</p></div>
      </div>
      <div class="mt-2 text-center">
        <span class="text-xs text-gray-500 dark:text-zinc-400">평균 승률 </span>
        <span class="text-lg font-bold text-navy dark:text-zinc-100">{{ pct(overall.winRate) }}</span>
        <span class="text-xs text-gray-400 dark:text-zinc-500 mx-2">·</span>
        <span class="text-xs text-gray-500 dark:text-zinc-400">평균 득점 {{ overall.avgGf.toFixed(1) }} / 실점 {{ overall.avgGa.toFixed(1) }}</span>
      </div>
    </div>

    <!-- 4탭 -->
    <div class="grid grid-cols-4 gap-1 bg-white dark:bg-zinc-800 rounded-xl p-1 mb-4 shadow-sm text-xs">
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'formation' ? 'bg-navy text-white shadow' : 'text-gray-500 dark:text-zinc-400'" @click="tab = 'formation'">📐 포메이션</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'player' ? 'bg-navy text-white shadow' : 'text-gray-500 dark:text-zinc-400'" @click="tab = 'player'">⭐ 선수</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'opponent' ? 'bg-navy text-white shadow' : 'text-gray-500 dark:text-zinc-400'" @click="tab = 'opponent'">🆚 상대팀</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'duo' ? 'bg-navy text-white shadow' : 'text-gray-500 dark:text-zinc-400'" @click="tab = 'duo'">💑 듀오</button>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="overall.played === 0" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-8 text-center text-gray-400 dark:text-zinc-500">
      <p class="text-4xl mb-2">📊</p>
      <p class="text-sm">분석할 경기 데이터가 없어요.</p>
    </div>

    <!-- ─── 포메이션 ─── -->
    <div v-else-if="tab === 'formation'" class="space-y-3">
      <div v-if="formations.length === 0" class="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">
        포메이션이 입력된 경기가 없어요.
      </div>
      <article v-for="f in formations" :key="f.formation" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-navy dark:text-zinc-100 tabular-nums">{{ f.formation }}</span>
            <span class="text-xs text-gray-400 dark:text-zinc-500">{{ f.played }}경기</span>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-navy dark:text-zinc-100">{{ pct(f.winRate) }}</p>
            <p class="text-[10px] text-gray-400 dark:text-zinc-500">승률</p>
          </div>
        </div>
        <!-- 승무패 분포 막대 -->
        <div class="flex h-3 rounded-full overflow-hidden mb-2">
          <div class="bg-blue-500" :style="rateBar(f.winRate)" :title="`승 ${f.wins}`"></div>
          <div class="bg-gray-300" :style="rateBar(f.drawRate)" :title="`무 ${f.draws}`"></div>
          <div class="bg-rose-400" :style="rateBar(f.lossRate)" :title="`패 ${f.losses}`"></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-blue-600 font-semibold">{{ f.wins }}승</span>
          <span class="text-gray-500 dark:text-zinc-400">{{ f.draws }}무</span>
          <span class="text-rose-500 font-semibold">{{ f.losses }}패</span>
          <span class="text-gray-400 dark:text-zinc-500">·</span>
          <span class="text-gray-600 dark:text-zinc-400">평균 {{ f.avgGf.toFixed(1) }}득 / {{ f.avgGa.toFixed(1) }}실 (GD <span :class="f.gd >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ f.gd > 0 ? '+' : '' }}{{ f.gd }}</span>)</span>
        </div>
      </article>
    </div>

    <!-- ─── 선수 (Win-Rate Impact) ─── -->
    <div v-else-if="tab === 'player'" class="space-y-4">
      <p class="text-[11px] text-gray-500 dark:text-zinc-400">
        🔍 본인 출전 시 승률 vs 결장 시 승률 차이.
        +가 클수록 팀에 좋은 영향. (출전 3경기 미만 제외)
      </p>

      <div v-if="impacts.length === 0" class="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">
        분석 가능한 선수가 없어요.
      </div>

      <section v-else class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4">
        <p class="text-sm font-bold text-navy dark:text-zinc-100 mb-3">🏆 Win-Rate Impact TOP</p>
        <ul class="space-y-2.5">
          <li v-for="(it, idx) in topImpact" :key="it.playerId" class="flex items-center gap-3">
            <span class="w-6 text-center text-xs font-bold text-gray-400 dark:text-zinc-500">{{ idx + 1 }}</span>
            <PlayerAvatar :player="it.player" :size="36" />
            <div class="flex-1 min-w-0">
              <RouterLink :to="`/players/${it.playerId}`" class="text-sm font-semibold text-onyx dark:text-zinc-100 hover:underline truncate">{{ it.player.name }}</RouterLink>
              <p class="text-[10px] text-gray-400 dark:text-zinc-500">
                출전 {{ it.withSelf.played }} · 승률 {{ pct(it.withSelf.winRate) }} / 결장 {{ it.withoutSelf.played }} · 승률 {{ pct(it.withoutSelf.winRate) }}
              </p>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full tabular-nums" :class="impactTone(it.impact)">{{ signed(it.impact) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="bottomImpact.length" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4">
        <p class="text-sm font-bold text-rose-700 mb-3">⚠ Win-Rate Impact 하위 (참고용)</p>
        <ul class="space-y-2.5">
          <li v-for="it in bottomImpact" :key="`bot-${it.playerId}`" class="flex items-center gap-3">
            <PlayerAvatar :player="it.player" :size="32" />
            <div class="flex-1 min-w-0">
              <RouterLink :to="`/players/${it.playerId}`" class="text-sm font-medium text-onyx dark:text-zinc-100 hover:underline truncate">{{ it.player.name }}</RouterLink>
              <p class="text-[10px] text-gray-400 dark:text-zinc-500">출전 {{ it.withSelf.played }} · 결장 {{ it.withoutSelf.played }}</p>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full tabular-nums" :class="impactTone(it.impact)">{{ signed(it.impact) }}</span>
          </li>
        </ul>
        <p class="text-[10px] text-gray-400 dark:text-zinc-500 mt-2">
          ※ 결장 경기가 너무 적으면 신뢰도 낮음. 단순 참고만.
        </p>
      </section>
    </div>

    <!-- ─── 상대팀 ─── -->
    <div v-else-if="tab === 'opponent'" class="space-y-3">
      <div v-if="opponents.length === 0" class="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">상대팀 데이터가 없어요.</div>
      <article v-for="o in opponents" :key="o.opponent" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex-1 min-w-0">
            <p class="font-bold text-navy dark:text-zinc-100 truncate">vs {{ o.opponent }}</p>
            <p class="text-[11px] text-gray-400 dark:text-zinc-500">{{ o.played }}전 {{ o.wins }}승 {{ o.draws }}무 {{ o.losses }}패</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold text-navy dark:text-zinc-100">{{ pct(o.winRate) }}</p>
            <p class="text-[10px] text-gray-400 dark:text-zinc-500">승률</p>
          </div>
        </div>
        <div class="flex h-2.5 rounded-full overflow-hidden mb-2">
          <div class="bg-blue-500" :style="rateBar(o.winRate)"></div>
          <div class="bg-gray-300" :style="rateBar(o.drawRate)"></div>
          <div class="bg-rose-400" :style="rateBar(o.lossRate)"></div>
        </div>
        <p class="text-xs text-gray-600 dark:text-zinc-400">
          득실 <span class="font-semibold text-onyx dark:text-zinc-100">{{ o.gf }}</span> : <span class="font-semibold text-onyx dark:text-zinc-100">{{ o.ga }}</span>
          <span :class="o.gd >= 0 ? 'text-emerald-600' : 'text-rose-600'" class="ml-1 font-semibold">({{ o.gd > 0 ? '+' : '' }}{{ o.gd }})</span>
        </p>
      </article>
    </div>

    <!-- ─── 듀오 ─── -->
    <div v-else class="space-y-3">
      <p class="text-[11px] text-gray-500 dark:text-zinc-400">
        💑 같이 출전했을 때의 승률. 출전 3경기 이상만 표시.
      </p>
      <div v-if="duos.length === 0" class="text-center text-sm text-gray-400 dark:text-zinc-500 py-8">
        분석 가능한 듀오가 없어요.
      </div>
      <article v-for="(d, i) in duos" :key="`${d.pair[0].id}-${d.pair[1].id}`" class="bg-white dark:bg-zinc-800 rounded-2xl shadow p-3 flex items-center gap-2">
        <span class="w-6 text-center text-xs font-bold text-gray-400 dark:text-zinc-500">{{ i + 1 }}</span>
        <div class="flex items-center gap-1">
          <PlayerAvatar :player="d.pair[0]" :size="32" />
          <span class="text-gray-300">×</span>
          <PlayerAvatar :player="d.pair[1]" :size="32" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">{{ d.pair[0].name }} × {{ d.pair[1].name }}</p>
          <p class="text-[10px] text-gray-400 dark:text-zinc-500">{{ d.played }}경기 · {{ d.wins }}승 {{ d.draws }}무 {{ d.losses }}패</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-base font-bold text-navy dark:text-zinc-100">{{ pct(d.winRate) }}</p>
          <p class="text-[10px] text-gray-400 dark:text-zinc-500">승률</p>
        </div>
      </article>
    </div>

    <p class="text-[11px] text-gray-400 dark:text-zinc-500 text-center mt-6">
      ※ 풋살·자체전은 제외, 결과 입력된 정식 경기만 집계
    </p>
  </div>
</template>
