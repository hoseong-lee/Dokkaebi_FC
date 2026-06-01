// 시즌 결산 카드 8장 — Canvas 1080×1080 인스타 정사각
import { seasonStatsOf, attackPoints } from './stats'
import { teamSummary } from './teamStats'
import { bestDuos } from './duos'

const SIZE = 1080
const NAVY = '#0a2540'
const GOLD = '#d4a73a'
const WHITE = '#ffffff'
const PINK = '#ec4899'

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function createCanvas() {
  const c = document.createElement('canvas')
  c.width = SIZE; c.height = SIZE
  return c
}

function drawBackground(ctx, gradient = ['from', 'to']) {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE)
  g.addColorStop(0, gradient[0])
  g.addColorStop(1, gradient[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}

function drawHeader(ctx, emblem, seasonName) {
  if (emblem) ctx.drawImage(emblem, 60, 60, 120, 120)
  ctx.fillStyle = GOLD
  ctx.font = '500 28px "Pretendard", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${seasonName} 시즌 결산`, 200, 95)
  ctx.fillStyle = WHITE
  ctx.font = 'bold 44px "Pretendard", sans-serif'
  ctx.fillText('⚽ 도깨비FC', 200, 145)
  ctx.strokeStyle = 'rgba(212,167,58,0.4)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, 220); ctx.lineTo(SIZE - 60, 220); ctx.stroke()
}

function drawTitle(ctx, emoji, title, sub) {
  ctx.fillStyle = WHITE
  ctx.font = 'bold 80px "Pretendard", sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(emoji, 60, 250)
  ctx.font = 'bold 64px "Pretendard", sans-serif'
  ctx.fillText(title, 200, 270)
  if (sub) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 24px "Pretendard", sans-serif'
    ctx.fillText(sub, 200, 355)
  }
}

function drawFooter(ctx, seasonName) {
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '400 22px "Pretendard", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${seasonName} 시즌 결산 · 도깨비FC`, SIZE / 2, SIZE - 60)
  ctx.textAlign = 'left'
}

function ranked(players, key, seasonId, max = 5) {
  return players
    .map((p) => {
      const s = seasonId ? seasonStatsOf(p, seasonId) : p.stats || {}
      const value = key === 'points' ? attackPoints(s) : s[key] || 0
      return { player: p, value }
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, max)
}

function drawRankingList(ctx, list, valueLabel = '') {
  let y = 440
  list.forEach((r, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] || ` ${i + 1}.`
    ctx.fillStyle = i === 0 ? GOLD : i < 3 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'
    ctx.font = i < 3 ? 'bold 48px "Pretendard", sans-serif' : 'bold 36px "Pretendard", sans-serif'
    ctx.fillText(medal, 80, y)
    ctx.fillText(r.player.name, 200, y)
    ctx.textAlign = 'right'
    ctx.fillText(`${r.value} ${valueLabel}`, SIZE - 80, y)
    ctx.textAlign = 'left'
    y += i < 3 ? 80 : 60
  })
}

// ── 1. 표지 ──
async function buildCover(ctx, emblem, seasonName, scope) {
  drawBackground(ctx, [NAVY, '#061629'])
  if (emblem) {
    const s = 360
    ctx.drawImage(emblem, (SIZE - s) / 2, 280, s, s)
  }
  ctx.fillStyle = GOLD
  ctx.font = 'bold 36px "Pretendard", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SEASON REVIEW', SIZE / 2, 200)
  ctx.fillStyle = WHITE
  ctx.font = 'bold 100px "Pretendard", sans-serif'
  ctx.fillText(seasonName, SIZE / 2, 700)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '500 32px "Pretendard", sans-serif'
  ctx.fillText(`경기 ${scope.played}경기 · ${scope.wins}승 ${scope.draws}무 ${scope.losses}패`, SIZE / 2, 800)
  ctx.fillText(`득 ${scope.gf} : ${scope.ga} 실 (GD ${scope.gd >= 0 ? '+' : ''}${scope.gd})`, SIZE / 2, 860)
  ctx.fillStyle = GOLD
  ctx.font = 'bold 28px "Pretendard", sans-serif'
  ctx.fillText('⚽ 도깨비FC', SIZE / 2, 950)
  ctx.textAlign = 'left'
}

// 표준 통계 카드 빌더
function buildStatCard(ctx, emblem, seasonName, emoji, title, sub, list, valueLabel) {
  drawBackground(ctx, [NAVY, '#061629'])
  drawHeader(ctx, emblem, seasonName)
  drawTitle(ctx, emoji, title, sub)
  drawRankingList(ctx, list, valueLabel)
  drawFooter(ctx, seasonName)
}

// ── 메인 ──
// players · matches · seasonId · seasonName · emblemUrl 입력 → 8장 PNG Blob 배열 반환
export async function generateSeasonReviewCards({ players, matches, seasonId, seasonName, emblemUrl }) {
  const emblem = emblemUrl ? await loadImage(emblemUrl) : null
  const scopedMatches = seasonId ? matches.filter((m) => m.seasonId === seasonId) : matches
  const summary = teamSummary(scopedMatches)
  const summaryWithGd = { ...summary, gd: (summary.gf || 0) - (summary.ga || 0) }

  const topGoals = ranked(players, 'goals', seasonId, 5)
  const topAssists = ranked(players, 'assists', seasonId, 5)
  const topPoints = ranked(players, 'points', seasonId, 5)
  const topMom = ranked(players, 'momCount', seasonId, 5)
  const topApps = ranked(players, 'appearances', seasonId, 5)
  const topManner = ranked(players, 'complimentCount', seasonId, 5)
  const duoList = bestDuos(scopedMatches, seasonId).slice(0, 5)

  const cards = []

  // 1. 표지
  const c1 = createCanvas()
  await buildCover(c1.getContext('2d'), emblem, seasonName, summaryWithGd)
  cards.push({ key: 'cover', label: '표지', canvas: c1 })

  // 2. 시즌 요약
  const c2 = createCanvas()
  const ctx2 = c2.getContext('2d')
  drawBackground(ctx2, [NAVY, '#061629'])
  drawHeader(ctx2, emblem, seasonName)
  drawTitle(ctx2, '📊', '시즌 성적', `${summary.played}경기 · ${Math.round((summary.wins / Math.max(1, summary.played)) * 100)}% 승률`)
  ctx2.fillStyle = WHITE
  ctx2.font = 'bold 130px "Pretendard", sans-serif'
  ctx2.textAlign = 'center'
  ctx2.fillText(`${summary.wins} - ${summary.draws} - ${summary.losses}`, SIZE / 2, 520)
  ctx2.fillStyle = 'rgba(255,255,255,0.6)'
  ctx2.font = '500 32px "Pretendard", sans-serif'
  ctx2.fillText('승 - 무 - 패', SIZE / 2, 700)
  ctx2.fillStyle = GOLD
  ctx2.font = 'bold 60px "Pretendard", sans-serif'
  ctx2.fillText(`${summary.gf} : ${summary.ga}`, SIZE / 2, 800)
  ctx2.fillStyle = 'rgba(255,255,255,0.5)'
  ctx2.font = '500 26px "Pretendard", sans-serif'
  ctx2.fillText(`총 득점 : 총 실점  ·  GD ${summaryWithGd.gd >= 0 ? '+' : ''}${summaryWithGd.gd}`, SIZE / 2, 855)
  ctx2.textAlign = 'left'
  drawFooter(ctx2, seasonName)
  cards.push({ key: 'summary', label: '시즌 요약', canvas: c2 })

  // 3. 득점왕
  if (topGoals.length) {
    const c = createCanvas()
    buildStatCard(c.getContext('2d'), emblem, seasonName, '⚽', '득점왕', `시즌 ${topGoals.length}명 등극`, topGoals, '골')
    cards.push({ key: 'goals', label: '득점왕', canvas: c })
  }

  // 4. 도움왕
  if (topAssists.length) {
    const c = createCanvas()
    buildStatCard(c.getContext('2d'), emblem, seasonName, '🅰️', '도움왕', '플레이메이커', topAssists, '도움')
    cards.push({ key: 'assists', label: '도움왕', canvas: c })
  }

  // 5. MVP (MOM)
  if (topMom.length) {
    const c = createCanvas()
    buildStatCard(c.getContext('2d'), emblem, seasonName, '👑', '시즌 MVP', 'MOM 누적 순위', topMom, '회')
    cards.push({ key: 'mvp', label: 'MVP', canvas: c })
  }

  // 6. 출석왕
  if (topApps.length) {
    const c = createCanvas()
    buildStatCard(c.getContext('2d'), emblem, seasonName, '🏃', '출석왕', '시즌 개근의 영웅', topApps, '경기')
    cards.push({ key: 'apps', label: '출석왕', canvas: c })
  }

  // 7. 매너왕
  if (topManner.length) {
    const c = createCanvas()
    buildStatCard(c.getContext('2d'), emblem, seasonName, '💝', '매너왕', '받은 칭찬 누적', topManner, '점')
    cards.push({ key: 'manner', label: '매너왕', canvas: c })
  }

  // 8. 베스트 듀오
  if (duoList.length) {
    const c = createCanvas()
    const ctx = c.getContext('2d')
    drawBackground(ctx, [NAVY, '#061629'])
    drawHeader(ctx, emblem, seasonName)
    drawTitle(ctx, '💑', '베스트 듀오', '함께 뛰면 좋은 콤비')
    let y = 460
    duoList.forEach((d, i) => {
      const a = players.find((p) => p.id === d.a)
      const b = players.find((p) => p.id === d.b)
      if (!a || !b) return
      const medal = ['🥇', '🥈', '🥉'][i] || ` ${i + 1}.`
      ctx.fillStyle = i === 0 ? GOLD : 'rgba(255,255,255,0.85)'
      ctx.font = i < 3 ? 'bold 42px "Pretendard", sans-serif' : 'bold 32px "Pretendard", sans-serif'
      ctx.fillText(medal, 80, y)
      ctx.fillText(`${a.name} × ${b.name}`, 200, y)
      ctx.textAlign = 'right'
      ctx.fillText(`${d.count}회 합류`, SIZE - 80, y)
      ctx.textAlign = 'left'
      y += i < 3 ? 80 : 60
    })
    drawFooter(ctx, seasonName)
    cards.push({ key: 'duo', label: '베스트 듀오', canvas: c })
  }

  return cards
}

export function canvasToBlob(canvas) {
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
