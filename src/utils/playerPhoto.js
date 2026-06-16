// 선수 사진 단일 진입점 — MOM 카드 / FUT 카드 등 큰 비주얼 영역 공용.
// 우선순위: photoURL(정식 등록) → 임시 샘플(이름 매칭) → null(실루엣 폴백)

// 임시 샘플 — admin 에서 photoURL 등록하면 자동 무력화
const SAMPLE_PHOTOS = {
  '유희창': (import.meta.env.BASE_URL || '/') + 'sample-yuheechang-v3.png'
}

export function playerPhotoSrc(player) {
  if (player?.photoURL) return player.photoURL
  return SAMPLE_PHOTOS[player?.name] || null
}

// 선수의 스킬 평판(skillTags) 추출 — scope 없으면 통산
export function playerSkillTags(player, seasonId = null) {
  if (!player) return {}
  if (seasonId) return player.seasonStats?.[seasonId]?.skillTags || {}
  return player.stats?.skillTags || {}
}
