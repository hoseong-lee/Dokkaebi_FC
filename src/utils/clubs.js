// 유럽 주요 클럽 큐레이션 (이름·약식·리그·색·로고)
// 로고: api-sports.io 무료 CDN — https://media.api-sports.io/football/teams/{id}.png

export function clubLogo(id) {
  return id ? `https://media.api-sports.io/football/teams/${id}.png` : ''
}

export const CLUBS = [
  // 프리미어 리그
  { id: 33,  name: '맨체스터 유나이티드', short: '맨유',       league: 'PL', color: 'bg-red-600 text-white' },
  { id: 50,  name: '맨체스터 시티',       short: '맨시티',     league: 'PL', color: 'bg-sky-500 text-white' },
  { id: 40,  name: '리버풀',              short: '리버풀',     league: 'PL', color: 'bg-red-700 text-white' },
  { id: 42,  name: '아스날',              short: '아스날',     league: 'PL', color: 'bg-red-500 text-white' },
  { id: 49,  name: '첼시',                short: '첼시',       league: 'PL', color: 'bg-blue-600 text-white' },
  { id: 47,  name: '토트넘',              short: '토트넘',     league: 'PL', color: 'bg-slate-100 text-slate-900' },
  { id: 34,  name: '뉴캐슬',              short: '뉴캐슬',     league: 'PL', color: 'bg-slate-900 text-white' },
  // 라리가
  { id: 529, name: 'FC 바르셀로나',       short: '바르샤',     league: 'LL', color: 'bg-rose-700 text-white' },
  { id: 541, name: '레알 마드리드',       short: '레알',       league: 'LL', color: 'bg-white text-slate-900 ring-1 ring-slate-300' },
  { id: 530, name: '아틀레티코 마드리드', short: '아틀레티코', league: 'LL', color: 'bg-red-600 text-white' },
  // 분데스리가
  { id: 157, name: '바이에른 뮌헨',       short: '바이언',     league: 'BL', color: 'bg-red-700 text-white' },
  { id: 165, name: '도르트문트',          short: '도르트',     league: 'BL', color: 'bg-yellow-400 text-black' },
  { id: 168, name: '레버쿠젠',            short: '레버쿠젠',   league: 'BL', color: 'bg-red-700 text-white' },
  // 세리에 A
  { id: 496, name: '유벤투스',            short: '유벤투스',   league: 'IT', color: 'bg-slate-900 text-white' },
  { id: 489, name: 'AC 밀란',             short: 'AC밀란',     league: 'IT', color: 'bg-red-700 text-white' },
  { id: 505, name: '인터 밀란',           short: '인테르',     league: 'IT', color: 'bg-blue-900 text-white' },
  { id: 492, name: '나폴리',              short: '나폴리',     league: 'IT', color: 'bg-sky-400 text-white' },
  // 리그 1
  { id: 85,  name: 'PSG',                 short: 'PSG',        league: 'FR', color: 'bg-blue-800 text-white' },
  { id: 81,  name: '마르세유',            short: 'OM',         league: 'FR', color: 'bg-sky-400 text-white' },
  // 그 외
  { id: 194, name: '아약스',              short: '아약스',     league: 'NL', color: 'bg-red-600 text-white' },
  { id: 197, name: 'PSV 에인트호번',      short: 'PSV',        league: 'NL', color: 'bg-red-500 text-white' },
  { id: 212, name: '포르투',              short: '포르투',     league: 'PT', color: 'bg-blue-700 text-white' },
  { id: 211, name: '벤피카',              short: '벤피카',     league: 'PT', color: 'bg-red-700 text-white' },
  { id: 247, name: '셀틱',                short: '셀틱',       league: 'SC', color: 'bg-emerald-600 text-white' }
]

export const LEAGUE_LABEL = {
  PL: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 PL',
  LL: '🇪🇸 LL',
  BL: '🇩🇪 BL',
  IT: '🇮🇹 SA',
  FR: '🇫🇷 L1',
  NL: '🇳🇱',
  PT: '🇵🇹',
  SC: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
}

export function findClub(name) {
  if (!name) return null
  const q = String(name).trim().toLowerCase()
  return CLUBS.find((c) => c.name.toLowerCase() === q || c.short.toLowerCase() === q) || null
}
