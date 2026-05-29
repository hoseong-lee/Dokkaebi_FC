<script setup>
import { ref, computed } from 'vue'

const tab = ref('position') // position | formation

// ─── 포지션 9종 ───
const POSITIONS = [
  {
    code: 'GK', name: '골키퍼', en: 'Goalkeeper',
    tone: 'bg-amber-100 text-amber-800 ring-amber-300',
    role: '골문 사수와 빌드업의 출발점. 현대 축구는 발 기술까지 요구됨.',
    skills: ['반사신경', '위치 선정', '펀칭/캐칭', '빌드업 패스', '리더십'],
    players: ['알리송 (리버풀)', '노이어 (바이언)', '쿠르투아 (레알)'],
    tip: '동호회에서는 키 큰 사람보다 "무서워하지 않고 나서는 사람" 이 더 중요. 1대1 상황 판단력이 핵심.'
  },
  {
    code: 'CB', name: '센터백', en: 'Centre Back',
    tone: 'bg-blue-100 text-blue-800 ring-blue-300',
    role: '중앙 수비의 기둥. 라인 컨트롤 + 헤더 + 빌드업의 시작점.',
    skills: ['헤더', '태클', '위치 선정', '롱패스', '커뮤니케이션'],
    players: ['반다이크 (리버풀)', '루벤 디아스 (시티)', '알라바 (레알)'],
    tip: '"먼저 움직이지 마라". 상대의 첫 동작을 보고 반응하는 게 더 안정적.'
  },
  {
    code: 'FB', name: '풀백', en: 'Full Back / Wing Back',
    tone: 'bg-cyan-100 text-cyan-800 ring-cyan-300',
    role: '사이드 수비 + 측면 공격 가담. 현대엔 인버티드 풀백 트렌드.',
    skills: ['체력', '크로스', '1대1 수비', '오버래핑', '빌드업 패스'],
    players: ['알렉산더아놀드 (리버풀)', '카르바할 (레알)', '하킴 지에쉬'],
    tip: '체력 소모가 가장 큰 포지션. 90분 풀가동 안 되면 윙백 대신 풀백 고정 권장.'
  },
  {
    code: 'DM', name: '수비형 미드필더', en: 'Defensive Midfielder',
    tone: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    role: '백라인 앞에서 인터셉트 + 빌드업 분배. 팀의 "방패 + 메트로놈".',
    skills: ['위치 선정', '가로채기', '패스 정확도', '활동량', '템포 조절'],
    players: ['로드리 (시티)', '카세미루 (맨유)', '부스케츠 (전성기)'],
    tip: '화려한 플레이보다 "수비 라인 앞에 항상 서 있기". 보이지 않을 때가 잘하는 것.'
  },
  {
    code: 'CM', name: '중앙 미드필더', en: 'Centre Midfielder',
    tone: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    role: '박스 투 박스. 공수 연결 + 2선 슈팅.',
    skills: ['패스', '체력', '시야', '슈팅', '드리블'],
    players: ['모드리치 (레알)', '데브라이너 (시티)', '사비 (전성기)'],
    tip: '동호회의 "에이스" 포지션. 체력만 받쳐주면 가장 영향력 큼.'
  },
  {
    code: 'AM', name: '공격형 미드필더', en: 'Attacking Midfielder (10번)',
    tone: 'bg-violet-100 text-violet-800 ring-violet-300',
    role: '라스트 패스의 마지막 단추. 슛 찬스를 직접 만들어내는 역할.',
    skills: ['시야', '키패스', '드리블', '슈팅', '탈압박'],
    players: ['데브라이너 (시티)', '메시 (전성기)', '외질'],
    tip: '"뒤로 받지 마라". 항상 골대를 보고 받아야 다음 동작이 빨라짐.'
  },
  {
    code: 'WG', name: '윙어', en: 'Winger',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '사이드 돌파 + 컷인 슈팅 + 크로스. 1대1 능력이 핵심.',
    skills: ['스피드', '드리블', '슛(컷인)', '1대1', '크로스'],
    players: ['살라 (리버풀)', '비니시우스 (레알)', '음바페'],
    tip: '오른발잡이는 왼쪽 윙(컷인 슛), 왼발잡이는 오른쪽 윙 — "리바운드 윙" 이 트렌드.'
  },
  {
    code: 'ST', name: '스트라이커', en: 'Striker',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '박스 안 마무리. "골이 곧 임무". 포스트 플레이도 함께.',
    skills: ['결정력', '위치 선정', '헤더', '포스트 플레이', '오프 더 볼'],
    players: ['홀란드 (시티)', '음바페 (레알)', '르완도프스키'],
    tip: '90분 1골만 넣어도 임무 완수. 평소엔 "보이지 않다가" 박스에서 갑자기 나타나야 함.'
  },
  {
    code: 'CF', name: '폴스 9', en: 'False 9',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '스트라이커 자리에서 의도적으로 내려와 빌드업/연결 가담.',
    skills: ['시야', '패스', '드리블', '결정력', '리딩'],
    players: ['메시 (펩 바르샤 09-12)', '피르미누 (클롭 리버풀)', '카이 하베르츠'],
    tip: '상대 센터백이 따라 나오면 그 뒤 공간을 윙어가 침투. 펩 트레블 핵심 전술.'
  }
]

// ─── 포메이션 6종 (행별 인원 배열 + 메타) ───
const FORMATIONS = [
  {
    name: '4-3-3', tag: '클래식 공격', tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    rows: [4, 3, 3],
    feat: '측면 윙어로 폭 넓은 공격. 중앙 3 미드는 보통 1DM + 2CM 구조.',
    pros: ['공격 폭 ↑', '윙어 활용 극대', '중앙 3:3 안정'],
    cons: ['윙어가 수비 안 가담하면 풀백 위험', '체력 소모 큼'],
    examples: ['펩 바르샤 (트레블 09-12)', '클롭 리버풀', '안첼로티 레알 (CL 우승)']
  },
  {
    name: '4-2-3-1', tag: '공수 균형', tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    rows: [4, 2, 3, 1],
    feat: '2 DM 으로 안정 + 10번(AM) 활용 극대. 가장 무난한 모던 시스템.',
    pros: ['수비 안정', '10번 핵심 활용', '윙어/AM 호환'],
    cons: ['원톱 고립 시 무력', '10번에 의존도 ↑'],
    examples: ['무리뉴 레알·인테르 (트레블)', '한국 대표팀 클래식', '뮌헨 (반 갈)']
  },
  {
    name: '4-4-2', tag: '클래식', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rows: [4, 4, 2],
    feat: '측면 미드 + 풀백 조합으로 폭 확보. 투톱의 콤비네이션이 핵심.',
    pros: ['단순/명확한 역할', '게겐프레싱과 궁합 ↑', '투톱 케미스트리'],
    cons: ['중원 2명 수적 열세 가능', '윙어 의존 ↓'],
    examples: ['알렉스 퍼거슨 맨유 (전성기)', '클롭 도르트문트', '시메오네 아틀레티코']
  },
  {
    name: '4-1-4-1', tag: '수비형 4-3-3', tone: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    rows: [4, 1, 4, 1],
    feat: 'DM 1명 + 4명 미드 라인으로 압박 그물. 강팀 상대용.',
    pros: ['중원 압박 ↑', '카운터 시 빠른 전환', '수비 안정'],
    cons: ['원톱 고립', '풀백 오버랩 어려움'],
    examples: ['안첼로티 레알 (강팀 원정)', '펠레그리니 시티', '한국 대표팀 (이란전 등)']
  },
  {
    name: '3-5-2 / 3-4-3', tag: '윙백 활용', tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    rows: [3, 5, 2],
    feat: '3백 + 윙백이 폭 담당. 빌드업 안정 + 양 사이드 공격력 모두 확보.',
    pros: ['3백 빌드업 안정', '윙백 공격 가담', '투톱 또는 쓰리톱'],
    cons: ['윙백 체력 부담', '윙백 뒷공간 위험'],
    examples: ['콘테 인테르 (세리에 우승)', '콘테 첼시 (PL 우승)', '가스페리니 아탈란타']
  },
  {
    name: '5-3-2 / 5-4-1', tag: '카운터·수비', tone: 'bg-slate-100 text-slate-700 ring-slate-300',
    rows: [5, 3, 2],
    feat: '두꺼운 수비 라인 + 빠른 역습. 약팀이 강팀 상대로 자주 사용.',
    pros: ['수비 잠금', '카운터 한 방', '실리 축구'],
    cons: ['공격력 제한', '점유율 ↓', '재미 ↓'],
    examples: ['시메오네 아틀레티코 (빅매치)', '모예스 웨스트햄', '레스터 시티 (15-16 우승)']
  }
]

// 미니 피치에 점 배치 — SVG viewBox 100x140 (세로 길게 = 실제 피치 비율)
function dots(rows) {
  const out = []
  const fwLast = rows.length // 행 수 (보통 3~4)
  rows.forEach((n, rowIdx) => {
    // y: 위쪽이 우리 골대 — DF 가 가장 아래(y 큰값), FW 가 위(y 작은값)
    const y = 120 - (rowIdx + 1) * (110 / (fwLast + 1))
    for (let i = 0; i < n; i++) {
      const x = ((i + 1) * 100) / (n + 1)
      out.push({ x, y })
    }
  })
  // GK 추가 (아래 정중앙)
  out.unshift({ x: 50, y: 130, gk: true })
  return out
}

const activePos = ref(POSITIONS[0].code)
const activePosObj = computed(() => POSITIONS.find((p) => p.code === activePos.value))
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-xl font-bold text-navy">⚽ 축구 가이드</h1>
      <p class="text-xs text-gray-500 mt-1">포지션과 포메이션의 핵심 — 동호회 적용 팁 포함</p>
    </div>

    <!-- 탭 -->
    <div class="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
      <button
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'position' ? 'bg-navy text-white' : 'text-gray-500'"
        @click="tab = 'position'"
      >👤 포지션</button>
      <button
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'formation' ? 'bg-navy text-white' : 'text-gray-500'"
        @click="tab = 'formation'"
      >📐 포메이션</button>
    </div>

    <!-- ─── 포지션 탭 ─── -->
    <div v-if="tab === 'position'" class="space-y-4">
      <!-- 칩 셀렉터 -->
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

      <!-- 상세 카드 -->
      <div v-if="activePosObj" class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1 rounded-lg text-sm font-bold ring-1"
            :class="activePosObj.tone"
          >{{ activePosObj.code }}</span>
          <div>
            <p class="font-bold text-navy">{{ activePosObj.name }}</p>
            <p class="text-[11px] text-gray-400">{{ activePosObj.en }}</p>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1">🎯 핵심 역할</p>
          <p class="text-sm text-onyx leading-relaxed">{{ activePosObj.role }}</p>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5">💪 요구되는 능력</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="s in activePosObj.skills"
              :key="s"
              class="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700"
            >{{ s }}</span>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1.5">⭐ 대표 선수</p>
          <ul class="text-sm text-onyx space-y-0.5">
            <li v-for="pl in activePosObj.players" :key="pl">· {{ pl }}</li>
          </ul>
        </div>

        <div class="bg-gradient-to-r from-navy/5 to-gold/10 rounded-lg p-3">
          <p class="text-xs text-navy font-semibold mb-1">💡 동호회 TIP</p>
          <p class="text-sm text-onyx leading-relaxed">{{ activePosObj.tip }}</p>
        </div>
      </div>

      <!-- 전체 그리드 미리보기 -->
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in POSITIONS"
          :key="`mini-${p.code}`"
          type="button"
          class="text-left p-3 rounded-xl bg-white shadow-sm hover:shadow transition-shadow"
          @click="activePos = p.code"
        >
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-[11px] px-2 py-0.5 rounded ring-1 font-bold"
              :class="p.tone"
            >{{ p.code }}</span>
            <span class="text-[10px] text-gray-400">{{ p.players[0].split(' (')[0] }}</span>
          </div>
          <p class="text-xs font-semibold text-navy">{{ p.name }}</p>
          <p class="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{{ p.role }}</p>
        </button>
      </div>
    </div>

    <!-- ─── 포메이션 탭 ─── -->
    <div v-else class="space-y-3">
      <div
        v-for="f in FORMATIONS"
        :key="f.name"
        class="bg-white rounded-2xl shadow p-4"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="text-lg font-bold text-navy tabular-nums">{{ f.name }}</span>
          <span
            class="text-[11px] px-2 py-0.5 rounded-full ring-1 font-semibold"
            :class="f.tone"
          >{{ f.tag }}</span>
        </div>

        <div class="flex gap-3">
          <!-- 미니 피치 -->
          <svg viewBox="0 0 100 140" class="w-20 h-28 shrink-0 rounded-md bg-emerald-700/90">
            <!-- 라인 -->
            <rect x="2" y="2" width="96" height="136" fill="none" stroke="white" stroke-opacity="0.7" stroke-width="0.5" />
            <line x1="2" y1="70" x2="98" y2="70" stroke="white" stroke-opacity="0.5" stroke-width="0.3" />
            <circle cx="50" cy="70" r="10" fill="none" stroke="white" stroke-opacity="0.5" stroke-width="0.3" />
            <!-- 점 -->
            <circle
              v-for="(d, i) in dots(f.rows)"
              :key="i"
              :cx="d.x" :cy="d.y" r="3.5"
              :fill="d.gk ? '#fbbf24' : 'white'"
              stroke="#0a2540" stroke-width="0.5"
            />
          </svg>

          <div class="flex-1">
            <p class="text-xs text-onyx leading-snug">{{ f.feat }}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="p in f.pros"
                :key="p"
                class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
              >+ {{ p }}</span>
              <span
                v-for="c in f.cons"
                :key="c"
                class="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700"
              >− {{ c }}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-100">
          <p class="text-[10px] text-gray-400 mb-1">대표 사례</p>
          <ul class="text-xs text-gray-600 space-y-0.5">
            <li v-for="e in f.examples" :key="e">· {{ e }}</li>
          </ul>
        </div>
      </div>

      <p class="text-[11px] text-gray-400 text-center mt-2">
        ⚠ 포메이션은 시작점일 뿐. 경기 중 빌드업/수비 시 형태가 계속 바뀝니다.
      </p>
    </div>
  </div>
</template>
