import { ref, computed } from 'vue'

// 카드 3D 틸트 + 포인터 추적 빛 효과 (FUT 카드 / MOM 카드 공용)
// - 데스크탑: 마우스 호버로 틸트
// - 모바일: 카드를 누른 채 드래그 (드래그였으면 click 네비게이션 억제)
export function useCardTilt({ maxDeg = 25, scale = 1.05 } = {}) {
  const cardEl = ref(null)
  const tiltTransform = ref('')
  const pointer = ref({ x: 50, y: 50, active: false })
  const touchActive = ref(false)
  let startX = 0
  let startY = 0
  let moved = 0
  let suppressClick = false

  function applyTilt(e) {
    const el = cardEl.value
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    tiltTransform.value =
      `perspective(650px) rotateY(${(px * maxDeg).toFixed(2)}deg) rotateX(${(-py * maxDeg).toFixed(2)}deg) scale(${scale})`
    pointer.value = { x: (px + 0.5) * 100, y: (py + 0.5) * 100, active: true }
  }

  function onTiltDown(e) {
    if (e.pointerType === 'mouse') return
    touchActive.value = true
    startX = e.clientX
    startY = e.clientY
    moved = 0
    cardEl.value?.setPointerCapture?.(e.pointerId)
    applyTilt(e)
  }
  function onTiltMove(e) {
    if (e.pointerType === 'mouse') return applyTilt(e)
    if (!touchActive.value) return
    moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY))
    applyTilt(e)
  }
  function onTiltEnd() {
    if (touchActive.value && moved > 8) suppressClick = true
    touchActive.value = false
    tiltTransform.value = ''
    pointer.value = { x: 50, y: 50, active: false }
  }
  // 링크 카드에서 드래그 후 손 뗄 때 의도치 않은 네비게이션 차단용
  function consumeSuppressClick() {
    const s = suppressClick
    suppressClick = false
    return s
  }

  // 틸트 중 홀로 sweep 이 포인터 위치를 따라가도록
  const holoStyle = computed(() =>
    pointer.value.active
      ? { backgroundPosition: `${pointer.value.x}% ${pointer.value.y}%`, animation: 'none' }
      : {}
  )
  // 포인터 지점 빛 반사 스팟
  const glareStyle = computed(() => ({
    opacity: pointer.value.active ? 1 : 0,
    background: `radial-gradient(circle at ${pointer.value.x}% ${pointer.value.y}%, rgba(255,255,255,0.5), rgba(255,255,255,0.13) 35%, transparent 60%)`
  }))

  return {
    cardEl, tiltTransform, pointer, holoStyle, glareStyle,
    onTiltDown, onTiltMove, onTiltEnd, consumeSuppressClick
  }
}
