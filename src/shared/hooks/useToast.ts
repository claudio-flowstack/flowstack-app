import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}

const DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, variant = 'success', duration?) => {
    const id = crypto.randomUUID()
    const finalDuration = duration ?? DURATIONS[variant]

    set((state) => ({
      toasts: [...state.toasts, { id, message, variant, duration: finalDuration }],
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, finalDuration)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

// Convenience functions
export function toast(message: string, variant: ToastVariant = 'success') {
  useToastStore.getState().addToast(message, variant)
}

export function toastSuccess(message: string) { toast(message, 'success') }
export function toastError(message: string) { toast(message, 'error') }
export function toastWarning(message: string) { toast(message, 'warning') }
export function toastInfo(message: string) { toast(message, 'info') }
