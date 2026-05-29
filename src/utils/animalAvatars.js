// 동물 이모지 12종 (twemoji CDN SVG)
// 사용처: AvatarPicker 의 🐯 동물 탭. PlayerAvatar 컴포넌트가 photoURL 을 그대로 <img src> 로 렌더하므로 SVG URL 그대로 저장 가능.

const TW = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'

export const ANIMAL_AVATARS = [
  { id: 'a1',  label: '호랑이', emoji: '🐯', url: `${TW}/1f42f.svg` },
  { id: 'a2',  label: '사자',   emoji: '🦁', url: `${TW}/1f981.svg` },
  { id: 'a3',  label: '곰',     emoji: '🐻', url: `${TW}/1f43b.svg` },
  { id: 'a4',  label: '판다',   emoji: '🐼', url: `${TW}/1f43c.svg` },
  { id: 'a5',  label: '여우',   emoji: '🦊', url: `${TW}/1f98a.svg` },
  { id: 'a6',  label: '늑대',   emoji: '🐺', url: `${TW}/1f43a.svg` },
  { id: 'a7',  label: '개',     emoji: '🐶', url: `${TW}/1f436.svg` },
  { id: 'a8',  label: '토끼',   emoji: '🐰', url: `${TW}/1f430.svg` },
  { id: 'a9',  label: '소',     emoji: '🐮', url: `${TW}/1f42e.svg` },
  { id: 'a10', label: '코끼리', emoji: '🐘', url: `${TW}/1f418.svg` },
  { id: 'a11', label: '원숭이', emoji: '🐵', url: `${TW}/1f435.svg` },
  { id: 'a12', label: '기린',   emoji: '🦒', url: `${TW}/1f992.svg` }
]
