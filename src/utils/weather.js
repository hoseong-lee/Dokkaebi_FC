// OpenWeather API — One Call API 3.0 (무료, 위경도 → 5일 일별 예보)
// 발급: https://openweathermap.org/api/one-call-3 → 회원가입 → API keys
// 무료 한도: 1,000 호출/일 (도깨비FC 규모면 충분)
// 환경변수: VITE_OPENWEATHER_API_KEY (.env.local + GitHub Secret)

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
const CACHE_MS = 30 * 60 * 1000  // 30분 캐시 (호출 절약)

const memCache = new Map()  // key: `${lat},${lng}` → { data, savedAt }

export function isWeatherEnabled() {
  return !!API_KEY
}

// 5일 일별 예보 fetch (캐시 적용)
export async function fetchDailyForecast(lat, lng) {
  if (!API_KEY) throw new Error('OpenWeather API 키가 설정되지 않았습니다.')
  if (lat == null || lng == null) throw new Error('좌표가 없습니다.')

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = memCache.get(key)
  if (cached && Date.now() - cached.savedAt < CACHE_MS) {
    return cached.data
  }

  // 5 day / 3 hour forecast — 무료 플랜 호환 (One Call 3.0 은 유료, forecast 는 무료)
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=kr`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`기상 API 오류: ${res.status}`)
  }
  const json = await res.json()

  // 3시간 단위 → 일별 그룹핑
  const byDate = {}
  for (const entry of json.list || []) {
    const date = entry.dt_txt.split(' ')[0]  // YYYY-MM-DD
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(entry)
  }
  const daily = Object.entries(byDate).slice(0, 5).map(([date, entries]) => {
    // 정오 또는 가운데 항목 대표값
    const midIdx = Math.floor(entries.length / 2)
    const rep = entries[midIdx] || entries[0]
    const tmin = Math.min(...entries.map((e) => e.main.temp_min))
    const tmax = Math.max(...entries.map((e) => e.main.temp_max))
    // 강수확률 — 최대값
    const pop = Math.max(...entries.map((e) => e.pop || 0))
    return {
      date,                                  // YYYY-MM-DD
      tempMin: Math.round(tmin),
      tempMax: Math.round(tmax),
      icon: rep.weather?.[0]?.icon || '01d', // OpenWeather icon code
      desc: rep.weather?.[0]?.description || '',
      pop: Math.round(pop * 100),            // 강수확률 %
      windSpeed: rep.wind?.speed || 0
    }
  })

  const data = { daily, fetchedAt: Date.now(), location: json.city?.name || '' }
  memCache.set(key, { data, savedAt: Date.now() })
  return data
}

// 특정 날짜의 예보만 추출 (경기 일정에 매칭)
export function forecastForDate(daily, targetDate) {
  if (!daily) return null
  // targetDate 는 timestamp (ms) — YYYY-MM-DD 로 변환
  const d = new Date(targetDate)
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return daily.find((f) => f.date === ymd) || null
}

export function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`
}

// 강수확률 > 70% 면 우천 위험 안내
export function isRainRisk(forecast) {
  return forecast && forecast.pop >= 70
}
