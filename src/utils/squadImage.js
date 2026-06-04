// 스쿼드 → 1080×1350 (인스타 세로) 이미지 PNG Blob 생성
// 위: 헤더(엠블렘 + 스쿼드 이름) / 중간: 미니피치 + 선수 배치 / 아래: 명단 + 작성자
import { getSlots } from './formations'

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${m}.${day}`
}

// 도깨비FC 컬러 팔레트
const NAVY = '#0a2540'
const GOLD = '#d4a73a'
const PITCH = '#0e7a4a'
const PITCH_DARK = '#0a5f3a'
const WHITE = '#ffffff'

// 포지션별 점 색 (FormationPitch / 미니피치와 동일)
const ROLE_COLOR = {
  GK: '#fbbf24',  // amber-400
  DF: '#0ea5e9',  // sky-500
  MF: '#10b981',  // emerald-500
  FW: '#f43f5e'   // rose-500
}

export async function generateSquadImage({ squad, players, emblemUrl }) {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const playerMap = new Map(players.map((p) => [p.id, p]))
  const lineup = squad.lineup || []
  const formation = squad.formation || ''
  const slots = formation ? getSlots(formation) : []
  const posMap = squad.positions || {}

  // 배경 (네이비 → 짙은 네이비 그라데이션)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, NAVY)
  bgGrad.addColorStop(1, '#061629')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── 헤더 (상단 200px) ──
  const HEADER_H = 200
  const emblem = emblemUrl ? await loadImage(emblemUrl) : null
  if (emblem) {
    ctx.drawImage(emblem, 60, 50, 100, 100)
  }
  // 스쿼드 이름 (큰 글씨)
  ctx.fillStyle = WHITE
  ctx.font = 'bold 56px "Pretendard", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(squad.name || '도깨비FC 스쿼드', 190, 80)
  // 서브타이틀 (포메이션 + 인원)
  ctx.fillStyle = GOLD
  ctx.font = '500 28px "Pretendard", sans-serif'
  const subInfo = [formation || '포메이션 미지정', `${lineup.length}명`].filter(Boolean).join('  ·  ')
  ctx.fillText(subInfo, 190, 130)

  // 구분선
  ctx.strokeStyle = 'rgba(212,167,58,0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, HEADER_H - 10)
  ctx.lineTo(W - 60, HEADER_H - 10)
  ctx.stroke()

  // ── 미니피치 (중간 720px) ──
  const PITCH_TOP = HEADER_H + 20
  const PITCH_H = 720
  const PITCH_W = W - 120
  const PITCH_X = 60
  const PITCH_Y = PITCH_TOP

  // 피치 배경 (그라데이션 잔디)
  const pitchGrad = ctx.createLinearGradient(0, PITCH_Y, 0, PITCH_Y + PITCH_H)
  pitchGrad.addColorStop(0, PITCH)
  pitchGrad.addColorStop(0.5, PITCH_DARK)
  pitchGrad.addColorStop(1, PITCH)
  ctx.fillStyle = pitchGrad
  // 라운드 모서리
  const RADIUS = 24
  ctx.beginPath()
  ctx.roundRect(PITCH_X, PITCH_Y, PITCH_W, PITCH_H, RADIUS)
  ctx.fill()

  // 피치 라인 (외곽 + 중앙선 + 센터서클)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(PITCH_X + 8, PITCH_Y + 8, PITCH_W - 16, PITCH_H - 16, RADIUS - 8)
  ctx.stroke()
  // 중앙선
  ctx.beginPath()
  ctx.moveTo(PITCH_X + 8, PITCH_Y + PITCH_H / 2)
  ctx.lineTo(PITCH_X + PITCH_W - 8, PITCH_Y + PITCH_H / 2)
  ctx.stroke()
  // 센터서클
  ctx.beginPath()
  ctx.arc(PITCH_X + PITCH_W / 2, PITCH_Y + PITCH_H / 2, 80, 0, Math.PI * 2)
  ctx.stroke()
  // 패널티 박스 (위)
  const PB_W = 360
  const PB_H = 130
  ctx.strokeRect(PITCH_X + (PITCH_W - PB_W) / 2, PITCH_Y + 8, PB_W, PB_H)
  // 패널티 박스 (아래)
  ctx.strokeRect(PITCH_X + (PITCH_W - PB_W) / 2, PITCH_Y + PITCH_H - PB_H - 8, PB_W, PB_H)

  // 선수 배치 — slot 좌표 기반 (slots 의 x/y 는 %)
  // posMap 구조: { slotId: playerId } — SquadEditor / FormationPitch 와 일치
  const placeMap = new Map(Object.entries(posMap)) // slotId → playerId
  // 매핑 안 된 선수는 빈 슬롯에 순서대로 채움
  const placedPids = new Set(placeMap.values())
  const unmappedPlayers = lineup.filter((pid) => !placedPids.has(pid))
  let cursor = 0
  for (const slot of slots) {
    if (placeMap.has(slot.id)) continue
    if (cursor < unmappedPlayers.length) {
      placeMap.set(slot.id, unmappedPlayers[cursor++])
    }
  }

  // 선수 점 + 이름 그리기
  for (const slot of slots) {
    const pid = placeMap.get(slot.id)
    const player = pid ? playerMap.get(pid) : null
    const cx = PITCH_X + (slot.x / 100) * PITCH_W
    const cy = PITCH_Y + (slot.y / 100) * PITCH_H

    // 점 (역할별 색상)
    const fill = ROLE_COLOR[slot.role] || WHITE
    ctx.fillStyle = fill
    ctx.strokeStyle = NAVY
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 등번호 (중앙) — GK 만 navy 텍스트, 나머지는 흰색
    const textColor = slot.role === 'GK' ? NAVY : WHITE
    if (player?.number != null) {
      ctx.fillStyle = textColor
      ctx.font = 'bold 24px "Pretendard", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(player.number), cx, cy)
    } else {
      // 등번호 없으면 슬롯 코드 표시 (GK/DF/MF/FW)
      ctx.fillStyle = textColor
      ctx.font = 'bold 14px "Pretendard", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(slot.role, cx, cy)
    }

    // 이름 라벨 (점 아래)
    if (player?.name) {
      const label = player.name
      ctx.font = 'bold 22px "Pretendard", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const labelW = ctx.measureText(label).width + 16
      const labelH = 28
      const labelY = cy + 36
      // 라벨 배경
      ctx.fillStyle = 'rgba(10,37,64,0.85)'
      ctx.beginPath()
      ctx.roundRect(cx - labelW / 2, labelY, labelW, labelH, 6)
      ctx.fill()
      // 라벨 텍스트
      ctx.fillStyle = WHITE
      ctx.fillText(label, cx, labelY + 4)
    }
  }

  // ── 푸터 (하단 ~250px) ──
  const FOOTER_Y = PITCH_TOP + PITCH_H + 30

  // 출전 명단 리스트 (선수명 + 등번호)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = WHITE
  ctx.font = '500 22px "Pretendard", sans-serif'

  // 명단 컬럼 — 최대 4명 × 3행
  const ROSTER_X = 60
  const ROSTER_W = W - 120
  const COLS = 3
  const ROWS = Math.ceil(Math.min(lineup.length, 12) / COLS)
  const COL_W = ROSTER_W / COLS
  const ROW_H = 36

  for (let i = 0; i < Math.min(lineup.length, 12); i++) {
    const p = playerMap.get(lineup[i])
    if (!p) continue
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = ROSTER_X + col * COL_W
    const y = FOOTER_Y + row * ROW_H
    const text = p.number != null ? `#${p.number}  ${p.name}` : `· ${p.name}`
    ctx.fillStyle = WHITE
    ctx.fillText(text, x, y)
  }

  // 작성자 + 날짜 (최하단)
  const author = squad.createdByName || squad.authorName || '익명'
  const dateStr = fmtDate(squad.updatedAt || squad.createdAt)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '400 20px "Pretendard", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`작성: ${author}`, ROSTER_X, H - 70)
  if (dateStr) {
    ctx.textAlign = 'right'
    ctx.fillText(dateStr, W - 60, H - 70)
  }

  // 워터마크 (우측 하단 도깨비FC)
  ctx.fillStyle = GOLD
  ctx.font = 'bold 24px "Pretendard", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('⚽ 도깨비FC', W - 60, H - 40)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
