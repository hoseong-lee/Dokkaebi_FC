import { reactive, readonly } from 'vue'

const state = reactive({ items: [] })
let seq = 0

export function pushToast(message, type = 'info', timeout = 3000) {
  const id = ++seq
  state.items.push({ id, message, type })
  setTimeout(() => removeToast(id), timeout)
}

export function removeToast(id) {
  const i = state.items.findIndex((t) => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

export function useToast() {
  return {
    state: readonly(state),
    removeToast,
    toast: (m, t) => pushToast(m, t),
    success: (m) => pushToast(m, 'success'),
    error: (m) => pushToast(m, 'error'),
    info: (m) => pushToast(m, 'info')
  }
}
