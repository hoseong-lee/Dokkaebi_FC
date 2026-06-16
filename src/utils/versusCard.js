// 1:1 비교 → 1080×1350 VS 카드 PNG Blob (단톡/인스타 공유용)
import { ATTR_MAP, computeFifaAttrs, overallRating } from './skillMap'
import { futTier, FUT_TIER_LABEL, drawSilhouette } from './futCard'
import { playerSkillTags, playerPhotoSrc } from './playerPhoto'

const W = 1080
const H = 1350

const TIER_HEX = { gold: '#eab308', silver: '#a1a1aa', bronze: '#c2773f' }
const A_COLOR = '#f43f5e' // 빨강
const B_COLOR = '#0ea5e9' // 파랑

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generateVersusCard({ playerA, playerB, seasonId = null, seasonName = '통산', emblemUrl = null }) {
  const attrsA = computeFifaAttrs(playerSkillTags(playerA, seasonId))
  const attrsB = computeFifaAttrs(playerSkillTags(playerB, seasonId))
  const ovrA = overallRating(attrsA)
  const ovrB = overallRating(attrsB)
  const tierA = futTier(ovrA)
  const tierB = futTier(ovrB)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 배경 — 다크 + 좌(빨강)/우(파랑) 분할 글로우
  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, W, H)
  const gl = ctx.createLinearGradient(0, 0, W, 0)
  gl.addColorStop(0, 'rgba(244,63,94,0.16)')
  gl.addColorStop(0.5, 'rgba(0,0,0,0)')
  gl.addColorStop(1, 'rgba(14,165,233,0.16)')
  ctx.fillStyle = gl
  ctx.fillRect(0, 0, W, H)

  // 헤더
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '700 28px "Pretendard", sans-serif'
  ctx.fillText(`DOKKAEBI FC · ${seasonName}`, W / 2, 78)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 64px "Pretendard", sans-serif'
  ctx.fillText('능력치 1:1 비교', W / 2, 150)

  // 선수 사진/실루엣 + 이름 + OVR (좌/우)
  async function drawSide(player, attrs, ovr, tier, cx, color) {
    const photo = await loadImage(playerPhotoSrc(player) || '')
    const boxY = 200
    const boxH = 360
    if (photo) {
      const scale = boxH / photo.height
      const dw = photo.width * scale
      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 30
      ctx.drawImage(photo, cx - dw / 2, boxY, dw, boxH)
      ctx.restore()
    } else {
      // 사진 없으면 포지션 색 실루엣 (FUT 카드와 동일)
      ctx.save()
      ctx.shadowColor = color
      ctx.shadowBlur = 24
      drawSilhouette(ctx, player, cx, boxY + boxH, boxH * 0.92)
      ctx.restore()
    }
    // 이름
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.font = '900 52px "Pretendard", sans-serif'
    ctx.fillText(player.name || '', cx, boxY + boxH + 70)
    // OVR + 티어
    ctx.fillStyle = TIER_HEX[tier]
    ctx.font = '900 92px "Pretendard", sans-serif'
    ctx.fillText(String(ovr), cx, boxY + boxH + 170)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '700 30px "Pretendard", sans-serif'
    ctx.fillText(`${FUT_TIER_LABEL[tier].emoji} ${FUT_TIER_LABEL[tier].label}`, cx, boxY + boxH + 215)
  }
  await drawSide(playerA, attrsA, ovrA, tierA, W * 0.27, A_COLOR)
  await drawSide(playerB, attrsB, ovrB, tierB, W * 0.73, B_COLOR)

  // 중앙 VS
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '900 80px "Pretendard", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('VS', W / 2, 420)

  // 스탯 우열 막대 (하단)
  const statTop = 900
  const rowGap = 66
  const barW = 360
  ATTR_MAP.forEach((attr, i) => {
    const y = statTop + i * rowGap
    const a = attrsA[attr.id] || 50
    const b = attrsB[attr.id] || 50
    const total = a + b
    // 라벨 (중앙)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '700 28px "Pretendard", sans-serif'
    ctx.fillText(attr.ko, W / 2, y + 8)
    // A 기준 우열 화살표 (A 우위면 빨강▲, 열위면 파랑▼, 동률 =)
    const aWin = a > b
    const bWin = b > a
    // A 값 (좌)
    ctx.textAlign = 'right'
    ctx.fillStyle = a >= b ? A_COLOR : 'rgba(255,255,255,0.4)'
    ctx.font = '900 36px "Pretendard", sans-serif'
    ctx.fillText(String(a), W / 2 - 120, y + 10)
    // A 화살표 (값 왼쪽)
    ctx.font = '900 30px "Pretendard", sans-serif'
    ctx.fillStyle = aWin ? A_COLOR : 'rgba(255,255,255,0.25)'
    ctx.fillText(aWin ? '▲' : (a === b ? '=' : '▼'), W / 2 - 200, y + 9)
    // B 값 (우)
    ctx.textAlign = 'left'
    ctx.fillStyle = b >= a ? B_COLOR : 'rgba(255,255,255,0.4)'
    ctx.font = '900 36px "Pretendard", sans-serif'
    ctx.fillText(String(b), W / 2 + 120, y + 10)
    // B 화살표 (값 오른쪽)
    ctx.font = '900 30px "Pretendard", sans-serif'
    ctx.fillStyle = bWin ? B_COLOR : 'rgba(255,255,255,0.25)'
    ctx.fillText(bWin ? '▲' : (a === b ? '=' : '▼'), W / 2 + 175, y + 9)
    // 막대 — 중앙에서 양쪽으로
    const aW = (a / total) * barW
    const bW = (b / total) * barW
    ctx.fillStyle = A_COLOR
    roundRect(ctx, W / 2 - 100 - aW, y - 10, aW, 14, 6)
    ctx.fill()
    ctx.fillStyle = B_COLOR
    roundRect(ctx, W / 2 + 100, y - 10, bW, 14, 6)
    ctx.fill()
  })

  // 하단 표기
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = '500 24px "Pretendard", sans-serif'
  ctx.fillText('dokkaebi-fc · skill reputation', W / 2, H - 40)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob 실패'))), 'image/png')
  })
}
