'use client'
import { useState, useEffect } from 'react'
import { trackEvent } from '@/components/MetaPixel'

interface Props {
  feature: string
  onClose: () => void
}

export default function UpgradeModal({ feature, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleUpgrade() {
    setLoading(true)
    trackEvent('InitiateCheckout', { value: 9.99, currency: 'EUR' })
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally { setLoading(false) }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20, backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: 'relative', background: '#0D1117', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 440, padding: '36px 32px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#8892A4', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>⭐</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#93AFFD', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Premium erforderlich</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>Schalte {feature} frei</div>
          <div style={{ fontSize: 14, color: '#8892A4', lineHeight: 1.5 }}>Upgrade auf Premium und bewirb dich schneller auf Traumjobs</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          {[
            'Alle 6 exklusiven CV-Designs mit Foto',
            '1-Klick Bewerbung — KI bewirbt sich für dich',
            'Unbegrenzte Bewerbungen',
            'Sofort-Alarm bei neuen Traumjobs',
            'Eigener KI-Assistent 24/7',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: '#f59e0b', fontSize: 11, flexShrink: 0, marginTop: 2 }}>✦</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: '#8892A4', textAlign: 'center', marginBottom: 20 }}>
          Ab 9,99 € / Monat — jederzeit kündbar
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 10 }}>
          <button onClick={onClose} style={{ padding: 13, borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            Vielleicht später
          </button>
          <button onClick={handleUpgrade} disabled={loading} style={{ padding: 13, borderRadius: 10, background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: loading ? '#8892A4' : '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
            {loading ? 'Weiterleitung…' : '⭐ Jetzt upgraden →'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#8892A4', textAlign: 'center', marginTop: 12 }}>
          14-Tage Geld-zurück-Garantie · Gesichert durch Stripe
        </div>
      </div>
    </div>
  )
}
