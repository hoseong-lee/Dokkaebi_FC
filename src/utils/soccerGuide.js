// 축구 가이드 데이터 — 포지션 9 + 포메이션 7 + 모던 컨셉 8
// 2024~2026 트렌드 반영. 출처: Coaches' Voice, Premier League, UEFA, Total Football Analysis 등

export const POSITIONS = [
  {
    code: 'GK', name: '골키퍼', en: 'Goalkeeper', nickname: '스위퍼 키퍼',
    tone: 'bg-amber-100 text-amber-800 ring-amber-300',
    role: '골 방어 + 백라인 뒤 공간 커버 + 빌드업 시작점. "11번째 필드 플레이어".',
    evolution: {
      traditional: '슛 막기 + 라인 클리어 + 공중장악이 전부.',
      modern: '하이라인 뒤 공간 sweep, 골킥/짧은 패스로 빌드업 개시. Ederson은 평균 28패스/경기 + 1,207 long ball.'
    },
    phases: {
      defend: '하이라인 뒤 1차 sweeper, 1v1 차단',
      buildup: '백3/4에 합류해 5v4 수적 우위 형성',
      transition: '즉각 long throw/long pass로 윙어 발밑 또는 등 뒤 공간',
      box: '크로스 차단, 코너 커맨드, PK 심리전'
    },
    skills: ['양발 패스', '결단력', '공중장악', '1v1 반응', '스캐닝'],
    players: [
      { name: 'Ederson', club: 'Man City' },
      { name: 'Alisson', club: 'Liverpool' },
      { name: 'ter Stegen', club: 'Barcelona' }
    ],
    tip: '아마추어는 sweeper 욕심 내다 로빙슛 실점 빈번. 페널티 박스 라인까지만 나오기. 양발 사용 연습 필수.'
  },
  {
    code: 'CB', name: '센터백', en: 'Centre Back', nickname: 'Ball-Playing Defender',
    tone: 'bg-blue-100 text-blue-800 ring-blue-300',
    role: '1v1 방어 + 라인 통제 + 빌드업 1차 패스 분배.',
    evolution: {
      traditional: 'destroyer/stopper 위주(공중볼·태클). 클리어 + 헤더가 핵심.',
      modern: 'ball-playing 표준. Van Dijk 2024/25 패스 정확도 91.7%. CB가 미드 overload 만들기 위해 carrying.'
    },
    phases: {
      defend: '라인 명령(line of confrontation), 1v1 마크, 공중볼',
      buildup: 'GK와 함께 +1 overload, line-breaking pass, 드리블 침투',
      transition: '즉시 후방 차단(rest defense), 카운터 지연',
      box: '세트피스 헤더 위협 + 마크'
    },
    skills: ['포지셔닝', '패스 레인지', '공중장악', '1v1 anticipation', '리더십'],
    players: [
      { name: 'Virgil van Dijk', club: 'Liverpool' },
      { name: 'Rúben Dias', club: 'Man City' },
      { name: 'William Saliba', club: 'Arsenal' }
    ],
    tip: '아마추어는 라인 올리지 말 것. 백라인 사이 간격 5m 이하. CB 한 명이 무리하게 전진하면 빈자리 즉시 실점.'
  },
  {
    code: 'FB', name: '풀백 / 윙백', en: 'Full Back / Wing Back', nickname: 'Inverted Fullback',
    tone: 'bg-cyan-100 text-cyan-800 ring-cyan-300',
    role: '측면 수비 + 폭 제공 또는 중앙 침투(인버티드).',
    evolution: {
      traditional: 'overlap + 크로스가 전부. Maicon·Roberto Carlos.',
      modern: '인버티드(2013 Lahm → 2023 Stones), 소유 시 안쪽으로 접혀 더블 피벗 형성 → 2-3-5 빌드업 구조.'
    },
    phases: {
      defend: '윙어 1v1, 백4 라인 유지(WB는 백5로 떨어짐)',
      buildup: '인버티드(안쪽 6번 옆) 또는 overlap(외곽 폭 제공)',
      transition: 'half-space underlap, cut-back 크로스',
      box: '백포스트 도착(특히 가스페리니식 3-4-3)'
    },
    skills: ['스태미나', '1v1 수비', '크로스/패스', '전술 IQ', '양발'],
    players: [
      { name: 'Trent Alexander-Arnold', club: 'Real Madrid' },
      { name: 'Achraf Hakimi', club: 'PSG' },
      { name: 'Theo Hernández', club: 'AC Milan' }
    ],
    tip: '풋살은 인버티드보다 전통 overlap이 더 효과적(필드 좁아 중앙 overload 불필요). 풀코트라면 한쪽만 올리고 반대쪽은 백3 형성하는 비대칭이 안전.'
  },
  {
    code: 'DM', name: '수비형 미드필더', en: 'Defensive Midfielder', nickname: '레지스타 / 6번',
    tone: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    role: '수비 라인 보호 + 템포 컨트롤 + 빌드업 분배.',
    evolution: {
      traditional: 'destroyer (Gattuso, Makelele). 태클 + 가로채기 전담.',
      modern: '레지스타(deep-lying playmaker). Pirlo→Jorginho→Rodri 계보. Rodri는 2024 발롱도르 — 사상 최초 DM 수상.'
    },
    phases: {
      defend: '라인 사이 차단, 6번 존 보호, intercept 우선(태클은 최후)',
      buildup: 'CB 사이로 떨어져 백3 형성 또는 더블 피벗',
      transition: '즉시 카운터 막기(rest defense) 또는 1차 패스',
      box: '세트피스 시 백라인 보호(remain 위치)'
    },
    skills: ['스캐닝', '패스 레인지', 'press resistance', 'anticipation', '체력'],
    players: [
      { name: 'Rodri', club: 'Man City (Ballon d\'Or 2024)' },
      { name: 'Declan Rice', club: 'Arsenal' },
      { name: 'Casemiro / Tchouaméni', club: 'Man Utd / Real Madrid' }
    ],
    tip: '아마추어에서 가장 저평가되는 포지션. 골 안 넣고 가로채기·짧은 패스만 해도 팀 안정. 한 명 고정 배치가 핵심.'
  },
  {
    code: 'CM', name: '중앙 미드필더', en: 'Centre Midfielder', nickname: '박스 투 박스 / 8번',
    tone: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    role: '박스 to 박스 활동량 + 빌드업 link + 박스 도착.',
    evolution: {
      traditional: 'link-up + 활동량. 8번은 보조 역할.',
      modern: 'multi-phase 기여 필수 — 수비/빌드업/찬스 메이킹/골까지 모두. 펩 시티 22-23 De Bruyne·Gündoğan 박스 미드필드의 상위 2 8번.'
    },
    phases: {
      defend: '상대 8번 마크, half-space 차단',
      buildup: 'half-space에서 forward 또는 6번에 옵션 제공',
      transition: '즉시 전진 carrying 또는 박스 침투',
      box: 'late run, 세컨드볼 회수, 슛'
    },
    skills: ['활동량', '박스 도착 타이밍', '패스', '슛', '압박 회피'],
    players: [
      { name: 'Jude Bellingham', club: 'Real Madrid (데뷔 시즌 23G 13A)' },
      { name: 'Bruno Fernandes', club: 'Man Utd' },
      { name: 'Pedri', club: 'Barcelona' }
    ],
    tip: '풀코트 11인에서 가장 체력 소모 큰 자리. 체력 좋은 인원 1순위 배치 + 후반 교체 우선.'
  },
  {
    code: 'AM', name: '공격형 미드필더', en: 'Attacking Midfielder', nickname: '10번 (멸종설 vs 부활)',
    tone: 'bg-violet-100 text-violet-800 ring-violet-300',
    role: 'final third 창조성 + line-breaking 패스 + 박스 침투.',
    evolution: {
      traditional: 'luxury player (Riquelme, Özil) — 수비 의무 거의 없음.',
      modern: '4-2-3-1 압박 시스템에서 거의 멸종. 단 De Bruyne·Ødegaard·Bellingham 같은 "압박하는 10번" 하이브리드로 부활.'
    },
    phases: {
      defend: 'counter-press 1차 트리거, 상대 6번 차단',
      buildup: 'half-space에서 turn-and-pass, pocket 받기',
      transition: 'through ball, 직선 carry',
      box: 'late arrival, cut-back 마무리'
    },
    skills: ['비전', 'scanning', '1st touch', '슛', '작업률(modern)'],
    players: [
      { name: 'Jude Bellingham', club: 'Real Madrid' },
      { name: 'Kevin De Bruyne', club: 'Man City' },
      { name: 'Martin Ødegaard', club: 'Arsenal' }
    ],
    tip: '"공만 받으려는 선수" 함정 경계. active off-ball movement(빈 공간 빠지기, 박스 침투) 안 하면 팀이 5명으로 싸우는 효과.'
  },
  {
    code: 'WG', name: '윙어', en: 'Winger', nickname: '인버티드 윙 / 컷인',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '폭 + 1v1 침투 + 골/어시스트.',
    evolution: {
      traditional: '같은 발 측면(오른발 우측), 라인 따라 크로스. Ryan Giggs·Beckham.',
      modern: '반대발 측면(인버티드, Robben 이후). 안쪽 컷인 → 강발 슛 또는 through pass. Cristiano Ronaldo 2006~09 PL 66골(전환 후).'
    },
    phases: {
      defend: '상대 풀백 압박 + 백라인까지 내려가 4-5-1 형성',
      buildup: '폭 유지(상대 풀백 핀)',
      transition: '즉시 컷인 또는 등 뒤 침투',
      box: '컷인 후 슛, 백포스트 마무리'
    },
    skills: ['가속력', '1v1 드리블', '마무리', '컷인 슛', '활동량'],
    players: [
      { name: 'Mohamed Salah', club: 'Liverpool' },
      { name: 'Vinícius Júnior', club: 'Real Madrid' },
      { name: 'Bukayo Saka', club: 'Arsenal' }
    ],
    tip: '반대발 윙어는 동호회에도 직접 적용 가능. 오른발잡이를 왼쪽에 배치 — 컷인 슛만으로 골 확률 급상승.'
  },
  {
    code: 'ST', name: '스트라이커', en: 'Striker', nickname: '진짜 9번',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '골 + 박스 안 위협 + (현대) 하드 프레스 1차 트리거.',
    evolution: {
      traditional: 'target man (Drogba, Zlatan) — hold-up + 헤더 위주.',
      modern: '모빌리티 + 프레스 + 마무리 통합. Haaland(스피드+피지컬), Lewandowski(포지셔닝), Kane(드롭 playmaker형). 펩 시티 false 9 거치고 다시 Haaland 영입 — "진짜 9번" 회귀.'
    },
    phases: {
      defend: '1차 압박(GK 패스 방향 차단)',
      buildup: '등지고 hold-up 또는 채널 런으로 깊이 제공',
      transition: '등 뒤 침투 또는 layoff',
      box: '6야드 박스 marquee 위치, 헤더, 컷백 마무리'
    },
    skills: ['마무리', '박스 안 포지셔닝', 'hold-up', '공중장악', '프레스 작업률'],
    players: [
      { name: 'Erling Haaland', club: 'Man City (22-23 PL 36골 신기록)' },
      { name: 'Robert Lewandowski', club: 'Barcelona' },
      { name: 'Harry Kane', club: 'Bayern Munich' }
    ],
    tip: '박스 안 머무는 시간이 골 수와 비례. 미드필드 내려와 공 받고 싶어하는 9번은 골 못 넣음. 패스 끊겨도 박스에서 기다리기.'
  },
  {
    code: 'F9', name: '폴스 9', en: 'False 9', nickname: 'Messi / Firmino',
    tone: 'bg-rose-100 text-rose-800 ring-rose-300',
    role: '최전방 명목, 미드로 떨어져 4v3 overload + 상대 CB 딜레마 강요.',
    evolution: {
      traditional: '1950년대 헝가리 Hidegkuti 원형.',
      modern: '2009-05-02 El Clásico Bernabéu, Pep이 Messi를 9번에 배치 → 2-6 대승. Firmino는 Klopp Liverpool에서 다른 해석 — Salah·Mané 등 뒤 침투 공간 만드는 work horse.'
    },
    phases: {
      defend: '1차 프레스 + 상대 6번 차단',
      buildup: '중원으로 떨어져 4v3/5v4 overload',
      transition: 'layoff + 윙어 침투 트리거',
      box: 'late arrival(머무르지 않고 도착)'
    },
    skills: ['1st touch', 'half-turn 받기', '비전', '드리블', '작업률'],
    players: [
      { name: 'Lionel Messi', club: 'Barcelona (펩 4-3-3)' },
      { name: 'Roberto Firmino', club: 'Liverpool (Klopp)' },
      { name: 'Cesc Fàbregas', club: 'Spain 2010 WC' }
    ],
    tip: '풋살에서 자연스럽게 발생. 풀코트에서도 CF가 발에 받고 싶어하면 윙어 들어올 공간 없음. False 9 쓸 거면 윙어 등 뒤 침투 약속 선행.'
  }
]

export const FORMATIONS = [
  {
    name: '4-3-3', tag: '클래식 공격형',
    tone: 'bg-rose-50 text-rose-700 ring-rose-200',
    rows: [4, 3, 3],
    structure: 'GK / RB-CB-CB-LB / DM-CM-CM / RW-ST-LW',
    buildup: '풀백 인버티드 시 2-3-5, CB 한 명 미드 진입 시 3-2-5 (펩 시티 box midfield 변형).',
    defense: '4-1-4-1 또는 4-5-1(윙어 내려옴). 클롭 리버풀은 종종 4-3-2-1로 좁힘.',
    trigger: '횡패스/백패스, 풀백 받기 직전, 첫 터치 흐트러질 때 (Klopp 5초 룰).',
    pros: ['자연스러운 삼각형', '미드 overload', '측면 1v1 기회'],
    cons: ['카운터 노출', '미드 3 vs 4 수적열세 가능', '윙어 수비 안 가면 풀백 노출'],
    matchups: {
      strong: '4-4-2 (미드 3v2 우위)',
      weak: '3-5-2 (미드 3v3 동수 + 윙백 폭)'
    },
    examples: [
      { coach: 'Pep Guardiola', club: 'Barcelona', years: '2008-12', achievement: '트레블 + 14트로피' },
      { coach: 'Jürgen Klopp', club: 'Liverpool', years: '2018/19~20', achievement: 'UCL + PL 97점/99점' },
      { coach: 'Carlo Ancelotti', club: 'Real Madrid', years: '2021/22, 23/24', achievement: 'UCL 2회' }
    ],
    tip: '11인 동호회 가장 무난. 단 윙어 수비 가담 안 시키면 무너짐. 동호회 평균 체력으로는 압박 강도 못 맞춰 3 vs 4 미드 열세 빈번.'
  },
  {
    name: '4-2-3-1', tag: '공수 균형',
    tone: 'bg-blue-50 text-blue-700 ring-blue-200',
    rows: [4, 2, 3, 1],
    structure: 'GK / RB-CB-CB-LB / DM-DM / RW-AM-LW / ST',
    buildup: '더블 피벗 분리 → 백3 + 미드 4, 10번이 half-space 떨어져 받음.',
    defense: '4-4-1-1 또는 4-5-1, 10번이 striker 옆 또는 미드 합류.',
    trigger: '풀백 받기 + 10번이 6번 차단.',
    pros: ['더블 피벗 안정성', '미드 5명 overload 가능', '윙어·10번 위치 교환 유연'],
    cons: ['ST 고립', '10번 의존도 높음', '4-3-3에 미드 2v3 열세 가능'],
    matchups: {
      strong: '4-4-2 (미드 5v4)',
      weak: '4-3-3 (미드 2v3, 더블 피벗 둘러쌈)'
    },
    examples: [
      { coach: 'José Mourinho', club: 'Real Madrid', years: '2011/12', achievement: '라리가 100점/121골 신기록' },
      { coach: 'Vicente del Bosque', club: 'Spain', years: '2010 WC', achievement: 'WC 우승' },
      { coach: 'Hansi Flick', club: 'Bayern Munich', years: '2019/20', achievement: '트레블' }
    ],
    tip: '한국 동호회 가장 익숙한 포메이션. 10번 자리에 팀 내 최고 시야의 인원 배치. 더블 피벗 둘 다 "안 올라가는 약속" 필수.'
  },
  {
    name: '4-4-2', tag: '클래식 / Two Banks',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rows: [4, 4, 2],
    structure: 'GK / RB-CB-CB-LB / RM-CM-CM-LM / ST-ST',
    buildup: '풀백 폭 + 한 ST 떨어짐 → 4-4-1-1 또는 4-3-3 변형.',
    defense: '시메오네식 two banks of four — 백4·미드4 수직 간격 25m 이하, ST 2 살짝 높이.',
    trigger: '미드라인 트리거(mid-block), 횡패스 시 ST 쉐도우 프레스. Ranieri Leicester는 "5-up 5-down" 카운터.',
    pros: ['두 스트라이커 위협', '미드 4 균형', '셋업·소통 단순'],
    cons: ['미드 수평 staggering 부재', '미드 3 시스템에 수적열세', '라인 사이 공간 노출'],
    matchups: {
      strong: '4-3-3 (투톱 vs 백2 + 측면 1v1)',
      weak: '4-2-3-1, 4-3-3 (미드 4 vs 5)'
    },
    examples: [
      { coach: 'Diego Simeone', club: 'Atlético Madrid', years: '2013/14~', achievement: '라리가 + UCL 결승 2회' },
      { coach: 'Sir Alex Ferguson', club: 'Manchester United', years: '1998/99', achievement: '트레블' },
      { coach: 'Claudio Ranieri', club: 'Leicester City', years: '2015/16', achievement: 'PL 우승 (Vardy 24골)' }
    ],
    tip: '동호회에 가장 잘 맞음. 수직 간격 짧게 유지(20m 이내)만 지켜도 가운데 차단. 투톱 1명은 항상 박스 안, 1명은 layoff.'
  },
  {
    name: '4-1-4-1', tag: '수비형 4-3-3',
    tone: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    rows: [4, 1, 4, 1],
    structure: 'GK / RB-CB-CB-LB / DM / RM-CM-CM-LM / ST',
    buildup: '6번이 CB 사이로 떨어져 백3 형성, CM 한 명이 6번 자리 보충.',
    defense: '4-5-1 저블록, 6번이 라인 사이 보호 — 중앙 compactness 최대.',
    trigger: 'mid-block, 6번이 상대 10번 차단하면 미드 4가 앞으로 압박.',
    pros: ['중앙 보호 극대화', '미드 5명 균형', '카운터 안정'],
    cons: ['ST 고립', '빌드업 단순화', '측면 폭 부족'],
    matchups: {
      strong: '10번 의존형(4-2-3-1)',
      weak: '윙백·3백 시스템 (3-5-2 측면)'
    },
    examples: [
      { coach: 'Carlo Ancelotti', club: 'Real Madrid', years: '2021/22 UCL', achievement: 'Liverpool 결승전' },
      { coach: 'Manuel Pellegrini', club: 'Real Betis', years: '2022/23~', achievement: '4-2-3-1 ↔ 4-1-4-1 변형' },
      { coach: 'Carlo Ancelotti', club: 'Bayern', years: '2016/17', achievement: 'Alonso 단일 피벗' }
    ],
    tip: '강팀 상대 시 동호회에서 채택할만한 안전형. 6번 1명 절대 안 올라가는 규칙 단 하나만 지키면 됨. 공격은 카운터·세트피스 의존.'
  },
  {
    name: '3-5-2 / 3-4-3', tag: '윙백 활용',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200',
    rows: [3, 5, 2],
    structure: 'GK / CB-CB-CB / RWB-CM-DM-CM-LWB / ST-ST',
    buildup: '콘테: 윙백 폭 + CB 한 명 미드 합류 → 3-3-4. 가스페리니: wide overload 패싱 삼각형, CB-WB-CM 회전.',
    defense: '콘테: 5-3-2로 떨어져 mid/low block. 가스페리니: man-to-man 전원 마크 + 백3 라인 압박.',
    trigger: '가스페리니: 횡패스/백패스 즉시(man marker가 push up). 2024/25 UCL Atalanta-Barcelona 후반 Barcelona 어태킹 패스 8%까지 감소.',
    pros: ['윙백 폭 + 두 ST', '중앙 백3 안정', 'wide overload'],
    cons: ['윙백 체력 부담 극심', '1v1 한 번 잃으면 백3 직접 노출', 'man-marking은 회전·플리커에 취약'],
    matchups: {
      strong: '4-3-3 (미드 3v3 + 윙백 vs 풀백 유리)',
      weak: '측면 폭 좋은 4-2-3-1, 회전 능력 있는 팀'
    },
    examples: [
      { coach: 'Antonio Conte', club: 'Inter Milan', years: '2020/21', achievement: 'Serie A 우승 (Lukaku-Lautaro)' },
      { coach: 'Gian Piero Gasperini', club: 'Atalanta', years: '2023/24', achievement: 'Europa League 우승' },
      { coach: 'Antonio Conte', club: 'Italy NT', years: 'Euro 2016', achievement: 'flat 3-5-2' }
    ],
    tip: '윙백이 풀코트 90분 못 뛰면 즉시 무너짐. 체력 1·2위 인원을 윙백으로. man-marking은 동호회에서 가장 위험 — zonal이 안정.'
  },
  {
    name: '5-3-2 / 5-4-1', tag: '수비형 카타나치오',
    tone: 'bg-slate-100 text-slate-700 ring-slate-300',
    rows: [5, 3, 2],
    structure: 'GK / RWB-CB-CB-CB-LWB / CM-DM-CM / ST-ST',
    buildup: '골킥 long ball + ST hold-up, 안 되면 윙백 폭만 활용.',
    defense: '박스 앞 깊은 low block, 백5 좁히고 윙백 폭 차단.',
    trigger: '거의 없음 — 자기 진영 라인 위 진입 시에만 압박.',
    pros: ['수비 안정성 극대화', '카운터 5v5 가능', '약팀의 강팀 전략'],
    cons: ['점유 못함', '90분 견디는 멘탈/체력', '두 골 뒤지면 회복 어려움'],
    matchups: {
      strong: '점유형 4-3-3',
      weak: '측면 2 vs 1 만드는 3-4-3, 세트피스 강팀'
    },
    examples: [
      { coach: 'Claudio Ranieri', club: 'Leicester City', years: '2015/16', achievement: 'PL 우승 — long pass 21%(2위)' },
      { coach: 'Antonio Conte', club: 'Inter Milan', years: '2019/20', achievement: 'Barcelona 원정 5-3-2' },
      { coach: 'Roberto Mancini', club: 'Italy NT', years: 'Euro 2020', achievement: '결승 후반 5-4-1' }
    ],
    tip: '약체일 때 채택. 백5 + 미드 라인 좁히기만 약속해도 실점 절반. 단, ST 1~2명에게 한 방 능력 있어야 함.'
  },
  {
    name: '3-2-2-3', tag: 'Box Midfield (모던)',
    tone: 'bg-violet-50 text-violet-700 ring-violet-200',
    rows: [3, 2, 2, 3],
    structure: 'GK / CB-CB-CB / DM-DM(또는 CB-DM 인버티드) / AM-AM / RW-ST-LW',
    buildup: 'John Stones 미드 진입 → Rodri와 더블 피벗, KDB·Gündoğan이 박스 상단 4명 사각 완성 → 5v3 미드 우위.',
    defense: '4-4-2로 회귀 — 더블 피벗 1명 백라인 합류, 다른 1명 미드 라인, 10번 1명 ST 옆 압박.',
    trigger: '4-4-2 closed funnel — 상대 횡패스 시 ST 2 + 미드 4 압박, 측면 가두기.',
    pros: ['중앙 5v3 압도', 'half-space 2명 점유(qualitative superiority)', '카운터 견고함'],
    cons: ['Stones·Rodri급 인원 필요', '카운터 시 백3 1v1 노출', 'Haaland 없으면 false 9 필요'],
    matchups: {
      strong: '4-3-3, 4-2-3-1 (미드에서 압도)',
      weak: '빠른 윙어 + 직선 카운터 (Madrid 식)'
    },
    examples: [
      { coach: 'Pep Guardiola', club: 'Man City', years: '2022/23', achievement: '트레블 (20승 5무 무패 기간)' },
      { coach: 'Unai Emery', club: 'Aston Villa', years: '2023/24~', achievement: '4위 + UCL' },
      { coach: 'Arne Slot', club: 'Liverpool', years: '2024/25', achievement: 'PL 우승 (부분 차용)' }
    ],
    tip: '풋살/미니축구 부적합. 풀코트 11인에서도 Rodri급 6번 + Stones급 하이브리드 CB 모두 필요. 동호회 시도 시 단순 4-3-3 또는 4-2-3-1이 안전.'
  }
]

export const CONCEPTS = [
  {
    name: '인버티드 풀백', en: 'Inverted Fullback', icon: '↪️',
    tone: 'bg-cyan-50 text-cyan-800',
    definition: '풀백이 소유 시 안쪽 미드필드 라인까지 좁혀 더블 피벗 형성. 4-3-3 → 빌드업 시 2-3-5 또는 3-2-5로 변형.',
    mechanism: '미드 overload (상대 미드 2~3 vs 우리 3~4) + 카운터 시 즉시 차단 + 윙어가 폭 유지하도록 공간 보완',
    examples: ['Pep Bayern Lahm (2013~)', 'Pep Man City Cancelo·Walker (2018~)', 'Arteta Arsenal Zinchenko·White'],
    limit: '윙어 폭 유지 안 하면 4-1-5 어색 / 카운터 시 풀백 자리 비어 측면 노출 / 풀백 1v1 능력 요구'
  },
  {
    name: '게겐프레싱', en: 'Gegenpressing (5초 룰)', icon: '⚡',
    tone: 'bg-rose-50 text-rose-800',
    definition: '공 잃은 즉시 가장 가까운 선수들이 공격적 압박해 5초 이내 회수. 안 되면 후퇴해 블록 형성. "공보다 좋은 playmaker는 카운터프레스 회수 상황" — Klopp.',
    mechanism: '잃은 직후 5~10초가 상대 무방비 / pack hunting(한 명 아닌 떼) / 잃기 전 미리 각도·간격 잡혀있어야 함 / 펩은 6초 룰',
    examples: ['Klopp Dortmund (2010~12)', 'Klopp Liverpool (2018/19 UCL)', 'Tuchel Chelsea (2020/21 UCL)'],
    limit: '체력 소모 극심 / 5초 안에 회수 못 하면 라인 사이 공간 노출 / 회수 후 마무리 화력 필요'
  },
  {
    name: 'False 9', en: 'False Nine', icon: '🎭',
    tone: 'bg-violet-50 text-violet-800',
    definition: '4-3-3/4-1-4-1에서 명목상 9번이 미드로 떨어져 4v3 overload 형성. 상대 CB에 따라갈지 머무를지 딜레마.',
    mechanism: 'CB가 따라오면 → 윙어가 등 뒤 침투 / 머물면 → false 9가 half-turn으로 미드 지배. half-turn + 드리블 + through pass 3종 필수',
    examples: ['Cruyff Barcelona Laudrup', 'Pep Barcelona Messi (2009 El Clásico 2-6)', 'Klopp Liverpool Firmino'],
    limit: '박스 안 마무리 약화 (펩이 Haaland 영입 후 회귀한 이유) / Messi급 1st touch 없으면 미드 1명 추가 효과 뿐 / 윙어 침투 약속 없으면 무용'
  },
  {
    name: '만마킹 압박', en: 'Man-Marking Press', icon: '🎯',
    tone: 'bg-amber-50 text-amber-800',
    definition: '전 필드 1대1 마크. 상대 선수 어디로 가든 따라가 패스 옵션 자체를 막음.',
    mechanism: 'man marker가 push up → 전체 라인 같이 전진 → 상대를 자기 진영 깊이 가둠. CB도 횡으로 따라감(Djimsiti가 Raphinha 끝까지)',
    examples: ['Gasperini Atalanta (2016~, EL 2023/24 우승)', 'Ivan Jurić Torino', 'Thiago Motta Bologna→Juventus'],
    limit: '1v1 한 번 잃으면 전체 시스템 무너짐 / 회전·드롭·플리커 콤보에 취약 / 모든 선수가 일급 1v1 디펜더여야 함'
  },
  {
    name: 'Box Midfield', en: '박스 미드필드', icon: '⬜',
    tone: 'bg-blue-50 text-blue-800',
    definition: '미드필드 4명(피벗 2 + 8번/10번 2)을 사각형 배치해 상대 미드 2~3 압도. 3-2-2-3 또는 3-2-4-1로 표현.',
    mechanism: 'half-space 2 점유 → 상대 미드가 안쪽 막을지 풀백 보호할지 딜레마 / 카운터 시 4명 즉시 카운터프레스 / 윙어는 폭 유지하며 ST 핀',
    examples: ['Pep Man City 2022/23 (트레블)', 'Emery Aston Villa (2023/24~)', 'Slot Liverpool (2024/25 부분 차용)'],
    limit: 'Stones급 하이브리드 CB 필수 / 카운터 시 백3 1v1 노출 / 윙어 폭 못 잡으면 사각형 무용'
  },
  {
    name: '티키타카', en: 'Tiki-Taka', icon: '🔄',
    tone: 'bg-emerald-50 text-emerald-800',
    definition: 'Cruyff Juego de Posición 파생. 짧고 빠른 패스 + 끊임없는 위치 회전으로 점유율 지배. 잃으면 즉시 카운터프레스 회수.',
    mechanism: 'Busquets 단일 피벗(앵커) + Xavi(우측 깊은 8번, 템포) + Iniesta(좌측 높은 8번, 침투) 비대칭. one-touch + 스캐닝 + 트라이앵글',
    examples: ['Pep Barcelona 2008-12 (UCL 2회, 라리가 3회)', 'Spain 2008/2010/2012 메이저 3연속', 'La Roja (Del Bosque)'],
    limit: '사이드 침투 부재 시 sterile possession(무위 점유) / 게겐프레싱에 격파 사례 (Chelsea·Bayern·Inter) / Xavi-Iniesta급 기술자 없이 재현 불가'
  },
  {
    name: 'PPDA', en: 'Passes Per Defensive Action', icon: '📊',
    tone: 'bg-slate-100 text-slate-800',
    definition: '압박 강도 지표. 상대가 우리 진영 60% 안에서 시도한 패스 수 ÷ 우리 수비 액션(태클·인터셉트·challenge·파울). 낮을수록 압박 강도 높음.',
    mechanism: '2014년 Colin Trainor가 StatsBomb에 발표. 4~8 = 강한 high press, 9~12 = mid-block, 13+ = low block.',
    examples: ['Liverpool 2021/22 PL 최저 8.62 (1위)', 'Klopp·Tuchel·Guardiola·Bielsa 팀들 항상 하위 PPDA'],
    limit: '강도만 측정, 질은 못함 / 세트피스·레드카드·점유 편향으로 단경기 신뢰도 낮음 / 낮은 PPDA가 실점 감소 보장 안 함'
  },
  {
    name: '카타나치오 현대화', en: 'Modern Catenaccio', icon: '🔒',
    tone: 'bg-gray-100 text-gray-800',
    definition: '1960~70년대 이탈리아 카타나치오(빗장수비) 현대 변형. 5-3-2 또는 4-4-2 깊은 블록 + 2~3패스 카운터의 효율.',
    mechanism: 'confrontation line을 자기 진영 1/3 고정 / wing-back/full-back 거의 안 올림 / 카운터는 ST 1~2 + 윙어 1만 올라가는 3v? 위주',
    examples: ['Simeone Atlético (2013/14 라리가)', 'Ranieri Leicester (2015/16 PL)', 'Conte Inter 5-3-2 (Barcelona 원정)'],
    limit: '점유 0%대 → 두 골 뒤지면 회복 거의 불가 / 90분 집중력 어려움 / 한 방 결정력 ST 없으면 무의미'
  }
]

// IFAB Laws of the Game 17개 룰 중 필드에서 자주 적용되는 14개 (2024~25 개정 반영)
export const RULES = [
  {
    code: 'offside', name: '오프사이드', law: 'Law 11', icon: '🚩',
    tone: 'bg-rose-50 text-rose-800',
    summary: '패스 받는 순간, 상대 진영에서 마지막 수비수(보통 CB) 보다 골라인에 가까우면 오프사이드.',
    detail: '기준은 "공이 떠난 순간". 본인 진영·코너킥·골킥·스로인 시 X. VAR 도입 후 발끝 1cm까지 판정 가능 (반자동 오프사이드 기술 SAOT).',
    foul: '간접 프리킥 — 반칙 위치에서 수비팀 진행.',
    tip: '동호회는 부심 없으면 너무 엄격하게 보지 말기. "명백히 라인 한 발 이상 넘었을 때만" 합의가 분쟁 ↓.'
  },
  {
    code: 'throwin', name: '스로인', law: 'Law 15', icon: '🙌',
    tone: 'bg-blue-50 text-blue-800',
    summary: '공이 사이드라인을 완전히 넘으면, 마지막 터치한 팀의 반대편이 양손으로 던져 재개.',
    detail: '양손 머리 뒤 → 앞으로. 양발이 라인 위 또는 밖에 닿아야. 점프 가능하지만 두 발 동시 떨어지면 X. 스로인 직접 골 X.',
    foul: 'foul throw → 상대 스로인. 반칙 종류: 한 손, 머리 뒤 안 거침, 발 떨어짐, 라인 안쪽 발.',
    tip: '동호회는 한 손 던지기·앞 발 안 들기 자주 발생. "발 라인 위에" 와 "양손 머리 뒤" 두 가지만 강제해도 95% 해결.'
  },
  {
    code: 'goalkick', name: '골킥', law: 'Law 16', icon: '🥅',
    tone: 'bg-emerald-50 text-emerald-800',
    summary: '공이 골라인 넘었고 공격팀이 마지막으로 터치한 경우. 수비팀 페널티 박스 어디서나 차서 재개.',
    detail: '2019 IFAB 개정: 받는 선수가 페널티 박스 안에서도 OK (이전엔 박스 밖만 가능). 빌드업 트렌드 가속한 변경.',
    foul: '없음 — 재개 방식.',
    tip: '동호회 GK가 발 약하면 그냥 길게 차는 게 안전. 박스 안 짧은 패스는 CB·6번이 압박 회피 자신 있을 때만.'
  },
  {
    code: 'corner', name: '코너킥', law: 'Law 17', icon: '⛳',
    tone: 'bg-amber-50 text-amber-800',
    summary: '공이 골라인 넘었고 수비팀이 마지막 터치한 경우. 공격팀이 코너 아크 안에서 차서 재개.',
    detail: '코너 아크(반경 1m) 안에서 차야. 직접 골 OK (코너에서 바로 골). 상대는 9.15m 떨어져야.',
    foul: '코너 아크 밖에서 차거나, 두 번 연속 터치 시 → 상대 간접 프리킥.',
    tip: '동호회 90% 세트피스 득점원. "코너 누가 차는지 + 누가 어디 위치하는지" 약속 1개만 정해도 효과 큼.'
  },
  {
    code: 'freekick', name: '프리킥', law: 'Law 13', icon: '⚽',
    tone: 'bg-cyan-50 text-cyan-800',
    summary: '반칙·오프사이드 후 재개. 직접(Direct) / 간접(Indirect) 2종.',
    detail: '직접 프리킥: 직접 골 OK — 트리핑·차지·푸시·홀딩·핸드볼·위험 플레이 등 공격 반칙. 간접: 다른 선수 터치 후 골 OK — GK 백패스 핸들링·위험 플레이·오프사이드 등. 상대 9.15m 떨어져야. 박스 안 직접 프리킥 → 페널티킥.',
    foul: '재개 후 차기 전 상대가 9.15m 안 들어오면 옐로.',
    tip: '동호회는 9.15m 정확히 못 잼 — "약 4걸음 이상" 정도 합의. 빠른 재개(quick free kick) 안 막기.'
  },
  {
    code: 'penalty', name: '페널티킥', law: 'Law 14', icon: '🎯',
    tone: 'bg-rose-50 text-rose-800',
    summary: '박스 안에서 수비팀이 직접 프리킥 반칙 또는 핸드볼 시. 11m 마크에서 키커 vs GK 1대1.',
    detail: 'GK는 골라인 위 한 발 이상. 키커는 한 번만 — stutter step(잠시 멈춤) OK, but 정지 후 다시 출발 X. 미스 후 리바운드 슛은 같은 선수만 X (다른 선수는 OK).',
    foul: 'GK 라인 일찍 벗어남 → VAR로 리테이크. 키커 페인트 정지 → 옐로 + 리테이크.',
    tip: '동호회는 12m 또는 10m 등 코트 사정 따라 변형. GK 라인 강제하지 말기 (분쟁 원인).'
  },
  {
    code: 'handball', name: '핸드볼', law: 'Law 12', icon: '✋',
    tone: 'bg-amber-50 text-amber-800',
    summary: '의도적 또는 부자연스러운 팔 위치로 공을 만지면 핸드볼.',
    detail: '2021 개정 + 2024 추가: ① 의도적 → 무조건 핸드볼 ② 비의도라도 팔이 신체 라인 위로 들렸거나 부자연스러운 위치면 핸드볼. 자신의 머리·몸·발에 맞고 손에 닿는 경우 → 무효. 2024 개정: 우연히 손에 맞고 곧바로 본인이 슛/패스해 골 → 무효.',
    foul: '직접 프리킥 또는 페널티. GK는 자기 박스 안에서만 손 사용 가능.',
    tip: '동호회 가장 분쟁 잦은 룰. "팔이 몸에 붙어있으면 OK / 들었으면 NO" 단순 룰로 합의.'
  },
  {
    code: 'cards', name: '카드', law: 'Law 12', icon: '🟨',
    tone: 'bg-yellow-50 text-yellow-800',
    summary: '옐로(경고) 2장 = 레드. 직접 레드도 가능.',
    detail: '옐로: 반복 파울, 비스포츠적 행위, 항의, 일부러 시간끌기, 골 세리머니 셔츠 벗기, 빠른 재개 방해. 직접 레드: 폭력, 침뱉기, 거친 태클(SFP), 명백한 골 찬스 차단(DOGSO), 욕설/공격적 언행, 옐로 2장.',
    foul: '레드 → 즉시 퇴장, 다음 경기 출전 정지. 11명 → 10명.',
    tip: '동호회는 카드 시스템 거의 사용 X. 대신 "두 번 항의/거친 태클 시 5분 쿨다운" 등 자체 룰 권장.'
  },
  {
    code: 'advantage', name: '어드밴티지 룰', law: 'Law 5', icon: '➡️',
    tone: 'bg-emerald-50 text-emerald-800',
    summary: '반칙 당해도 공격 유리하면 심판이 휘슬 안 불고 플레이 계속.',
    detail: '5초 안에 어드밴티지 안 살면 다시 휘슬 + 원래 반칙 위치에서 재개. 카드는 다음 데드볼에서 회수.',
    foul: '없음 — 심판 재량.',
    tip: '동호회는 보통 그냥 휘슬 부는 게 깔끔. 어드밴티지 부르려면 "GO!" 신호 약속.'
  },
  {
    code: 'backpass', name: '백패스 룰', law: 'Law 12', icon: '🔙',
    tone: 'bg-violet-50 text-violet-800',
    summary: '동료가 의도적으로 발로 패스한 공을 GK가 손으로 잡으면 반칙.',
    detail: '발 + 의도적 패스만 해당. 머리·가슴·무릎 패스는 OK. 동료 스로인 받기도 핸드 X. 위반 시 간접 프리킥 (박스 안에서 진행). 1992년 도입(이탈리아 월드컵 시간끌기 문제).',
    foul: '간접 프리킥 (박스 안에서 진행 — 6야드 박스 라인에서).',
    tip: '동호회 GK는 발로 받는 연습이 필수. 백패스 안 잡고 발로 차내거나 다른 동료에 패스.'
  },
  {
    code: 'gkholdtime', name: 'GK 8초 룰', law: 'Law 12 (2024 개정)', icon: '⏱️',
    tone: 'bg-cyan-50 text-cyan-800',
    summary: 'GK가 공을 손으로 소유한 후 8초 안에 풀어야 함.',
    detail: '이전 6초 → 2024년 시범 운영으로 8초로 연장. 어드밴티지 룰처럼 심판이 5초쯤부터 손가락 카운트다운 시작. 8초 초과 시 → 코너킥(이전엔 간접 프리킥 → 너무 가혹해 코너킥으로 변경).',
    foul: '코너킥 (2024 신규).',
    tip: '동호회는 거의 적용 안 됨. GK 시간끌기가 심하면 "10초 이상 들고 있지 말기" 자체 룰.'
  },
  {
    code: 'tackle', name: '태클', law: 'Law 12', icon: '🦵',
    tone: 'bg-amber-50 text-amber-800',
    summary: '공을 정확히 차내는 것은 정상. 사람 먼저 또는 위험한 동작은 반칙.',
    detail: '정상: 공만 정확히 컨택 (slide tackle 포함). 옐로: 공 안 맞추고 사람 다리만, 양발 점프, 늦은 태클. 직접 레드(SFP): studs-up 양발 점프, 위에서 아래 차기, 골절 위험 거친 태클.',
    foul: '직접 프리킥 + 옐로/레드 가능성.',
    tip: '동호회는 슬라이딩 태클 자체를 자제하는 게 안전. 친구 다치게 하면 친구 잃음. "서서 막기" 기본.'
  },
  {
    code: 'subs', name: '선수 교체', law: 'Law 3', icon: '🔄',
    tone: 'bg-blue-50 text-blue-800',
    summary: '경기당 5명 교체 (2020 코로나 이후 정식 적용). 윈도우 3번 + 하프타임 1번.',
    detail: '교체된 선수는 재투입 X (프로 기준). 명단 18~23명. 풀코트 일반 동호회는 자유 교체(roll-on) 흔함 — 한 번 나갔다 다시 들어옴.',
    foul: '명단 외 선수 투입 → 몰수패.',
    tip: '동호회 풀코트는 보통 roll-on 무제한. 풋살은 항상 roll-on. 명단 외 인원 데려와 뛰면 분쟁 원인.'
  },
  {
    code: 'time', name: '경기 시간', law: 'Law 7', icon: '⏰',
    tone: 'bg-slate-100 text-slate-800',
    summary: '45분 + 45분 + injury time. 추가시간(부상·교체·세리머니·VAR 시간 보상).',
    detail: '2022 카타르 WC 이후 추가시간 확대 — 10분 이상도 흔함. 동호회는 보통 30+30 또는 25+25, 풋살은 15+15 또는 20+20.',
    foul: '없음 — 경기 운영.',
    tip: '동호회는 폰 타이머로 자체 관리. 골 세리머니·시간끌기 보상하면 분쟁 ↓.'
  }
]

export const CLUB_RULES = [
  { n: 1, rule: '풋살/미니축구(5~7인)에서 4-3-3·3-5-2 같은 풀코트 시스템은 무의미. 2-1-2 또는 3-1 단순 셋업 + false 9·인버티드 윙어 컨셉만 차용.' },
  { n: 2, rule: '풀코트 11인 동호회에서는 4-4-2 또는 4-2-3-1이 평균 체력 대비 가장 안전. 4-3-3 도전 시 윙어 수비 가담 약속 필수.' },
  { n: 3, rule: '윙백·박스투박스 8번 자리는 체력 1·2위 인원. 후반 교체 우선순위 고정.' },
  { n: 4, rule: '게겐프레싱은 아마추어 90분 불가. mid-block + 카운터가 디폴트. 압박은 횡패스 트리거에만 짧게.' },
  { n: 5, rule: '포지셔닝 약속 3개만: ① CB 둘 사이 5m ② 풀백 한쪽만 전진 ③ ST는 박스 안 머무름 — 이 셋만 지켜도 실점 절반.' },
  { n: 6, rule: '트렌드 차용 우선순위: ① 반대발 윙어(즉효) ② 6번 1명 고정 ③ CB 중 1명만 빌드업 carrying ④ 인버티드 풀백·박스 미드필드는 자제.' }
]
