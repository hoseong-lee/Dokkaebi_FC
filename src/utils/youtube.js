// YouTube URL → videoId 추출 + 임베드 URL 생성 (start/end 시간 지원)

const ID_RE = /[A-Za-z0-9_-]{11}/

export function extractYouTubeId(url) {
  if (!url) return null
  const s = String(url).trim()
  if (s.length === 11 && ID_RE.test(s)) return s
  try {
    const u = new URL(s)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1).split('/')[0]
      return ID_RE.test(id) ? id : null
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      const v = u.searchParams.get('v')
      if (v && ID_RE.test(v)) return v
      const m = u.pathname.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[1]
    }
  } catch {
    const m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/) || s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || s.match(/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/)
    if (m) return m[1]
  }
  return null
}

// URL의 t/start 파라미터에서 시작 시간 추출 (1h2m30s / 90s / 90 모두 지원)
export function extractYouTubeStart(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const t = u.searchParams.get('t') || u.searchParams.get('start')
    return parseTimeString(t)
  } catch {
    const m = String(url).match(/[?&](?:t|start)=([^&]+)/)
    return m ? parseTimeString(m[1]) : null
  }
}

// "1:30" / "1:02:30" / "90" / "1h30m" / "1m30s" → 초
export function parseTimeString(input) {
  if (input == null || input === '') return null
  const s = String(input).trim()
  if (/^\d+$/.test(s)) return Number(s)
  // mm:ss 또는 hh:mm:ss
  const colon = s.match(/^(?:(\d+):)?(\d+):(\d+)$/)
  if (colon) {
    const h = Number(colon[1] || 0)
    const m = Number(colon[2])
    const sec = Number(colon[3])
    return h * 3600 + m * 60 + sec
  }
  // 1h30m45s 또는 부분
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/)
  if (hms && (hms[1] || hms[2] || hms[3])) {
    const h = Number(hms[1] || 0)
    const m = Number(hms[2] || 0)
    const sec = Number(hms[3] || 0)
    return h * 3600 + m * 60 + sec
  }
  return null
}

// 초 → "1:30" / "1:02:30" (UI 표시용)
export function formatTime(seconds) {
  if (seconds == null || seconds < 0) return ''
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

// 시간 범위 지원 임베드 URL
export function ytEmbedUrl(videoIdOrUrl, opts = {}) {
  const id = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl
  const params = new URLSearchParams()
  const start = opts.start ?? extractYouTubeStart(videoIdOrUrl)
  const end = opts.end
  if (start) params.set('start', String(Math.floor(start)))
  if (end) params.set('end', String(Math.floor(end)))
  // 자동 재생 옵션 (선택)
  if (opts.autoplay) params.set('autoplay', '1')
  const qs = params.toString()
  return `https://www.youtube.com/embed/${id}${qs ? '?' + qs : ''}`
}

export function ytWatchUrl(videoIdOrUrl, opts = {}) {
  const id = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl
  const start = opts.start ?? extractYouTubeStart(videoIdOrUrl)
  return `https://www.youtube.com/watch?v=${id}${start ? `&t=${Math.floor(start)}s` : ''}`
}

export function ytThumbUrl(videoIdOrUrl) {
  const id = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export function isValidYouTubeUrl(url) {
  return !!extractYouTubeId(url)
}
