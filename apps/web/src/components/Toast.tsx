import { useEffect, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let _setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null
let _counter = 0

export function toast(message: string, type: ToastType = 'info') {
  if (!_setToasts) return
  const id = ++_counter
  _setToasts(prev => [...prev, { id, type, message }])
  setTimeout(() => {
    _setToasts?.(prev => prev.filter(t => t.id !== id))
  }, 3500)
}
toast.success = (msg: string) => toast(msg, 'success')
toast.error = (msg: string) => toast(msg, 'error')

const ICONS: Record<ToastType, string> = {
  success: '✓', error: '✕', info: 'ℹ',
}
const COLORS: Record<ToastType, string> = {
  success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    _setToasts = setToasts
    return () => { _setToasts = null }
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm shadow-lg pointer-events-auto animate-slide-in ${COLORS[t.type]}`}
          onClick={() => dismiss(t.id)}
        >
          <span className="font-bold text-base leading-none">{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
