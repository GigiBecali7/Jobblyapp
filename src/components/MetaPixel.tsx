'use client'
// Get Pixel ID from business.facebook.com → Events Manager → Create Pixel

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { loaded?: boolean; version?: string; queue?: unknown[] }
    _fbq?: typeof window.fbq
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('cookie_ok')
}

function initPixel() {
  if (!PIXEL_ID || typeof window === 'undefined') return
  if (!hasCookieConsent()) return
  if (window.fbq?.loaded) return

  // Standard Meta Pixel base code
  const n = function (...args: unknown[]) {
    n.queue = n.queue || []
    n.queue.push(args)
  }
  n.loaded = true
  n.version = '2.0'
  n.queue = [] as unknown[]
  window.fbq = n
  if (!window._fbq) window._fbq = n

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (!PIXEL_ID || typeof window === 'undefined') return
  if (!hasCookieConsent()) return
  if (!window.fbq) { initPixel(); return }
  window.fbq('track', event, params)
}

export default function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    initPixel()
  }, [])

  const trackPageView = useCallback(() => {
    if (!window.fbq || !hasCookieConsent()) return
    window.fbq('track', 'PageView')
  }, [])

  useEffect(() => {
    trackPageView()
  }, [pathname, trackPageView])

  if (!PIXEL_ID) return null

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}
