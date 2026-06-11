// FUT 선수 카드 → 1080×1350 (인스타 4:5) PNG Blob 생성
// DOM 버전(FutPlayerCard.vue)과 동일 디자인의 canvas 렌더 — 단톡/인스타 공유용
import { ATTR_MAP, computeFifaAttrs, overallRating } from './skillMap'
import { POSITION_CATEGORY } from './positions'
import { playerPhotoSrc } from './playerPhoto'

const W = 1080
const H = 1350

// EA 정통 3단계 카드 등급 — OVR 70+ 골드 / 65+ 실버 / 그 외 브론즈
export function futTier(ovr) {
  if (ovr >= 70) return 'gold'
  if (ovr >= 65) return 'silver'
  return 'bronze'
}
export const FUT_TIER_LABEL = {
  gold: { emoji: '🥇', label: 'GOLD' },
  silver: { emoji: '🥈', label: 'SILVER' },
  bronze: { emoji: '🥉', label: 'BRONZE' }
}

// 단계별 카드 톤 (위→아래 그라데이션) + 텍스트 색 — FUT 골드/실버/브론즈 질감
const FUT_TONE = {
  gold:   { stops: ['#fde68a', '#facc15', '#d97706'], text: '#451a03', sub: 'rgba(69,26,3,0.75)', line: 'rgba(69,26,3,0.3)' },
  silver: { stops: ['#f4f4f5', '#d4d4d8', '#71717a'], text: '#18181b', sub: 'rgba(24,24,27,0.75)', line: 'rgba(24,24,27,0.25)' },
  bronze: { stops: ['#e7bb94', '#b9803f', '#7c4a21'], text: '#2d1606', sub: 'rgba(45,22,6,0.75)', line: 'rgba(45,22,6,0.3)' }
}

// 실루엣용 포지션 색 (PlayerSilhouette 와 동일 톤)
const SIL_TONE = {
  GK: ['#fbbf24', '#92400e'],
  DF: ['#38bdf8', '#075985'],
  MF: ['#34d399', '#065f46'],
  FW: ['#fb7185', '#9f1239']
}
const SIL_DEFAULT = ['#a1a1aa', '#3f3f46']

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// 방패 path — DOM clip-path 와 동일 비율: (50,0) (100,7) (100,82) (50,100) (0,82) (0,7)
function shieldPath(ctx, x, y, w, h) {
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, y)
  ctx.lineTo(x + w, y + h * 0.07)
  ctx.lineTo(x + w, y + h * 0.82)
  ctx.lineTo(x + w * 0.5, y + h)
  ctx.lineTo(x, y + h * 0.82)
  ctx.lineTo(x, y + h * 0.07)
  ctx.closePath()
}

function drawSilhouette(ctx, player, cx, bottomY, height) {
  const cat =
    POSITION_CATEGORY[player?.mainPosition] ||
    POSITION_CATEGORY[player?.subPosition] ||
    player?.position
  const [from, to] = SIL_TONE[cat] || SIL_DEFAULT
  const topY = bottomY - height
  const grad = ctx.createLinearGradient(0, topY, 0, bottomY)
  grad.addColorStop(0, from)
  grad.addColorStop(1, to)
  ctx.fillStyle = grad
  // 비율: viewBox 200x230 기준 → scale = height/230
  const s = height / 230
  // 머리
  ctx.beginPath()
  ctx.ellipse(cx, topY + 58 * s, 36 * s, 40 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  // 목
  ctx.beginPath()
  ctx.roundRect(cx - 14 * s, topY + 90 * s, 28 * s, 22 * s, 8 * s)
  ctx.fill()
  // 어깨/몸통
  ctx.beginPath()
  ctx.moveTo(cx, topY + 106 * s)
  ctx.bezierCurveTo(cx + 38 * s, topY + 106 * s, cx + 70 * s, topY + 128 * s, cx + 80 * s, topY + 168 * s)
  ctx.lineTo(cx + 86 * s, bottomY)
  ctx.lineTo(cx - 86 * s, bottomY)
  ctx.lineTo(cx - 80 * s, topY + 168 * s)
  ctx.bezierCurveTo(cx - 70 * s, topY + 128 * s, cx - 38 * s, topY + 106 * s, cx, topY + 106 * s)
  ctx.closePath()
  ctx.fill()
}

export async function generateFutCard({ player, skillTags = {}, emblemUrl = null }) {
  const attrs = computeFifaAttrs(skillTags)
  const ovr = overallRating(attrs)
  const tier = futTier(ovr)
  const tone = FUT_TONE[tier]
  const posCode = player?.mainPosition || player?.position || '—'
  // 능력치 한글 라벨 (PAC→스피드 등)
  const KO = Object.fromEntries(ATTR_MAP.map((a) => [a.id, a.ko]))

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 배경 — 검정 + 금색 라디얼 후광 (MOM 카드 톤과 시리즈감)
  ctx.fillStyle = '#09090b'
  ctx.fillRect(0, 0, W, H)
  const halo = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, 700)
  halo.addColorStop(0, 'rgba(245,158,11,0.16)')
  halo.addColorStop(1, 'rgba(245,158,11,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, W, H)

  // 카드 영역
  const cw = 760
  const ch = cw * 1.4 // 5:7
  const cx0 = (W - cw) / 2
  const cy0 = (H - ch) / 2

  // 카드 그림자 + 본체
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 24
  shieldPath(ctx, cx0, cy0, cw, ch)
  const cardGrad = ctx.createLinearGradient(0, cy0, 0, cy0 + ch)
  cardGrad.addColorStop(0, tone.stops[0])
  cardGrad.addColorStop(0.5, tone.stops[1])
  cardGrad.addColorStop(1, tone.stops[2])
  ctx.fillStyle = cardGrad
  ctx.fill()
  ctx.restore()

  // 이후 내용은 카드 안쪽으로 clip
  ctx.save()
  shieldPath(ctx, cx0, cy0, cw, ch)
  ctx.clip()

  // 우측: 사진 또는 실루엣 (이름 바 위까지)
  const photoSrcUrl = playerPhotoSrc(player)
  const photoBottom = cy0 + ch * 0.555
  if (photoSrcUrl) {
    const img = await loadImage(photoSrcUrl)
    if (img) {
      const areaH = ch * 0.48
      const scale = areaH / img.height
      const dw = img.width * scale
      const dh = areaH
      const dx = cx0 + cw * 0.62 - dw / 2 // 우측 영역 중앙
      ctx.drawImage(img, dx, photoBottom - dh, dw, dh)
    } else {
      drawSilhouette(ctx, player, cx0 + cw * 0.62, photoBottom, ch * 0.44)
    }
  } else {
    drawSilhouette(ctx, player, cx0 + cw * 0.62, photoBottom, ch * 0.44)
  }

  // 좌상단: OVR + 포지션 + 엠블럼
  const leftX = cx0 + cw * 0.16
  ctx.fillStyle = tone.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '900 120px "Pretendard", sans-serif'
  ctx.fillText(String(ovr), leftX, cy0 + ch * 0.21)
  ctx.font = '700 44px "Pretendard", sans-serif'
  ctx.fillText(posCode, leftX, cy0 + ch * 0.265)
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(leftX - 30, cy0 + ch * 0.285)
  ctx.lineTo(leftX + 30, cy0 + ch * 0.285)
  ctx.stroke()
  if (emblemUrl) {
    const emblem = await loadImage(emblemUrl)
    if (emblem) {
      const es = 76
      ctx.save()
      ctx.beginPath()
      ctx.arc(leftX, cy0 + ch * 0.335, es / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(emblem, leftX - es / 2, cy0 + ch * 0.335 - es / 2, es, es)
      ctx.restore()
    }
  }

  // 이름 바
  const nameY = cy0 + ch * 0.585
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx0 + cw * 0.08, nameY - 52)
  ctx.lineTo(cx0 + cw * 0.92, nameY - 52)
  ctx.moveTo(cx0 + cw * 0.08, nameY + 18)
  ctx.lineTo(cx0 + cw * 0.92, nameY + 18)
  ctx.stroke()
  ctx.fillStyle = tone.text
  ctx.font = '900 58px "Pretendard", sans-serif'
  ctx.fillText(player?.name || '', cx0 + cw / 2, nameY)

  // 6 스탯 — 좌: PAC SHO PAS / 우: DRI DEF PHY
  const statTop = cy0 + ch * 0.675
  const rowGap = ch * 0.062
  const colL = cx0 + cw * 0.28
  const colR = cx0 + cw * 0.66
  const draw3 = (ids, colX) => {
    ids.forEach((id, i) => {
      const y = statTop + i * rowGap
      ctx.textAlign = 'right'
      ctx.font = '900 46px "Pretendard", sans-serif'
      ctx.fillStyle = tone.text
      ctx.fillText(String(attrs[id] ?? 50), colX, y)
      ctx.textAlign = 'left'
      ctx.font = '600 32px "Pretendard", sans-serif'
      ctx.fillStyle = tone.sub
      ctx.fillText(KO[id] || id, colX + 14, y)
    })
  }
  draw3(['PAC', 'SHO', 'PAS'], colL)
  draw3(['DRI', 'DEF', 'PHY'], colR)
  // 중앙 세로 구분선
  ctx.strokeStyle = tone.line
  ctx.beginPath()
  ctx.moveTo(cx0 + cw / 2, statTop - 40)
  ctx.lineTo(cx0 + cw / 2, statTop + rowGap * 2 + 10)
  ctx.stroke()

  // 하단 클럽명 (방패 꼭짓점 위)
  ctx.textAlign = 'center'
  ctx.font = '700 26px "Pretendard", sans-serif'
  ctx.fillStyle = tone.sub
  ctx.fillText('D O K K A E B I   F C', cx0 + cw / 2, cy0 + ch * 0.885)

  ctx.restore()

  // 카드 바깥 하단 — 등급 라벨 + 생성 표기
  const tierMeta = FUT_TIER_LABEL[tier]
  ctx.textAlign = 'center'
  ctx.font = '700 34px "Pretendard", sans-serif'
  ctx.fillStyle = 'rgba(251,191,36,0.9)'
  ctx.fillText(`${tierMeta.emoji} ${tierMeta.label} CARD`, W / 2, cy0 + ch + 70)
  ctx.font = '500 24px "Pretendard", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText('dokkaebi-fc · skill reputation card', W / 2, cy0 + ch + 112)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('canvas toBlob 실패'))
    }, 'image/png')
  })
}
