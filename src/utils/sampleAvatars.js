// 무료 아바타 SDK: DiceBear (https://www.dicebear.com)
// SVG 이미지를 동적으로 생성. seed 가 같으면 같은 결과.
// img src 로 바로 사용 가능 (서비스 워커/캐싱 잘 됨).

const BASE = 'https://api.dicebear.com/7.x'

function url(style, seed, extra = '') {
  return `${BASE}/${style}/svg?seed=${encodeURIComponent(seed)}${extra ? '&' + extra : ''}`
}

// 12종 샘플 — 스타일·시드 조합으로 다양성 확보
export const SAMPLE_AVATARS = [
  { id: 'a1', label: '도깨비1', url: url('notionists', 'dokkaebi-1') },
  { id: 'a2', label: '도깨비2', url: url('notionists', 'dokkaebi-2') },
  { id: 'a3', label: '도깨비3', url: url('notionists', 'dokkaebi-3') },
  { id: 'a4', label: '큰웃음', url: url('big-smile', 'striker') },
  { id: 'a5', label: '큰웃음2', url: url('big-smile', 'midfield') },
  { id: 'a6', label: '아바타1', url: url('avataaars', 'goalkeeper') },
  { id: 'a7', label: '아바타2', url: url('avataaars', 'defender') },
  { id: 'a8', label: '로렐라이', url: url('lorelei', 'forward') },
  { id: 'a9', label: '로렐라이2', url: url('lorelei', 'winger') },
  { id: 'a10', label: '이모지1', url: url('fun-emoji', 'captain') },
  { id: 'a11', label: '이모지2', url: url('fun-emoji', 'mvp') },
  { id: 'a12', label: '두들', url: url('croodles', 'dokkaebi-fc') }
]
