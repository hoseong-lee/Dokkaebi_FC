// 사진/동영상 업로드 기능은 현재 사용하지 않음 (Realtime DB 만 사용).
// Cloud Storage 를 다시 쓰려면 아래 코드와 config.js 의 getStorage 주석을 해제할 것.
//
// import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
// import { storage } from './config'
//
// export async function uploadPlayerPhoto(playerId, file) {
//   const ext = file.name.split('.').pop() || 'jpg'
//   const path = `players/${playerId}/avatar_${Date.now()}.${ext}`
//   const r = storageRef(storage, path)
//   await uploadBytes(r, file)
//   return getDownloadURL(r)
// }
//
// export async function uploadMatchPhoto(matchId, file) {
//   const ext = file.name.split('.').pop() || 'jpg'
//   const path = `matches/${matchId}/${Date.now()}.${ext}`
//   const r = storageRef(storage, path)
//   await uploadBytes(r, file)
//   return getDownloadURL(r)
// }
//
// export async function deleteByUrl(url) {
//   try {
//     await deleteObject(storageRef(storage, url))
//   } catch (e) {
//     console.warn('storage 삭제 실패', e)
//   }
// }
