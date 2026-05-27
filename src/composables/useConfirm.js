import { reactive, readonly } from 'vue'

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  variant: 'danger',
  _resolve: null
})

// confirm({ title, message, confirmText, variant }) → Promise<boolean>
export function confirm(options = {}) {
  state.title = options.title || '확인'
  state.message = options.message || ''
  state.confirmText = options.confirmText || '확인'
  state.cancelText = options.cancelText || '취소'
  state.variant = options.variant || 'danger'
  state.open = true
  return new Promise((resolve) => {
    state._resolve = resolve
  })
}

function settle(result) {
  state.open = false
  if (state._resolve) {
    state._resolve(result)
    state._resolve = null
  }
}

export function useConfirm() {
  return {
    state: readonly(state),
    confirm,
    accept: () => settle(true),
    cancel: () => settle(false)
  }
}
