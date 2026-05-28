import { dayjs } from './date'
import { matchResult, RESULT_LABEL } from './match'

function scorersByPlayer(match) {
  const map = {}
  for (const e of match.events || []) {
    if (e.type !== 'goal') continue
    map[e.playerId] = (map[e.playerId] || 0) + 1
  }
  return Object.entries(map)
    .map(([id, n]) => ({ id, count: n }))
    .sort((a, b) => b.count - a.count)
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function nameWithNumber(p) {
  return p.number != null ? `${p.name} #${p.number}` : p.name
}

// 1080×1080 인스타그램 정사각 결과 카드 → Blob(PNG)
export async function generateResultCard(match, players) {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')

  const playerMap = new Map(players.map((p) => [p.id, p]))
  const dok = match.score?.dokkaebi ?? 0
  const opp = match.score?.opponent ?? 0
  const result = matchResult(match)
  const resultColor = result === 'W' ? '#22c55e' : result === 'L' ? '#dc2626' : '#9ca3af'

  // 배경: 다크 그라데이션 + 골드 액센트
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0, '#0F0F10')
  bg.addColorStop(1, '#23231F')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 좌측 골드 사이드 바
  ctx.fillStyle = '#C9A33A'
  ctx.fillRect(0, 0, 14, SIZE)

  // 엠블럼 (좌상단)
  const emblem = await loadImage(import.meta.env.BASE_URL + 'dokkaebi-emblem-192.png')
  if (emblem) ctx.drawImage(emblem, 80, 70, 96, 96)

  // 상단 브랜드
  ctx.font = '700 36px "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif'
  ctx.fillStyle = '#C9A33A'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('DOKKEBY FC', 196, 86)

  ctx.font = '500 26px "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText('MATCH RESULT', 196, 132)

  // 날짜 (우상단)
  ctx.font = '500 28px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.textAlign = 'right'
  ctx.fillText(dayjs(match.date).format('YYYY.MM.DD (ddd)'), SIZE - 80, 96)

  // 결과 배지 (W/D/L)
  if (result) {
    const badgeText = RESULT_LABEL[result] || ''
    ctx.font = '700 28px system-ui, sans-serif'
    const badgeW = 84
    const badgeH = 40
    const badgeX = SIZE - 80 - badgeW
    const badgeY = 138
    ctx.fillStyle = resultColor
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1)
  }

  // 팀명 vs 상대
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 48px "Pretendard", system-ui, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'right'
  ctx.fillText('도깨비FC', 460, 320)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.textAlign = 'center'
  ctx.font = '700 32px system-ui, sans-serif'
  ctx.fillText('VS', SIZE / 2, 316)

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.font = '700 48px "Pretendard", system-ui, sans-serif'
  ctx.fillText(match.opponent || '상대팀', 620, 320)

  // 스코어 (큰 숫자)
  ctx.font = '800 200px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  const scoreText = `${dok}  :  ${opp}`
  ctx.fillText(scoreText, SIZE / 2, 530)

  // 골드 라인
  ctx.fillStyle = '#C9A33A'
  ctx.fillRect(80, 580, SIZE - 160, 3)

  // 득점자
  const scorers = scorersByPlayer(match)
  ctx.font = '600 28px "Pretendard", system-ui, sans-serif'
  ctx.fillStyle = '#C9A33A'
  ctx.textAlign = 'left'
  ctx.fillText('⚽ SCORERS', 80, 640)

  ctx.font = '500 30px "Pretendard", system-ui, sans-serif'
  ctx.fillStyle = '#fff'
  let y = 690
  if (scorers.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('기록된 득점자가 없습니다', 80, y)
  } else {
    for (const s of scorers.slice(0, 8)) {
      const p = playerMap.get(s.id)
      if (!p) continue
      const label = `${nameWithNumber(p)}${s.count > 1 ? `  ×${s.count}` : ''}`
      ctx.fillText('• ' + label, 80, y)
      y += 42
      if (y > 880) break
    }
  }

  // MVP
  if (match.momPlayerId) {
    const mvp = playerMap.get(match.momPlayerId)
    if (mvp) {
      ctx.fillStyle = 'rgba(201, 163, 58, 0.18)'
      ctx.beginPath()
      ctx.roundRect(80, 920, SIZE - 160, 90, 16)
      ctx.fill()
      ctx.font = '600 26px "Pretendard", system-ui, sans-serif'
      ctx.fillStyle = '#C9A33A'
      ctx.fillText('⭐ MAN OF THE MATCH', 110, 950)
      ctx.font = '700 36px "Pretendard", system-ui, sans-serif'
      ctx.fillStyle = '#fff'
      ctx.fillText(nameWithNumber(mvp), 110, 992)
    }
  }

  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Web Share API (모바일 카톡 공유 시트)
export async function shareBlob(blob, { title, text, filename = 'result-card.png' }) {
  if (!navigator.share || !navigator.canShare) return false
  const file = new File([blob], filename, { type: 'image/png' })
  if (!navigator.canShare({ files: [file] })) return false
  await navigator.share({ title, text, files: [file] })
  return true
}
