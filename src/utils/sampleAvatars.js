// DiceBear avataaars 7.x — 도깨비FC 검정 유니폼 통일
// 주의: 7.x 는 색상값을 HEX(앞에 # 없음)로만 받음
// top enum 도 7.x 표기 사용 (shortHairXxx → shortXxx, longHairXxx → xxx)

const BASE = 'https://api.dicebear.com/7.x/avataaars/svg'

const SKIN = {
  pale: 'f4d2c4',
  light: 'edb98a',
  yellow: 'fdcdb8',
  tanned: 'd08b5b',
  brown: 'ae5d29',
  darkBrown: '89522c'
}
const HAIR = {
  black: '2c1b18',
  brownDark: '4a312c',
  brown: '724133',
  auburn: 'a55728',
  blonde: 'b58143',
  blondeGolden: 'd6b370',
  red: 'c93305',
  pastelPink: 'f59797',
  platinum: 'ecdcbf',
  silverGray: 'e8e1e1'
}
const CLOTHES_BLACK = '262e33' // 도깨비FC 유니폼 색

function avataaars(opts) {
  const params = new URLSearchParams({
    clothing: 'shirtCrewNeck',
    clothesColor: CLOTHES_BLACK,
    eyebrows: 'default',
    mouth: 'smile',
    eyes: 'happy',
    backgroundColor: 'transparent',
    ...opts
  })
  return `${BASE}?${params.toString()}`
}

export const SAMPLE_AVATARS = [
  // ─── 남자 12 (다양한 피부톤 × 짧은 헤어 × 일부 변형) ───
  { id: 'm1',  gender: 'male', label: '남 1',  url: avataaars({ seed:'dok-m1',  skinColor:SKIN.pale,      top:'shortFlat',          hairColor:HAIR.brownDark }) },
  { id: 'm2',  gender: 'male', label: '남 2',  url: avataaars({ seed:'dok-m2',  skinColor:SKIN.light,     top:'theCaesar',          hairColor:HAIR.black }) },
  { id: 'm3',  gender: 'male', label: '남 3',  url: avataaars({ seed:'dok-m3',  skinColor:SKIN.yellow,    top:'shortCurly',         hairColor:HAIR.black }) },
  { id: 'm4',  gender: 'male', label: '남 4',  url: avataaars({ seed:'dok-m4',  skinColor:SKIN.tanned,    top:'frizzle',            hairColor:HAIR.brown }) },
  { id: 'm5',  gender: 'male', label: '남 5',  url: avataaars({ seed:'dok-m5',  skinColor:SKIN.brown,     top:'dreads01',           hairColor:HAIR.black }) },
  { id: 'm6',  gender: 'male', label: '남 6',  url: avataaars({ seed:'dok-m6',  skinColor:SKIN.darkBrown, top:'shortRound',         hairColor:HAIR.black }) },
  { id: 'm7',  gender: 'male', label: '남 7',  url: avataaars({ seed:'dok-m7',  skinColor:SKIN.light,     top:'shaggyMullet',       hairColor:HAIR.blonde,     facialHair:'beardLight',  facialHairProbability:'100', facialHairColor:HAIR.blonde }) },
  { id: 'm8',  gender: 'male', label: '남 8',  url: avataaars({ seed:'dok-m8',  skinColor:SKIN.pale,      top:'shortRound',         hairColor:HAIR.platinum }) },
  { id: 'm9',  gender: 'male', label: '남 9',  url: avataaars({ seed:'dok-m9',  skinColor:SKIN.tanned,    top:'sides',              hairColor:HAIR.red }) },
  { id: 'm10', gender: 'male', label: '남 10', url: avataaars({ seed:'dok-m10', skinColor:SKIN.light,     top:'theCaesarAndSidePart', hairColor:HAIR.pastelPink }) },
  { id: 'm11', gender: 'male', label: '남 11', url: avataaars({ seed:'dok-m11', skinColor:SKIN.yellow,    top:'dreads02',           hairColor:HAIR.silverGray, accessories:'sunglasses', accessoriesProbability:'100' }) },
  { id: 'm12', gender: 'male', label: '남 12', url: avataaars({ seed:'dok-m12', skinColor:SKIN.brown,     top:'shortWaved',         hairColor:HAIR.auburn,     facialHair:'beardMedium', facialHairProbability:'100', facialHairColor:HAIR.auburn }) },

  // ─── 여자 12 (다양한 피부톤 × 긴 헤어) ───
  { id: 'f1',  gender: 'female', label: '여 1',  url: avataaars({ seed:'dok-f1',  skinColor:SKIN.pale,      top:'straight01',       hairColor:HAIR.brownDark }) },
  { id: 'f2',  gender: 'female', label: '여 2',  url: avataaars({ seed:'dok-f2',  skinColor:SKIN.light,     top:'bob',              hairColor:HAIR.black }) },
  { id: 'f3',  gender: 'female', label: '여 3',  url: avataaars({ seed:'dok-f3',  skinColor:SKIN.yellow,    top:'curvy',            hairColor:HAIR.black }) },
  { id: 'f4',  gender: 'female', label: '여 4',  url: avataaars({ seed:'dok-f4',  skinColor:SKIN.tanned,    top:'fro',              hairColor:HAIR.brown }) },
  { id: 'f5',  gender: 'female', label: '여 5',  url: avataaars({ seed:'dok-f5',  skinColor:SKIN.brown,     top:'bigHair',          hairColor:HAIR.black }) },
  { id: 'f6',  gender: 'female', label: '여 6',  url: avataaars({ seed:'dok-f6',  skinColor:SKIN.darkBrown, top:'miaWallace',       hairColor:HAIR.black }) },
  { id: 'f7',  gender: 'female', label: '여 7',  url: avataaars({ seed:'dok-f7',  skinColor:SKIN.light,     top:'straightAndStrand', hairColor:HAIR.pastelPink }) },
  { id: 'f8',  gender: 'female', label: '여 8',  url: avataaars({ seed:'dok-f8',  skinColor:SKIN.pale,      top:'curly',            hairColor:HAIR.red }) },
  { id: 'f9',  gender: 'female', label: '여 9',  url: avataaars({ seed:'dok-f9',  skinColor:SKIN.tanned,    top:'bun',              hairColor:HAIR.blondeGolden }) },
  { id: 'f10', gender: 'female', label: '여 10', url: avataaars({ seed:'dok-f10', skinColor:SKIN.light,     top:'frida',            hairColor:HAIR.auburn,    accessories:'round',    accessoriesProbability:'100' }) },
  { id: 'f11', gender: 'female', label: '여 11', url: avataaars({ seed:'dok-f11', skinColor:SKIN.yellow,    top:'shavedSides',      hairColor:HAIR.silverGray }) },
  { id: 'f12', gender: 'female', label: '여 12', url: avataaars({ seed:'dok-f12', skinColor:SKIN.brown,     top:'dreads',           hairColor:HAIR.platinum }) }
]
