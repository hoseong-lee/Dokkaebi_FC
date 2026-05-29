// 도깨비FC 유니폼 합성 아바타 24종 — PIL 로 dicebear/avataaars + 가슴 로고(엠블렘+도깨비FC) 합성
// 원본 PNG → WebP quality=95 (평균 27 KB, 총 ~655 KB). public/avatars/{id}.webp
// 빌드 스크립트: jobs/uniform_batch.py (sampleAvatars 와 동기화 필요)

const BASE = import.meta.env.BASE_URL  // GitHub Pages: '/Dokkaebi_FC/' · dev: '/'
const url = (id) => `${BASE}avatars/${id}.webp`

export const SAMPLE_AVATARS = [
  // 남자 12
  { id: 'm1',  gender: 'male', label: '남 1',  url: url('m1')  },
  { id: 'm2',  gender: 'male', label: '남 2',  url: url('m2')  },
  { id: 'm3',  gender: 'male', label: '남 3',  url: url('m3')  },
  { id: 'm4',  gender: 'male', label: '남 4',  url: url('m4')  },
  { id: 'm5',  gender: 'male', label: '남 5',  url: url('m5')  },
  { id: 'm6',  gender: 'male', label: '남 6',  url: url('m6')  },
  { id: 'm7',  gender: 'male', label: '남 7',  url: url('m7')  },
  { id: 'm8',  gender: 'male', label: '남 8',  url: url('m8')  },
  { id: 'm9',  gender: 'male', label: '남 9',  url: url('m9')  },
  { id: 'm10', gender: 'male', label: '남 10', url: url('m10') },
  { id: 'm11', gender: 'male', label: '남 11', url: url('m11') },
  { id: 'm12', gender: 'male', label: '남 12', url: url('m12') },
  // 여자 12
  { id: 'f1',  gender: 'female', label: '여 1',  url: url('f1')  },
  { id: 'f2',  gender: 'female', label: '여 2',  url: url('f2')  },
  { id: 'f3',  gender: 'female', label: '여 3',  url: url('f3')  },
  { id: 'f4',  gender: 'female', label: '여 4',  url: url('f4')  },
  { id: 'f5',  gender: 'female', label: '여 5',  url: url('f5')  },
  { id: 'f6',  gender: 'female', label: '여 6',  url: url('f6')  },
  { id: 'f7',  gender: 'female', label: '여 7',  url: url('f7')  },
  { id: 'f8',  gender: 'female', label: '여 8',  url: url('f8')  },
  { id: 'f9',  gender: 'female', label: '여 9',  url: url('f9')  },
  { id: 'f10', gender: 'female', label: '여 10', url: url('f10') },
  { id: 'f11', gender: 'female', label: '여 11', url: url('f11') },
  { id: 'f12', gender: 'female', label: '여 12', url: url('f12') }
]
