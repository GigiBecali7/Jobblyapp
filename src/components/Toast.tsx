'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error'

interface Props {
  message: string
  type: ToastType
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const show = requestAnimationFrame(() => setVisible(true))
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 4000)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(hide)
    }
  }, [onDismiss])

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-in' : ''}`}>
      <span className="toast-icon">{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button className="toast-close" onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}>×</button>
    </div>
  )
}
