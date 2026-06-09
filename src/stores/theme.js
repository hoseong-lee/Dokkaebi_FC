import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'dokkaebi-theme'
// 가능한 값: 'light' / 'dark' / 'system'

export const useThemeStore = defineStore('theme', () => {
  const setting = ref(loadInitial())
  const systemDark = ref(detectSystemDark())

  const isDark = computed(() =>
    setting.value === 'dark' ||
    (setting.value === 'system' && systemDark.value)
  )

  function loadInitial() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch {}
    return 'system'
  }

  function detectSystemDark() {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function setTheme(value) {
    setting.value = value
    try { localStorage.setItem(STORAGE_KEY, value) } catch {}
    apply()
  }

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDark.value) root.classList.add('dark')
    else root.classList.remove('dark')
  }

  // system 모드일 때 OS 변경 감지
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      systemDark.value = e.matches
      apply()
    })
  }

  // 초기 적용
  apply()
  watch(isDark, apply)

  return { setting, isDark, setTheme }
})
