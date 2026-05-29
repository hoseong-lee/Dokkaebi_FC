// DiceBear avataaars 7.x — 도깨비FC 검정 유니폼 + 24종(남12 + 여12).
// 피부톤·헤어스타일·헤어컬러 조합으로 다양화. 일부는 펀 컬러(핑크·플래티넘·실버 등).

const BASE = 'https://api.dicebear.com/7.x/avataaars/svg'

function avataaars(opts) {
  const params = new URLSearchParams({
    clothing: 'shirtCrewNeck',
    clothesColor: 'black',
    eyebrows: 'default',
    mouth: 'smile',
    eyes: 'happy',
    ...opts
  })
  return `${BASE}?${params.toString()}`
}

// 헤어 컬러: auburn, black, blonde, blondeGolden, brown, brownDark, pastelPink, platinum, red, silverGray

export const SAMPLE_AVATARS = [
  // ─── 남자 12 ───
  { id: 'm1',  gender: 'male', label: '남 1',  url: avataaars({ seed:'dok-m1',  skinColor:'pale',      top:'shortHairShortFlat',       hairColor:'brownDark' }) },
  { id: 'm2',  gender: 'male', label: '남 2',  url: avataaars({ seed:'dok-m2',  skinColor:'light',     top:'shortHairTheCaesar',       hairColor:'black' }) },
  { id: 'm3',  gender: 'male', label: '남 3',  url: avataaars({ seed:'dok-m3',  skinColor:'yellow',    top:'shortHairShortCurly',      hairColor:'black' }) },
  { id: 'm4',  gender: 'male', label: '남 4',  url: avataaars({ seed:'dok-m4',  skinColor:'tanned',    top:'shortHairFrizzle',         hairColor:'brown' }) },
  { id: 'm5',  gender: 'male', label: '남 5',  url: avataaars({ seed:'dok-m5',  skinColor:'brown',     top:'shortHairDreads01',        hairColor:'black' }) },
  { id: 'm6',  gender: 'male', label: '남 6',  url: avataaars({ seed:'dok-m6',  skinColor:'darkBrown', top:'noHair' }) },
  { id: 'm7',  gender: 'male', label: '남 7',  url: avataaars({ seed:'dok-m7',  skinColor:'light',     top:'shortHairShaggyMullet',    hairColor:'blonde',     facialHair:'beardLight' }) },
  { id: 'm8',  gender: 'male', label: '남 8',  url: avataaars({ seed:'dok-m8',  skinColor:'pale',      top:'shortHairShortRound',      hairColor:'platinum' }) },
  { id: 'm9',  gender: 'male', label: '남 9',  url: avataaars({ seed:'dok-m9',  skinColor:'tanned',    top:'shortHairSides',           hairColor:'red' }) },
  { id: 'm10', gender: 'male', label: '남 10', url: avataaars({ seed:'dok-m10', skinColor:'light',     top:'shortHairTheCaesarSidePart', hairColor:'pastelPink' }) },
  { id: 'm11', gender: 'male', label: '남 11', url: avataaars({ seed:'dok-m11', skinColor:'yellow',    top:'shortHairDreads02',        hairColor:'silverGray', accessories:'sunglasses' }) },
  { id: 'm12', gender: 'male', label: '남 12', url: avataaars({ seed:'dok-m12', skinColor:'brown',     top:'shortHairShortWaved',      hairColor:'auburn',     facialHair:'beardMedium' }) },

  // ─── 여자 12 ───
  { id: 'f1',  gender: 'female', label: '여 1',  url: avataaars({ seed:'dok-f1',  skinColor:'pale',      top:'longHairStraight',         hairColor:'brownDark' }) },
  { id: 'f2',  gender: 'female', label: '여 2',  url: avataaars({ seed:'dok-f2',  skinColor:'light',     top:'longHairBob',              hairColor:'black' }) },
  { id: 'f3',  gender: 'female', label: '여 3',  url: avataaars({ seed:'dok-f3',  skinColor:'yellow',    top:'longHairCurvy',            hairColor:'black' }) },
  { id: 'f4',  gender: 'female', label: '여 4',  url: avataaars({ seed:'dok-f4',  skinColor:'tanned',    top:'longHairFro',              hairColor:'brown' }) },
  { id: 'f5',  gender: 'female', label: '여 5',  url: avataaars({ seed:'dok-f5',  skinColor:'brown',     top:'longHairBigHair',          hairColor:'black' }) },
  { id: 'f6',  gender: 'female', label: '여 6',  url: avataaars({ seed:'dok-f6',  skinColor:'darkBrown', top:'longHairMiaWallace',       hairColor:'black' }) },
  { id: 'f7',  gender: 'female', label: '여 7',  url: avataaars({ seed:'dok-f7',  skinColor:'light',     top:'longHairStraightStrand',   hairColor:'pastelPink' }) },
  { id: 'f8',  gender: 'female', label: '여 8',  url: avataaars({ seed:'dok-f8',  skinColor:'pale',      top:'longHairCurly',            hairColor:'red' }) },
  { id: 'f9',  gender: 'female', label: '여 9',  url: avataaars({ seed:'dok-f9',  skinColor:'tanned',    top:'longHairBun',              hairColor:'blondeGolden' }) },
  { id: 'f10', gender: 'female', label: '여 10', url: avataaars({ seed:'dok-f10', skinColor:'light',     top:'longHairFrida',            hairColor:'auburn',     accessories:'round' }) },
  { id: 'f11', gender: 'female', label: '여 11', url: avataaars({ seed:'dok-f11', skinColor:'yellow',    top:'longHairShavedSides',      hairColor:'silverGray' }) },
  { id: 'f12', gender: 'female', label: '여 12', url: avataaars({ seed:'dok-f12', skinColor:'brown',     top:'longHairDreads',           hairColor:'platinum' }) }
]
