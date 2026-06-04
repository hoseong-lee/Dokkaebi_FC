// GPS 트랙 파서 — .gpx / .tcx (둘 다 XML)
// 출력: { points: [{ t: ms, lat, lng, ele?, hr?, speed? }], meta: { start, end, source } }
//
// 형식 안내:
// - .gpx: 표준 (Apple 건강, Strava export, RunGap, HealthFit)
// - .tcx: Garmin/Samsung Health 표준 (갤럭시워치 사용자 권장)
// - .fit:  지원 안 함 — gpx.studio 등에서 .gpx 로 변환 후 업로드

function parseXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) throw new Error('XML 파싱 실패 — 손상된 파일일 수 있어요')
  return doc
}

function parseGpx(doc) {
  const trkpts = Array.from(doc.querySelectorAll('trkpt'))
  if (trkpts.length === 0) throw new Error('gpx 파일에 trkpt 가 없어요')
  const points = []
  for (const node of trkpts) {
    const lat = parseFloat(node.getAttribute('lat'))
    const lng = parseFloat(node.getAttribute('lon'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const timeNode = node.querySelector('time')
    const eleNode = node.querySelector('ele')
    const hrNode = node.querySelector('hr') || node.querySelector('*|hr')
    const t = timeNode ? Date.parse(timeNode.textContent.trim()) : null
    const ele = eleNode ? parseFloat(eleNode.textContent) : null
    const hr = hrNode ? parseFloat(hrNode.textContent) : null
    points.push({ t, lat, lng, ele, hr })
  }
  return points
}

function parseTcx(doc) {
  const tps = Array.from(doc.querySelectorAll('Trackpoint'))
  if (tps.length === 0) throw new Error('tcx 파일에 Trackpoint 가 없어요')
  const points = []
  for (const node of tps) {
    const lat = parseFloat(node.querySelector('LatitudeDegrees')?.textContent)
    const lng = parseFloat(node.querySelector('LongitudeDegrees')?.textContent)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue // GPS lock 못한 샘플 skip
    const t = Date.parse(node.querySelector('Time')?.textContent || '')
    const ele = parseFloat(node.querySelector('AltitudeMeters')?.textContent)
    const hr = parseFloat(node.querySelector('HeartRateBpm Value')?.textContent)
    const speed = parseFloat(node.querySelector('Speed')?.textContent) // m/s (있을 수도)
    points.push({
      t: Number.isFinite(t) ? t : null,
      lat, lng,
      ele: Number.isFinite(ele) ? ele : null,
      hr: Number.isFinite(hr) ? hr : null,
      speed: Number.isFinite(speed) ? speed : null
    })
  }
  return points
}

/**
 * @param {string} filename — 확장자 인식용
 * @param {string} text     — 파일 내용 (UTF-8 텍스트)
 */
export function parseGpsFile(filename, text) {
  const lower = (filename || '').toLowerCase()
  const doc = parseXml(text)
  let points, source
  if (lower.endsWith('.tcx')) {
    points = parseTcx(doc); source = 'tcx'
  } else if (lower.endsWith('.gpx')) {
    points = parseGpx(doc); source = 'gpx'
  } else {
    // 확장자 없으면 root element 로 자동 인식
    const root = doc.documentElement?.tagName?.toLowerCase() || ''
    if (root.includes('trainingcenterdatabase')) { points = parseTcx(doc); source = 'tcx' }
    else if (root === 'gpx') { points = parseGpx(doc); source = 'gpx' }
    else throw new Error('지원하지 않는 형식 — .gpx 또는 .tcx 만 가능합니다')
  }
  // 시간 정렬 + null t 제거
  const valid = points.filter((p) => Number.isFinite(p.t)).sort((a, b) => a.t - b.t)
  if (valid.length < 2) throw new Error('유효한 좌표 샘플이 부족해요 (최소 2개 필요)')
  return {
    points: valid,
    meta: {
      source,
      start: valid[0].t,
      end: valid[valid.length - 1].t,
      sampleCount: valid.length,
      durationSec: Math.round((valid[valid.length - 1].t - valid[0].t) / 1000)
    }
  }
}
