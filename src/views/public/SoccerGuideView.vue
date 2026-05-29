<script setup>
import { ref, computed } from 'vue'
import { POSITIONS, FORMATIONS, CONCEPTS, RULES, CLUB_RULES } from '@/utils/soccerGuide'

const tab = ref('position') // position | formation | concept | rule

const activePos = ref(POSITIONS[0].code)
const activePosObj = computed(() => POSITIONS.find((p) => p.code === activePos.value))

const activeRule = ref(RULES[0].code)
const activeRuleObj = computed(() => RULES.find((r) => r.code === activeRule.value))

// 미니 피치 점 배치 — SVG viewBox 100x140
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
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy flex items-center gap-2">
        ⚽ <span>축구 가이드</span>
      </h1>
      <p class="text-xs text-gray-500 mt-1">전술 노트 — 포지션·포메이션·모던 컨셉·기본 규칙</p>
    </div>

    <!-- 4탭 -->
    <div class="grid grid-cols-4 gap-1 bg-white rounded-xl p-1 mb-4 shadow-sm text-xs">
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'position' ? 'bg-navy text-white' : 'text-gray-500'" @click="tab = 'position'">👤 포지션</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'formation' ? 'bg-navy text-white' : 'text-gray-500'" @click="tab = 'formation'">📐 포메이션</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'concept' ? 'bg-navy text-white' : 'text-gray-500'" @click="tab = 'concept'">⚡ 모던 컨셉</button>
      <button type="button" class="py-2 rounded-lg font-medium transition-colors" :class="tab === 'rule' ? 'bg-navy text-white' : 'text-gray-500'" @click="tab = 'rule'">📜 규칙</button>
    </div>

    <!-- ─── 포지션 탭 ─── -->
    <div v-if="tab === 'position'" class="space-y-4">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in POSITIONS"
          :key="p.code"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all"
          :class="activePos === p.code ? p.tone + ' scale-105 shadow-sm' : 'bg-white text-gray-500 ring-gray-200'"
          @click="activePos = p.code"
        >{{ p.code }} {{ p.name }}</button>
      </div>

      <div v-if="activePosObj" class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex items-center gap-3">
          <span class="px-3 py-1.5 rounded-lg text-sm font-bold ring-1" :class="activePosObj.tone">{{ activePosObj.code }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy text-base">{{ activePosObj.name }}</p>
            <p class="text-[11px] text-gray-400">{{ activePosObj.en }} · <span class="italic">{{ activePosObj.nickname }}</span></p>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1">🎯 핵심 역할</p>
          <p class="text-sm text-onyx leading-relaxed">{{ activePosObj.role }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-gray-50 rounded-lg p-2.5">
            <p class="text-[10px] text-gray-500 font-semibold mb-0.5">📜 전통</p>
            <p class="text-xs text-onyx leading-snug">{{ activePosObj.evolution.traditional }}</p>
          </div>
          <div class="bg-amber-50 rounded-lg p-2.5">
            <p class="text-[10px] text-amber-700 font-semibold mb-0.5">🔥 모던</p>
            <p class="text-xs text-onyx leading-snug">{{ activePosObj.evolution.modern }}</p>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5">⚙️ 페이즈별 임무</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-blue-50 rounded p-2"><p class="text-[10px] text-blue-700 font-semibold">수비 시</p><p class="text-xs text-onyx mt-0.5">{{ activePosObj.phases.defend }}</p></div>
            <div class="bg-emerald-50 rounded p-2"><p class="text-[10px] text-emerald-700 font-semibold">빌드업</p><p class="text-xs text-onyx mt-0.5">{{ activePosObj.phases.buildup }}</p></div>
            <div class="bg-amber-50 rounded p-2"><p class="text-[10px] text-amber-700 font-semibold">전환</p><p class="text-xs text-onyx mt-0.5">{{ activePosObj.phases.transition }}</p></div>
            <div class="bg-rose-50 rounded p-2"><p class="text-[10px] text-rose-700 font-semibold">박스 안</p><p class="text-xs text-onyx mt-0.5">{{ activePosObj.phases.box }}</p></div>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5">💪 요구 능력</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="s in activePosObj.skills" :key="s" class="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{{ s }}</span>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5">⭐ 대표 선수</p>
          <ul class="text-sm text-onyx space-y-0.5">
            <li v-for="pl in activePosObj.players" :key="pl.name" class="flex items-baseline gap-2">
              <span class="font-semibold">· {{ pl.name }}</span>
              <span class="text-xs text-gray-400">{{ pl.club }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-gradient-to-r from-navy/5 to-gold/10 rounded-lg p-3">
          <p class="text-xs text-navy font-semibold mb-1">💡 동호회 TIP</p>
          <p class="text-sm text-onyx leading-relaxed">{{ activePosObj.tip }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in POSITIONS"
          :key="`mini-${p.code}`"
          type="button"
          class="text-left p-3 rounded-xl bg-white shadow-sm hover:shadow transition-shadow"
          @click="activePos = p.code"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] px-2 py-0.5 rounded ring-1 font-bold" :class="p.tone">{{ p.code }}</span>
            <span class="text-[10px] text-gray-400 truncate ml-1">{{ p.players[0].name }}</span>
          </div>
          <p class="text-xs font-semibold text-navy">{{ p.name }}</p>
          <p class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{{ p.nickname }}</p>
        </button>
      </div>
    </div>

    <!-- ─── 포메이션 탭 ─── -->
    <div v-else-if="tab === 'formation'" class="space-y-3">
      <div
        v-for="f in FORMATIONS"
        :key="f.name"
        class="bg-white rounded-2xl shadow p-4"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-navy tabular-nums">{{ f.name }}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full ring-1 font-semibold" :class="f.tone">{{ f.tag }}</span>
          </div>
        </div>

        <div class="flex gap-3 mb-3">
          <svg viewBox="0 0 100 140" class="w-20 h-28 shrink-0 rounded-md bg-emerald-700/90">
            <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" stroke-opacity="0.7" stroke-width="0.5" />
            <line x1="2" y1="70" x2="98" y2="70" stroke="white" stroke-opacity="0.5" stroke-width="0.3" />
            <circle cx="50" cy="70" r="10" fill="none" stroke="white" stroke-opacity="0.5" stroke-width="0.3" />
            <circle
              v-for="(d, i) in dots(f.rows)"
              :key="i"
              :cx="d.x" :cy="d.y" r="3.5"
              :fill="d.gk ? '#fbbf24' : 'white'"
              stroke="#0a2540" stroke-width="0.5"
            />
          </svg>
          <div class="flex-1 text-xs">
            <p class="text-[10px] text-gray-400 font-semibold">구조</p>
            <p class="font-mono text-[11px] text-onyx mb-2">{{ f.structure }}</p>
            <div class="space-y-1">
              <p><span class="text-emerald-700 font-semibold">📤 빌드업</span> <span class="text-onyx">{{ f.buildup }}</span></p>
              <p><span class="text-blue-700 font-semibold">🛡 수비</span> <span class="text-onyx">{{ f.defense }}</span></p>
              <p><span class="text-rose-700 font-semibold">⚡ 압박 트리거</span> <span class="text-onyx">{{ f.trigger }}</span></p>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">
          <span v-for="p in f.pros" :key="p" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">+ {{ p }}</span>
          <span v-for="c in f.cons" :key="c" class="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">− {{ c }}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
          <div class="bg-emerald-50 rounded p-2">
            <p class="text-[10px] text-emerald-700 font-semibold">💪 강함</p>
            <p class="text-xs text-onyx mt-0.5">{{ f.matchups.strong }}</p>
          </div>
          <div class="bg-rose-50 rounded p-2">
            <p class="text-[10px] text-rose-700 font-semibold">🩹 약함</p>
            <p class="text-xs text-onyx mt-0.5">{{ f.matchups.weak }}</p>
          </div>
        </div>

        <div class="mb-3">
          <p class="text-[10px] text-gray-400 mb-1 font-semibold">대표 사례</p>
          <ul class="space-y-1">
            <li v-for="e in f.examples" :key="e.coach + e.years" class="text-xs">
              <span class="font-semibold text-navy">{{ e.coach }}</span>
              <span class="text-gray-500"> · {{ e.club }} ({{ e.years }})</span>
              <span class="text-gray-400"> — {{ e.achievement }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-gradient-to-r from-navy/5 to-gold/10 rounded-lg p-2.5">
          <p class="text-[10px] text-navy font-semibold mb-0.5">💡 동호회 TIP</p>
          <p class="text-xs text-onyx leading-relaxed">{{ f.tip }}</p>
        </div>
      </div>

      <!-- 동호회 종합 가이드 -->
      <div class="bg-navy text-white rounded-2xl shadow p-5">
        <p class="font-bold mb-3 flex items-center gap-2">📋 동호회 6 RULES <span class="text-xs opacity-70 font-normal">(한국 풀코트 11인 기준)</span></p>
        <ul class="space-y-2">
          <li v-for="r in CLUB_RULES" :key="r.n" class="flex gap-2 text-sm leading-snug">
            <span class="shrink-0 w-6 h-6 rounded-full bg-gold/80 text-onyx text-xs font-bold flex items-center justify-center">{{ r.n }}</span>
            <span class="opacity-90">{{ r.rule }}</span>
          </li>
        </ul>
      </div>

      <p class="text-[11px] text-gray-400 text-center mt-2">
        ⚠ 포메이션은 시작점일 뿐. 경기 중 빌드업/수비 시 형태가 계속 바뀝니다.
      </p>
    </div>

    <!-- ─── 모던 컨셉 탭 ─── -->
    <div v-else-if="tab === 'concept'" class="space-y-3">
      <div
        v-for="c in CONCEPTS"
        :key="c.name"
        class="bg-white rounded-2xl shadow p-4 space-y-2.5"
      >
        <div class="flex items-baseline gap-2">
          <span class="text-2xl">{{ c.icon }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy">{{ c.name }}</p>
            <p class="text-[11px] text-gray-400">{{ c.en }}</p>
          </div>
        </div>

        <p class="text-sm text-onyx leading-relaxed bg-gray-50 rounded p-2.5">{{ c.definition }}</p>

        <div>
          <p class="text-[10px] text-emerald-700 font-semibold mb-0.5">⚙️ 메커니즘</p>
          <p class="text-xs text-onyx leading-snug">{{ c.mechanism }}</p>
        </div>

        <div>
          <p class="text-[10px] text-blue-700 font-semibold mb-0.5">📍 대표 적용</p>
          <ul class="text-xs text-onyx space-y-0.5">
            <li v-for="ex in c.examples" :key="ex">· {{ ex }}</li>
          </ul>
        </div>

        <div class="bg-rose-50 rounded p-2">
          <p class="text-[10px] text-rose-700 font-semibold mb-0.5">⚠ 한계</p>
          <p class="text-xs text-onyx leading-snug">{{ c.limit }}</p>
        </div>
      </div>
    </div>

    <!-- ─── 기본 규칙 탭 ─── -->
    <div v-else class="space-y-4">
      <!-- 칩 셀렉터 -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="r in RULES"
          :key="r.code"
          type="button"
          class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          :class="activeRule === r.code ? r.tone + ' ring-1 ring-current scale-105 shadow-sm' : 'bg-white text-gray-500 ring-1 ring-gray-200'"
          @click="activeRule = r.code"
        >{{ r.icon }} {{ r.name }}</button>
      </div>

      <!-- 선택 룰 상세 -->
      <div v-if="activeRuleObj" class="bg-white rounded-2xl shadow p-5 space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ activeRuleObj.icon }}</span>
          <div class="flex-1">
            <p class="font-bold text-navy text-base">{{ activeRuleObj.name }}</p>
            <p class="text-[11px] text-gray-400 font-mono">IFAB {{ activeRuleObj.law }}</p>
          </div>
        </div>

        <p class="text-sm text-onyx leading-relaxed font-semibold">{{ activeRuleObj.summary }}</p>

        <div>
          <p class="text-[10px] text-gray-500 font-semibold mb-0.5">📖 상세</p>
          <p class="text-xs text-onyx leading-relaxed">{{ activeRuleObj.detail }}</p>
        </div>

        <div class="bg-rose-50 rounded p-2.5">
          <p class="text-[10px] text-rose-700 font-semibold mb-0.5">🚨 위반 처리</p>
          <p class="text-xs text-onyx">{{ activeRuleObj.foul }}</p>
        </div>

        <div class="bg-gradient-to-r from-navy/5 to-gold/10 rounded-lg p-3">
          <p class="text-xs text-navy font-semibold mb-1">💡 동호회 TIP</p>
          <p class="text-sm text-onyx leading-relaxed">{{ activeRuleObj.tip }}</p>
        </div>
      </div>

      <!-- 빠른 참조 그리드 -->
      <div>
        <p class="text-xs text-gray-500 mb-2 font-semibold">빠른 참조</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="r in RULES"
            :key="`q-${r.code}`"
            type="button"
            class="text-left p-3 rounded-xl bg-white shadow-sm hover:shadow transition-shadow"
            @click="activeRule = r.code"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg">{{ r.icon }}</span>
              <p class="text-xs font-bold text-navy">{{ r.name }}</p>
            </div>
            <p class="text-[10px] text-gray-500 line-clamp-2">{{ r.summary }}</p>
          </button>
        </div>
      </div>

      <p class="text-[11px] text-gray-400 text-center mt-3">
        🏛 IFAB Laws of the Game 2024-25 기준. 동호회는 자체 합의 룰 우선.
      </p>
    </div>
  </div>
</template>
