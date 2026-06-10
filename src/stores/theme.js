import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'dokkaebi-theme'
// 가능한 값: 'light' / 'dark' — 기본은 light, 사용자가 명시적으로 dark 켤 때만 적용

export const useThemeStore = defineStore('theme', () => {
  const setting = ref(loadInitial())

  const isDark = computed(() => setting.value === 'dark')

  function loadInitial() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark') return 'dark'
    } catch {}
    return 'light' // 기본 라이트
  }

  function setTheme(value) {
    setting.value = value === 'dark' ? 'dark' : 'light'
    try { localStorage.setItem(STORAGE_KEY, setting.value) } catch {}
    apply()
  }

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDark.value) root.classList.add('dark')
    else root.classList.remove('dark')
  }

  // 초기 적용
  apply()
  watch(isDark, apply)

  return { setting, isDark, setTheme }
})
