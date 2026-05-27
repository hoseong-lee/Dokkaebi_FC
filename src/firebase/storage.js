import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './config'

// 선수 사진 업로드 → download URL 반환
export async function uploadPlayerPhoto(playerId, file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `players/${playerId}/avatar_${Date.now()}.${ext}`
  const r = storageRef(storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

export async function uploadMatchPhoto(matchId, file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `matches/${matchId}/${Date.now()}.${ext}`
  const r = storageRef(storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

export async function deleteByUrl(url) {
  try {
    await deleteObject(storageRef(storage, url))
  } catch (e) {
    console.warn('storage 삭제 실패', e)
  }
}
