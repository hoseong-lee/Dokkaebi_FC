// FUT 선수 카드 → 1080×1350 (인스타 4:5) PNG Blob 생성
// DOM 버전(FutPlayerCard.vue)과 디자인 소스를 공유 — SHIELD_D / FUT_TONES / futTier
import { ATTR_MAP, computeFifaAttrs, overallRating } from './skillMap'
import { POSITION_CATEGORY } from './positions'
import { playerPhotoSrc } from './playerPhoto'

const W = 1080
const H = 1350

// EA 정통 3단계 — OVR 70+ 골드 / 65+ 실버 / 그 외 브론즈
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

// 뮤트 4-stop 톤 — 채도 낮춘 샴페인 골드 / 쿨 실버 / 코퍼 브론즈
export const FUT_TONES = {
  gold: {
    stops: ['#f6ecca', '#e2c87e', '#b8923f', '#977331'],
    text: '#3a2a08', sub: 'rgba(58,42,8,0.72)', line: 'rgba(58,42,8,0.35)'
  },
  silver: {
    stops: ['#fafbfc', '#d8dee4', '#a7b0ba', '#7e8893'],
    text: '#1b232e', sub: 'rgba(27,35,46,0.72)', line: 'rgba(27,35,46,0.3)'
  },
  bronze: {
    stops: ['#f1d7b7', '#cd9c67', '#95653a', '#71482a'],
    text: '#2c1a07', sub: 'rgba(44,26,7,0.72)', line: 'rgba(44,26,7,0.35)'
  }
}

// 곡선 방패 path — viewBox 300×420 기준. DOM(SVG) 과 canvas 가 동일 좌표 사용.
export const SHIELD_D =
  'M150 10 L262 32 Q272 34 272 44 L272 318 Q272 330 264 336 L162 404 Q150 412 138 404 L36 336 Q28 330 28 318 L28 44 Q28 34 38 32 Z'

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

// SHIELD_D 와 동일한 곡선 방패 — (x,y,w,h) 영역에 스케일 적용
function shieldPath(ctx, x, y, w, h) {
  const sx = w / 300
  const sy = h / 420
  const X = (vx) => x + vx * sx
  const Y = (vy) => y + vy * sy
  ctx.beginPath()
  ctx.moveTo(X(150), Y(10))
  ctx.lineTo(X(262), Y(32))
  ctx.quadraticCurveTo(X(272), Y(34), X(272), Y(44))
  ctx.lineTo(X(272), Y(318))
  ctx.quadraticCurveTo(X(272), Y(330), X(264), Y(336))
  ctx.lineTo(X(162), Y(404))
  ctx.quadraticCurveTo(X(150), Y(412), X(138), Y(404))
  ctx.lineTo(X(36), Y(336))
  ctx.quadraticCurveTo(X(28), Y(330), X(28), Y(318))
  ctx.lineTo(X(28), Y(44))
  ctx.quadraticCurveTo(X(28), Y(34), X(38), Y(32))
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
  const s = height / 230
  ctx.beginPath()
  ctx.ellipse(cx, topY + 58 * s, 36 * s, 40 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(cx - 14 * s, topY + 90 * s, 28 * s, 22 * s, 8 * s)
  ctx.fill()
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
  const tone = FUT_TONES[tier]
  const posCode = player?.mainPosition || player?.position || '—'
  const KO = Object.fromEntries(ATTR_MAP.map((a) => [a.id, a.ko]))

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 배경 — 검정 + 금색 라디얼 후광 (MOM 카드와 시리즈감)
  ctx.fillStyle = '#09090b'
  ctx.fillRect(0, 0, W, H)
  const halo = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, 700)
  halo.addColorStop(0, 'rgba(245,158,11,0.14)')
  halo.addColorStop(1, 'rgba(245,158,11,0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, W, H)

  // 카드 영역 (5:7)
  const cw = 760
  const ch = cw * 1.4
  const cx0 = (W - cw) / 2
  const cy0 = (H - ch) / 2
  const cxm = cx0 + cw / 2
  const cym = cy0 + ch / 2

  // 본체 — 부드러운 그림자 + 4-stop 그라데이션
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 22
  shieldPath(ctx, cx0, cy0, cw, ch)
  const cardGrad = ctx.createLinearGradient(0, cy0, 0, cy0 + ch)
  cardGrad.addColorStop(0, tone.stops[0])
  cardGrad.addColorStop(0.38, tone.stops[1])
  cardGrad.addColorStop(0.78, tone.stops[2])
  cardGrad.addColorStop(1, tone.stops[3])
  ctx.fillStyle = cardGrad
  ctx.fill()
  ctx.restore()

  // 카드 내부 clip 시작
  ctx.save()
  shieldPath(ctx, cx0, cy0, cw, ch)
  ctx.clip()

  // 대각 광택 (sheen)
  const sheen = ctx.createLinearGradient(cx0 + cw * 0.13, cy0 + ch * 0.05, cx0 + cw * 0.87, cy0 + ch * 0.72)
  sheen.addColorStop(0, 'rgba(255,255,255,0.30)')
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.06)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(cx0, cy0, cw, ch)

  // 홀로그래픽 밴드 (전 등급) — DOM 의 .holo sweep 스냅샷
  const holo = ctx.createLinearGradient(cx0, cy0 + ch * 0.15, cx0 + cw, cy0 + ch * 0.85)
  holo.addColorStop(0.18, 'rgba(255,255,255,0)')
  holo.addColorStop(0.36, 'rgba(255,255,255,0.16)')
  holo.addColorStop(0.44, 'rgba(170,255,238,0.14)')
  holo.addColorStop(0.52, 'rgba(255,170,255,0.12)')
  holo.addColorStop(0.6, 'rgba(255,255,255,0.15)')
  holo.addColorStop(0.8, 'rgba(255,255,255,0)')
  ctx.fillStyle = holo
  ctx.fillRect(cx0, cy0, cw, ch)

  // 기요셰풍 아크 패턴 (하단, 옅게)
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5
  for (const r of [190, 215, 240]) {
    ctx.beginPath()
    ctx.arc(cxm, cy0 + ch * (500 / 420), r * (cw / 300), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // 우측: 사진 또는 실루엣 (이름 바 위까지)
  const photoSrcUrl = playerPhotoSrc(player)
  const photoBottom = cy0 + ch * 0.555
  if (photoSrcUrl) {
    const img = await loadImage(photoSrcUrl)
    if (img) {
      const areaH = ch * 0.48
      const scale = areaH / img.height
      const dw = img.width * scale
      ctx.drawImage(img, cx0 + cw * 0.62 - dw / 2, photoBottom - areaH, dw, areaH)
    } else {
      drawSilhouette(ctx, player, cx0 + cw * 0.62, photoBottom, ch * 0.44)
    }
  } else {
    drawSilhouette(ctx, player, cx0 + cw * 0.62, photoBottom, ch * 0.44)
  }

  // 좌상단: OVR + 포지션 + 엠블럼 (헤어라인 보더 안쪽으로)
  const leftX = cx0 + cw * 0.18
  ctx.fillStyle = tone.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '900 102px "Pretendard", sans-serif'
  ctx.fillText(String(ovr), leftX, cy0 + ch * 0.2)
  ctx.font = '700 36px "Pretendard", sans-serif'
  ctx.fillText(posCode, leftX, cy0 + ch * 0.255)
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(leftX - 28, cy0 + ch * 0.278)
  ctx.lineTo(leftX + 28, cy0 + ch * 0.278)
  ctx.stroke()
  if (emblemUrl) {
    const emblem = await loadImage(emblemUrl)
    if (emblem) {
      const es = 74
      ctx.save()
      ctx.beginPath()
      ctx.arc(leftX, cy0 + ch * 0.328, es / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(emblem, leftX - es / 2, cy0 + ch * 0.328 - es / 2, es, es)
      ctx.restore()
    }
  }

  // 이름 바
  const nameY = cy0 + ch * 0.585
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx0 + cw * 0.11, nameY - 52)
  ctx.lineTo(cx0 + cw * 0.89, nameY - 52)
  ctx.moveTo(cx0 + cw * 0.11, nameY + 18)
  ctx.lineTo(cx0 + cw * 0.89, nameY + 18)
  ctx.stroke()
  ctx.fillStyle = tone.text
  ctx.font = '900 56px "Pretendard", sans-serif'
  ctx.fillText(player?.name || '', cxm, nameY)

  // 6 스탯 — 좌: PAC SHO PAS / 우: DRI DEF PHY (한글 라벨)
  const statTop = cy0 + ch * 0.675
  const rowGap = ch * 0.06
  const draw3 = (ids, colX) => {
    ids.forEach((id, i) => {
      const y = statTop + i * rowGap
      ctx.textAlign = 'right'
      ctx.font = '900 44px "Pretendard", sans-serif'
      ctx.fillStyle = tone.text
      ctx.fillText(String(attrs[id] ?? 50), colX, y)
      ctx.textAlign = 'left'
      ctx.font = '500 30px "Pretendard", sans-serif'
      ctx.fillStyle = tone.sub
      ctx.fillText(KO[id] || id, colX + 14, y)
    })
  }
  draw3(['PAC', 'SHO', 'PAS'], cx0 + cw * 0.27)
  draw3(['DRI', 'DEF', 'PHY'], cx0 + cw * 0.65)
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cxm, statTop - 38)
  ctx.lineTo(cxm, statTop + rowGap * 2 + 8)
  ctx.stroke()

  // 하단 클럽 레터링 (방패 테이퍼 폭 안에 들어가게 작게)
  ctx.textAlign = 'center'
  ctx.font = '700 20px "Pretendard", sans-serif'
  ctx.fillStyle = tone.sub
  ctx.fillText('D O K K A E B I  F C', cxm, cy0 + ch * 0.878)

  ctx.restore() // clip 해제

  // 내부 헤어라인 보더 (중심 기준 95.2% 스케일)
  ctx.save()
  ctx.translate(cxm, cym)
  ctx.scale(0.952, 0.952)
  ctx.translate(-cxm, -cym)
  shieldPath(ctx, cx0, cy0, cw, ch)
  ctx.restore()
  ctx.strokeStyle = tone.line
  ctx.lineWidth = 3
  ctx.stroke()

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
