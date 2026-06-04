// GPS 트랙 파서 — .gpx / .tcx / .fit
// 출력: { points: [{ t: ms, lat, lng, ele?, hr?, speed? }], meta: { start, end, source } }
//
// 형식 안내:
// - .gpx: 표준 XML (Apple 건강 / Strava export / RunGap / HealthFit)
// - .tcx: XML (Garmin Connect / Samsung Health)
// - .fit: Garmin/Samsung 바이너리 — fit-file-parser 사용

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

async function parseFit(arrayBuffer) {
  // 동적 import — fit 파일을 안 쓸 때 청크 안 받게
  const { default: FitParser } = await import('fit-file-parser')
  const parser = new FitParser({
    force: true,
    speedUnit: 'm/s',
    lengthUnit: 'm',
    elapsedRecordField: false,
    mode: 'list'
  })
  const data = await parser.parseAsync(arrayBuffer)
  const records = data?.records || []
  if (records.length === 0) throw new Error('fit 파일에 record 가 없어요')
  return records
    .filter((r) => Number.isFinite(r.position_lat) && Number.isFinite(r.position_long))
    .map((r) => ({
      t: Date.parse(r.timestamp),
      lat: r.position_lat,
      lng: r.position_long,
      ele: Number.isFinite(r.altitude) ? r.altitude : (Number.isFinite(r.enhanced_altitude) ? r.enhanced_altitude : null),
      hr: Number.isFinite(r.heart_rate) ? r.heart_rate : null,
      speed: Number.isFinite(r.enhanced_speed) ? r.enhanced_speed : (Number.isFinite(r.speed) ? r.speed : null)
    }))
}

function finalize(points, source) {
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

/**
 * 통합 진입점.
 * @param {File} file — input[type=file] 가 준 File 객체
 */
export async function parseGpsFile(file) {
  const lower = (file.name || '').toLowerCase()
  if (lower.endsWith('.fit')) {
    const buf = await file.arrayBuffer()
    return finalize(await parseFit(buf), 'fit')
  }
  // XML 계열 (.gpx / .tcx)
  const text = await file.text()
  const doc = parseXml(text)
  let points, source
  if (lower.endsWith('.tcx')) { points = parseTcx(doc); source = 'tcx' }
  else if (lower.endsWith('.gpx')) { points = parseGpx(doc); source = 'gpx' }
  else {
    const root = doc.documentElement?.tagName?.toLowerCase() || ''
    if (root.includes('trainingcenterdatabase')) { points = parseTcx(doc); source = 'tcx' }
    else if (root === 'gpx') { points = parseGpx(doc); source = 'gpx' }
    else throw new Error('지원하지 않는 형식 — .gpx / .tcx / .fit 만 가능합니다')
  }
  return finalize(points, source)
}
