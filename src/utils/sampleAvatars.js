// DiceBear avataaars 7.x 기반 — 도깨비FC 검정 유니폼(ShirtCrewNeck/Black) 통일.
// 다양한 피부톤·헤어로 남자 6 + 여자 6 = 12종.
// 다른 캐릭터를 추가하려면 SAMPLE_AVATARS 에 항목 추가만.

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

export const SAMPLE_AVATARS = [
  // 남자 (다양한 피부톤 × 짧은 헤어)
  { id: 'm1', gender: 'male', label: '남자 1', url: avataaars({
    seed: 'dok-m1', skinColor: 'pale', top: 'shortHairShortFlat', hairColor: 'brownDark'
  })},
  { id: 'm2', gender: 'male', label: '남자 2', url: avataaars({
    seed: 'dok-m2', skinColor: 'light', top: 'shortHairTheCaesar', hairColor: 'black'
  })},
  { id: 'm3', gender: 'male', label: '남자 3', url: avataaars({
    seed: 'dok-m3', skinColor: 'yellow', top: 'shortHairShortCurly', hairColor: 'black'
  })},
  { id: 'm4', gender: 'male', label: '남자 4', url: avataaars({
    seed: 'dok-m4', skinColor: 'tanned', top: 'shortHairFrizzle', hairColor: 'brown'
  })},
  { id: 'm5', gender: 'male', label: '남자 5', url: avataaars({
    seed: 'dok-m5', skinColor: 'brown', top: 'shortHairDreads01', hairColor: 'black'
  })},
  { id: 'm6', gender: 'male', label: '남자 6', url: avataaars({
    seed: 'dok-m6', skinColor: 'darkBrown', top: 'noHair'
  })},

  // 여자 (다양한 피부톤 × 긴 헤어)
  { id: 'f1', gender: 'female', label: '여자 1', url: avataaars({
    seed: 'dok-f1', skinColor: 'pale', top: 'longHairStraight', hairColor: 'brownDark'
  })},
  { id: 'f2', gender: 'female', label: '여자 2', url: avataaars({
    seed: 'dok-f2', skinColor: 'light', top: 'longHairBob', hairColor: 'black'
  })},
  { id: 'f3', gender: 'female', label: '여자 3', url: avataaars({
    seed: 'dok-f3', skinColor: 'yellow', top: 'longHairCurvy', hairColor: 'black'
  })},
  { id: 'f4', gender: 'female', label: '여자 4', url: avataaars({
    seed: 'dok-f4', skinColor: 'tanned', top: 'longHairFro', hairColor: 'brown'
  })},
  { id: 'f5', gender: 'female', label: '여자 5', url: avataaars({
    seed: 'dok-f5', skinColor: 'brown', top: 'longHairBigHair', hairColor: 'black'
  })},
  { id: 'f6', gender: 'female', label: '여자 6', url: avataaars({
    seed: 'dok-f6', skinColor: 'darkBrown', top: 'longHairMiaWallace', hairColor: 'black'
  })}
]
