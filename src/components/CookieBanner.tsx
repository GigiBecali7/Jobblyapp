'use client'

import { useState, useEffect } from 'react'

interface Props {
  onOpenLegal: (section: string) => void
}

export default function CookieBanner({ onOpenLegal }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_ok')) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('cookie_ok', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie">
      <p>
        We use only essential cookies — no ads, no tracking.{' '}
        <span className="llink" onClick={() => onOpenLegal('cookies')}>Learn more</span>
      </p>
      <div className="cookie-btns">
        <button className="cbtn" onClick={dismiss}>Essential only</button>
        <button className="cbtn yes" onClick={dismiss}>Accept</button>
      </div>
    </div>
  )
}
