import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

// ============================================================
// Toast 类型定义
// ============================================================
export interface ToastItem {
  id: string
  type: 'success' | 'warning' | 'error'
  title: string
  description?: string
  createdAt: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (item: Omit<ToastItem, 'id' | 'createdAt'>) => void
  removeToast: (id: string) => void
}

// ============================================================
// Context
// ============================================================
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timerRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (item: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const toast: ToastItem = { ...item, id, createdAt: Date.now() }

      setToasts((prev) => [...prev, toast])

      // 3000ms 后自动移除
      const timer = setTimeout(() => {
        removeToast(id)
      }, 3000)
      timerRef.current.set(id, timer)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
