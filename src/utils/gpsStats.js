// GPS 트랙 → 축구 경기 분석 통계
// 입력: parseGpsFile() 결과의 points 배열 [{ t(ms), lat, lng, ele?, hr?, speed?(m/s) }]
// 출력: { distanceKm, hiDistanceKm, sprintDistanceKm, maxSpeedKmh, sprintCount,
//        accelCount, hullAreaM2, centroidLat, centroidLng, avgPaceMinPerKm,
//        zones: { stand, jog, run, sprint }(초), bounds: {minLat, maxLat, minLng, maxLng} }
//
// 임계값 (축구 표준 — Catapult/STATSports 등 기준):
//   - 정지     : < 0.4 m/s   (1.4 km/h)
//   - 조깅     : 0.4 ~ 4.2 m/s (15 km/h)
//   - 러닝     : 4.2 ~ 5.3 m/s (19 km/h)
//   - 스프린트 : ≥ 5.3 m/s
//   - 강한 가속 : Δv/Δt ≥ 3 m/s²

const R_EARTH = 6371000 // m

function toRad(d) { return (d * Math.PI) / 180 }
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const φ1 = toRad(lat1), φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lng2 - lng1)
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R_EARTH * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 3-샘플 이동평균 (속도 노이즈 smoothing)
function smooth(arr, win = 3) {
  if (arr.length <= win) return arr.slice()
  const half = Math.floor(win / 2)
  const out = new Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, n = 0
    for (let k = -half; k <= half; k++) {
      const j = i + k
      if (j >= 0 && j < arr.length) { sum += arr[j]; n++ }
    }
    out[i] = sum / n
  }
  return out
}

// 위경도 → 평면 m 좌표 (centroid 기준 등각 투영, hull/면적 계산용)
function projectXY(points, refLat, refLng) {
  const cosLat = Math.cos(toRad(refLat))
  return points.map((p) => ({
    x: toRad(p.lng - refLng) * R_EARTH * cosLat,
    y: toRad(p.lat - refLat) * R_EARTH
  }))
}

// Andrew's monotone chain convex hull
function convexHull(pts) {
  if (pts.length < 3) return pts.slice()
  const sorted = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return lower.concat(upper.slice(1, -1))
}

function polygonArea(hull) {
  let a = 0
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i], q = hull[(i + 1) % hull.length]
    a += p.x * q.y - q.x * p.y
  }
  return Math.abs(a) / 2
}

export function computeGpsStats(points) {
  if (!points || points.length < 2) {
    return null
  }
  // 1) 구간별 거리 + 속도 (raw)
  const segDist = new Array(points.length).fill(0)   // m, [i] = i-1→i 구간 거리
  const segSpeed = new Array(points.length).fill(0)  // m/s
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000
    if (dt <= 0) { segDist[i] = 0; segSpeed[i] = 0; continue }
    const d = haversineMeters(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng)
    segDist[i] = d
    segSpeed[i] = d / dt
  }
  const speedSm = smooth(segSpeed, 3)

  // 2) 누적 거리 + 존별 거리 + 존별 시간
  let totalM = 0, hiM = 0, sprintM = 0
  let standSec = 0, jogSec = 0, runSec = 0, sprintSec = 0
  let maxSpeed = 0
  for (let i = 1; i < points.length; i++) {
    const v = speedSm[i]
    const dt = (points[i].t - points[i - 1].t) / 1000
    if (dt <= 0) continue
    totalM += segDist[i]
    if (v > maxSpeed) maxSpeed = v
    if (v >= 4.2) hiM += segDist[i]
    if (v >= 5.3) sprintM += segDist[i]
    if (v < 0.4) standSec += dt
    else if (v < 4.2) jogSec += dt
    else if (v < 5.3) runSec += dt
    else sprintSec += dt
  }

  // 3) 스프린트 횟수 — 5.3 m/s 이상이 1.5 초 이상 지속된 구간 수
  let sprintCount = 0, inSprint = false, sprintHold = 0
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000
    if (dt <= 0) continue
    const isFast = speedSm[i] >= 5.3
    if (isFast) {
      sprintHold += dt
      if (!inSprint && sprintHold >= 1.5) { sprintCount++; inSprint = true }
    } else {
      inSprint = false; sprintHold = 0
    }
  }

  // 4) 강한 가속 횟수 (≥3 m/s², 0.5초 이상 지속)
  let accelCount = 0, accelHold = 0, inAccel = false
  for (let i = 2; i < points.length; i++) {
    const dt = (points[i].t - points[i - 1].t) / 1000
    if (dt <= 0) continue
    const dv = speedSm[i] - speedSm[i - 1]
    const a = dv / dt
    const strong = a >= 3
    if (strong) {
      accelHold += dt
      if (!inAccel && accelHold >= 0.5) { accelCount++; inAccel = true }
    } else {
      inAccel = false; accelHold = 0
    }
  }

  // 5) 활동 면적 — convex hull (centroid 기준 평면 투영)
  let cLat = 0, cLng = 0
  for (const p of points) { cLat += p.lat; cLng += p.lng }
  cLat /= points.length; cLng /= points.length
  const xy = projectXY(points, cLat, cLng)
  const hull = convexHull(xy)
  const hullArea = polygonArea(hull)

  // 6) bounds (지도 그릴 때 사용)
  let minLat = points[0].lat, maxLat = points[0].lat
  let minLng = points[0].lng, maxLng = points[0].lng
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }

  const durationSec = (points[points.length - 1].t - points[0].t) / 1000
  const distanceKm = totalM / 1000
  const avgPaceMinPerKm = distanceKm > 0 ? (durationSec / 60) / distanceKm : null

  return {
    distanceKm,
    hiDistanceKm: hiM / 1000,
    sprintDistanceKm: sprintM / 1000,
    maxSpeedKmh: maxSpeed * 3.6,
    sprintCount,
    accelCount,
    hullAreaM2: hullArea,
    centroidLat: cLat,
    centroidLng: cLng,
    avgPaceMinPerKm,
    durationSec,
    zones: { stand: standSec, jog: jogSec, run: runSec, sprint: sprintSec },
    bounds: { minLat, maxLat, minLng, maxLng }
  }
}
