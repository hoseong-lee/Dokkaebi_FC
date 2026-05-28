// Cloudinary unsigned upload (서버 없이 클라이언트에서 직접 업로드)
// 사용 전 설정:
// 1) cloudinary.com 가입 → 대시보드에서 "Cloud name" 확인
// 2) Settings → Upload → "Add upload preset" → Signing Mode: Unsigned, 폴더(예: dokkaebi) 지정 → 저장
// 3) .env.local (또는 GitHub secrets) 에 아래 키 추가:
//    VITE_CLOUDINARY_CLOUD_NAME=xxxxx
//    VITE_CLOUDINARY_UPLOAD_PRESET=xxxxx

const cloudName = () => import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = () => import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export function isCloudinaryConfigured() {
  return !!(cloudName() && uploadPreset())
}

export async function uploadToCloudinary(file, { folder } = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary 설정이 필요합니다. README의 Cloudinary 섹션 참고.')
  }
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', uploadPreset())
  if (folder) fd.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName()}/image/upload`, {
    method: 'POST',
    body: fd
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Cloudinary 업로드 실패 (${res.status}): ${text.slice(0, 120)}`)
  }
  const json = await res.json()
  return {
    url: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
    format: json.format,
    bytes: json.bytes
  }
}

// 이미지 변환 URL (Cloudinary 트랜스포메이션 — 썸네일 등)
export function cldThumb(url, w = 400) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/c_fill,w_${w},q_auto,f_auto/`)
}
