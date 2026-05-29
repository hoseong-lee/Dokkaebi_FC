<script setup>
import { ref, computed } from 'vue'
import { POSITIONS, FORMATIONS, CONCEPTS, RULES, CLUB_RULES, VIDEOS, YT_BASE } from '@/utils/soccerGuide'
import VideoLinks from '@/components/guide/VideoLinks.vue'

const tab = ref('position')

const activePos = ref(POSITIONS[0].code)
const activePosObj = computed(() => POSITIONS.find((p) => p.code === activePos.value))

const activeRule = ref(RULES[0].code)
const activeRuleObj = computed(() => RULES.find((r) => r.code === activeRule.value))

function ytLink(q) { return YT_BASE + encodeURIComponent(q) }
function videoUrl(v) { return v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : ytLink(v.q) }
function thumbUrl(v) { return v.videoId ? `https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg` : '' }

function dots(rows) {
  const out = []
  const totalRows = rows.length
  rows.forEach((n, rowIdx) => {
    const y = 125 - (rowIdx + 1) * (115 / (totalRows + 1))
    for (let i = 0; i < n; i++) {
      const x = ((i + 1) * 100) / (n + 1)
      out.push({ x, y })
    }
  })
  out.unshift({ x: 50, y: 132, gk: true })
  return out
}
</script>

<template>
  <div class="pb-8">
    <div class="mb-5">
      <h1 class="text-xl font-bold text-navy flex items-center gap-2">
        ⚽ <span>축구 가이드</span>
      </h1>
      <p class="text-xs text-gray-500 mt-1">전술 노트 · 포지션 · 포메이션 · 모던 컨셉 · 기본 규칙 · 관련 영상</p>
    </div>

    <!-- 4탭 -->
    <div class="grid grid-cols-4 gap-1 bg-white rounded-xl p-1 mb-5 shadow-sm text-xs">
      <button type="button" class="py-2.5 rounded-lg font-medium transition-colors" :class="tab === 'position' ? 'bg-navy text-white shadow' : 'text-gray-500'" @click="tab = 'position'">👤 포지션</button>
      <button type="button" class="py-2.5 rounded-lg font-medium transition-colors" :class="tab === 'formation' ? 'bg-navy text-white shadow' : 'text-gray-500'" @click="tab = 'formation'">📐 포메이션</button>
      <button type="button" class="py-2.5 rounded-lg font-medium transition-colors" :class="tab === 'concept' ? 'bg-navy text-white shadow' : 'text-gray-500'" @click="tab = 'concept'">⚡ 컨셉</button>
      <button type="button" class="py-2.5 rounded-lg font-medium transition-colors" :class="tab === 'rule' ? 'bg-navy text-white shadow' : 'text-gray-500'" @click="tab = 'rule'">📜 규칙</button>
    </div>

    <!-- ─── 포지션 탭 ─── -->
    <div v-if="tab === 'position'" class="space-y-5">
      <!-- 칩 셀렉터 -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in POSITIONS" :key="p.code" type="button"
          class="px-3 py-2 rounded-full text-xs font-semibold ring-1 transition-all"
          :class="activePos === p.code ? p.tone + ' scale-105 shadow' : 'bg-white text-gray-500 ring-gray-200'"
          @click="activePos = p.code"
        >{{ p.code }} {{ p.name }}</button>
      </div>

      <!-- 상세 카드 -->
      <article v-if="activePosObj" class="bg-white rounded-2xl shadow-md overflow-hidden">
        <!-- 헤더 -->
        <header class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span class="px-3 py-1.5 rounded-lg text-base font-bold ring-1" :class="activePosObj.tone">{{ activePosObj.code }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy text-base leading-tight">{{ activePosObj.name }}</p>
            <p class="text-[11px] text-gray-400 mt-0.5">{{ activePosObj.en }} · <span class="italic">{{ activePosObj.nickname }}</span></p>
          </div>
        </header>

        <div class="p-5 space-y-5">
          <!-- 핵심 역할 -->
          <section>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-navy"></span>
              <h3 class="text-xs font-bold text-navy">🎯 핵심 역할</h3>
            </div>
            <p class="text-sm text-onyx leading-7 pl-3">{{ activePosObj.role }}</p>
          </section>

          <!-- 전통 vs 모던 -->
          <section>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-amber-500"></span>
              <h3 class="text-xs font-bold text-navy">📜 진화</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div class="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p class="text-[10px] text-gray-500 font-bold mb-1.5 tracking-wide">▪ 전통</p>
                <p class="text-xs text-onyx leading-6">{{ activePosObj.evolution.traditional }}</p>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-3">
                <p class="text-[10px] text-amber-700 font-bold mb-1.5 tracking-wide">🔥 모던</p>
                <p class="text-xs text-onyx leading-6">{{ activePosObj.evolution.modern }}</p>
              </div>
            </div>
          </section>

          <!-- 페이즈별 임무 -->
          <section>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-emerald-500"></span>
              <h3 class="text-xs font-bold text-navy">⚙️ 페이즈별 임무</h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-blue-50 rounded-lg p-3"><p class="text-[10px] text-blue-700 font-bold mb-1">🛡 수비 시</p><p class="text-xs text-onyx leading-6">{{ activePosObj.phases.defend }}</p></div>
              <div class="bg-emerald-50 rounded-lg p-3"><p class="text-[10px] text-emerald-700 font-bold mb-1">📤 빌드업</p><p class="text-xs text-onyx leading-6">{{ activePosObj.phases.buildup }}</p></div>
              <div class="bg-amber-50 rounded-lg p-3"><p class="text-[10px] text-amber-700 font-bold mb-1">⚡ 전환</p><p class="text-xs text-onyx leading-6">{{ activePosObj.phases.transition }}</p></div>
              <div class="bg-rose-50 rounded-lg p-3"><p class="text-[10px] text-rose-700 font-bold mb-1">🎯 박스 안</p><p class="text-xs text-onyx leading-6">{{ activePosObj.phases.box }}</p></div>
            </div>
          </section>

          <!-- 요구 능력 -->
          <section>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-violet-500"></span>
              <h3 class="text-xs font-bold text-navy">💪 요구 능력</h3>
            </div>
            <div class="flex flex-wrap gap-1.5 pl-3">
              <span v-for="s in activePosObj.skills" :key="s" class="text-[11px] px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 font-medium">{{ s }}</span>
            </div>
          </section>

          <!-- 대표 선수 -->
          <section>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-rose-500"></span>
              <h3 class="text-xs font-bold text-navy">⭐ 대표 선수</h3>
            </div>
            <ul class="space-y-1.5 pl-3">
              <li v-for="pl in activePosObj.players" :key="pl.name" class="flex items-baseline gap-2">
                <span class="text-rose-500">●</span>
                <span class="font-bold text-sm text-onyx">{{ pl.name }}</span>
                <span class="text-xs text-gray-400">{{ pl.club }}</span>
              </li>
            </ul>
          </section>

          <!-- 동호회 TIP -->
          <section class="bg-gradient-to-r from-navy/5 to-gold/10 border-l-4 border-gold rounded-r-lg p-3.5">
            <p class="text-xs text-navy font-bold mb-1.5">💡 동호회 TIP</p>
            <p class="text-sm text-onyx leading-7">{{ activePosObj.tip }}</p>
          </section>

          <VideoLinks :videos="VIDEOS[activePosObj.code]" />
        </div>
      </article>

      <!-- 전체 그리드 미리보기 -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          v-for="p in POSITIONS" :key="`mini-${p.code}`" type="button"
          class="text-left p-3.5 rounded-xl bg-white shadow-sm hover:shadow transition-shadow"
          @click="activePos = p.code"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] px-2 py-0.5 rounded ring-1 font-bold" :class="p.tone">{{ p.code }}</span>
            <span class="text-[10px] text-gray-400 truncate ml-1">{{ p.players[0].name }}</span>
          </div>
          <p class="text-xs font-bold text-navy">{{ p.name }}</p>
          <p class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{{ p.nickname }}</p>
        </button>
      </div>
    </div>

    <!-- ─── 포메이션 탭 ─── -->
    <div v-else-if="tab === 'formation'" class="space-y-4">
      <article
        v-for="f in FORMATIONS" :key="f.name"
        class="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <header class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span class="text-2xl font-bold text-navy tabular-nums">{{ f.name }}</span>
          <span class="text-[11px] px-2.5 py-1 rounded-full ring-1 font-semibold" :class="f.tone">{{ f.tag }}</span>
        </header>

        <div class="p-5 space-y-4">
          <!-- 미니피치 + 구조/빌드업/수비/트리거 -->
          <div class="flex gap-4">
            <svg viewBox="0 0 100 140" class="w-24 h-32 shrink-0 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-inner">
              <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" stroke-opacity="0.6" stroke-width="0.5" />
              <line x1="2" y1="70" x2="98" y2="70" stroke="white" stroke-opacity="0.4" stroke-width="0.3" />
              <circle cx="50" cy="70" r="10" fill="none" stroke="white" stroke-opacity="0.4" stroke-width="0.3" />
              <circle v-for="(d, i) in dots(f.rows)" :key="i" :cx="d.x" :cy="d.y" r="3.8" :fill="d.gk ? '#fbbf24' : 'white'" stroke="#0a2540" stroke-width="0.5" />
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">구조</p>
              <p class="font-mono text-[11px] text-onyx mb-2.5 break-all">{{ f.structure }}</p>
              <div class="space-y-1.5 text-xs">
                <p class="leading-6"><span class="text-emerald-700 font-bold">📤 빌드업</span><br/><span class="text-onyx">{{ f.buildup }}</span></p>
                <p class="leading-6"><span class="text-blue-700 font-bold">🛡 수비</span><br/><span class="text-onyx">{{ f.defense }}</span></p>
                <p class="leading-6"><span class="text-rose-700 font-bold">⚡ 압박</span><br/><span class="text-onyx">{{ f.trigger }}</span></p>
              </div>
            </div>
          </div>

          <!-- 장단점 -->
          <div>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">장단점</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="p in f.pros" :key="p" class="text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium">+ {{ p }}</span>
              <span v-for="c in f.cons" :key="c" class="text-[11px] px-2 py-1 rounded-md bg-rose-50 text-rose-700 font-medium">− {{ c }}</span>
            </div>
          </div>

          <!-- 상성 -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-emerald-50 border-l-4 border-emerald-500 rounded p-3">
              <p class="text-[10px] text-emerald-700 font-bold mb-1">💪 강함</p>
              <p class="text-xs text-onyx leading-6">{{ f.matchups.strong }}</p>
            </div>
            <div class="bg-rose-50 border-l-4 border-rose-500 rounded p-3">
              <p class="text-[10px] text-rose-700 font-bold mb-1">🩹 약함</p>
              <p class="text-xs text-onyx leading-6">{{ f.matchups.weak }}</p>
            </div>
          </div>

          <!-- 대표 사례 -->
          <div>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">대표 사례</p>
            <ul class="space-y-1.5">
              <li v-for="e in f.examples" :key="e.coach + e.years" class="text-xs leading-6">
                <span class="font-bold text-navy">{{ e.coach }}</span>
                <span class="text-gray-500"> · {{ e.club }} ({{ e.years }})</span>
                <br/>
                <span class="text-gray-400 ml-2">└ {{ e.achievement }}</span>
              </li>
            </ul>
          </div>

          <!-- 동호회 TIP -->
          <div class="bg-gradient-to-r from-navy/5 to-gold/10 border-l-4 border-gold rounded-r-lg p-3.5">
            <p class="text-xs text-navy font-bold mb-1.5">💡 동호회 TIP</p>
            <p class="text-sm text-onyx leading-7">{{ f.tip }}</p>
          </div>

          <VideoLinks :videos="VIDEOS[f.name]" />
        </div>
      </article>

      <!-- 동호회 6 RULES -->
      <div class="bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl shadow-md p-5">
        <p class="font-bold mb-3 flex items-center gap-2 text-base">📋 동호회 6 RULES</p>
        <p class="text-[11px] opacity-70 mb-4 -mt-2">한국 풀코트 11인 기준 실전 가이드</p>
        <ul class="space-y-2.5">
          <li v-for="r in CLUB_RULES" :key="r.n" class="flex gap-2.5 text-sm leading-7">
            <span class="shrink-0 w-7 h-7 rounded-full bg-gold text-onyx text-xs font-bold flex items-center justify-center">{{ r.n }}</span>
            <span class="opacity-95">{{ r.rule }}</span>
          </li>
        </ul>
      </div>

      <p class="text-[11px] text-gray-400 text-center mt-2">
        ⚠ 포메이션은 시작점일 뿐. 경기 중 빌드업/수비 시 형태가 계속 바뀝니다.
      </p>
    </div>

    <!-- ─── 모던 컨셉 탭 ─── -->
    <div v-else-if="tab === 'concept'" class="space-y-4">
      <article
        v-for="c in CONCEPTS" :key="c.name"
        class="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <header class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span class="text-3xl">{{ c.icon }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy text-base">{{ c.name }}</p>
            <p class="text-[11px] text-gray-400 mt-0.5">{{ c.en }}</p>
          </div>
        </header>

        <div class="p-5 space-y-3.5">
          <p class="text-sm text-onyx leading-7 bg-gray-50 rounded-lg p-3.5 border-l-4 border-navy/30">{{ c.definition }}</p>

          <div>
            <p class="text-[10px] text-emerald-700 font-bold mb-1 uppercase tracking-wide">⚙️ 메커니즘</p>
            <p class="text-xs text-onyx leading-6 pl-2">{{ c.mechanism }}</p>
          </div>

          <div>
            <p class="text-[10px] text-blue-700 font-bold mb-1 uppercase tracking-wide">📍 대표 적용</p>
            <ul class="text-xs text-onyx space-y-1 pl-2">
              <li v-for="ex in c.examples" :key="ex" class="leading-6">· {{ ex }}</li>
            </ul>
          </div>

          <div class="bg-rose-50 border-l-4 border-rose-500 rounded-r p-3">
            <p class="text-[10px] text-rose-700 font-bold mb-1 uppercase tracking-wide">⚠ 한계</p>
            <p class="text-xs text-onyx leading-6">{{ c.limit }}</p>
          </div>

          <VideoLinks :videos="VIDEOS[c.name]" />
        </div>
      </article>
    </div>

    <!-- ─── 기본 규칙 탭 ─── -->
    <div v-else class="space-y-5">
      <!-- 칩 셀렉터 -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="r in RULES" :key="r.code" type="button"
          class="px-3 py-2 rounded-full text-xs font-semibold transition-all"
          :class="activeRule === r.code ? r.tone + ' ring-1 ring-current scale-105 shadow' : 'bg-white text-gray-500 ring-1 ring-gray-200'"
          @click="activeRule = r.code"
        >{{ r.icon }} {{ r.name }}</button>
      </div>

      <!-- 선택 룰 상세 -->
      <article v-if="activeRuleObj" class="bg-white rounded-2xl shadow-md overflow-hidden">
        <header class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <span class="text-3xl">{{ activeRuleObj.icon }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy text-base">{{ activeRuleObj.name }}</p>
            <p class="text-[11px] text-gray-400 font-mono mt-0.5">IFAB {{ activeRuleObj.law }}</p>
          </div>
        </header>

        <div class="p-5 space-y-4">
          <p class="text-sm text-onyx leading-7 font-semibold bg-amber-50 border-l-4 border-amber-500 rounded-r p-3.5">{{ activeRuleObj.summary }}</p>

          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1 h-4 rounded bg-navy"></span>
              <h3 class="text-xs font-bold text-navy">📖 상세 규정</h3>
            </div>
            <p class="text-xs text-onyx leading-7 pl-3">{{ activeRuleObj.detail }}</p>
          </div>

          <div class="bg-rose-50 border-l-4 border-rose-500 rounded-r p-3.5">
            <p class="text-[10px] text-rose-700 font-bold mb-1 uppercase tracking-wide">🚨 위반 처리</p>
            <p class="text-xs text-onyx leading-6">{{ activeRuleObj.foul }}</p>
          </div>

          <div class="bg-gradient-to-r from-navy/5 to-gold/10 border-l-4 border-gold rounded-r p-3.5">
            <p class="text-xs text-navy font-bold mb-1.5">💡 동호회 TIP</p>
            <p class="text-sm text-onyx leading-7">{{ activeRuleObj.tip }}</p>
          </div>

          <VideoLinks :videos="VIDEOS[activeRuleObj.code]" />
        </div>
      </article>

      <!-- 빠른 참조 그리드 -->
      <div>
        <p class="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wide">📑 빠른 참조</p>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="r in RULES" :key="`q-${r.code}`" type="button"
            class="text-left p-3.5 rounded-xl bg-white shadow-sm hover:shadow transition-shadow"
            @click="activeRule = r.code"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-lg">{{ r.icon }}</span>
              <p class="text-xs font-bold text-navy">{{ r.name }}</p>
            </div>
            <p class="text-[10px] text-gray-500 line-clamp-2 leading-5">{{ r.summary }}</p>
          </button>
        </div>
      </div>

      <p class="text-[11px] text-gray-400 text-center mt-3">
        🏛 IFAB Laws of the Game 2024-25 기준 · 동호회는 자체 합의 룰 우선
      </p>
    </div>
  </div>
</template>
