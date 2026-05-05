'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  isLoggedIn: boolean
  onNeedAuth: () => void
}

const FEATURES = [
  { icon: '⚡', text: 'Mit einem Klick bewerben — KI passt dein Anschreiben automatisch zur Stellenausschreibung an' },
  { icon: '🔔', text: 'Sofort-Benachrichtigung wenn Traumjobs auf StepStone, LinkedIn, Indeed, Willhaben und 5 weiteren Plattformen erscheinen' },
  { icon: '🚀', text: 'Bewirb dich auf 10 Jobs in 5 Minuten statt 5 Stunden' },
  { icon: '📋', text: 'Unbegrenzte Bewerbungen, alle 9 Premium-Designs, PDF & Word Export' },
  { icon: '✏️', text: 'Alle CV- und Anschreiben-Felder vor dem Export bearbeiten' },
  { icon: '🌍', text: 'Wir übernehmen deinen gesamten Bewerbungsprozess' },
]

export default function ProModal({ onClose, isLoggedIn, onNeedAuth }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    if (!isLoggedIn) { onClose(); onNeedAuth(); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      if (data.url) window.location.href = data.url
    } catch {
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <button className="modal-x" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', padding: '.5rem 0 1.25rem' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Jobbly Pro</div>
          <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: '1rem' }}>
            Dein gesamter Bewerbungsprozess — automatisiert
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-.5px' }}>
            €9.99<span style={{ fontSize: 16, color: 'var(--mid)', fontWeight: 400 }}>/Monat</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--mid)', marginTop: 4 }}>
            Jederzeit kündbar · Keine versteckten Kosten · MwSt. inklusive
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
          {FEATURES.map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button
          className="btn"
          onClick={handleUpgrade}
          disabled={loading}
          style={{ fontSize: 15, fontWeight: 700, padding: 13, background: 'linear-gradient(135deg, #1B2E6B 0%, #253A85 100%)', letterSpacing: '-.2px' }}
        >
          {loading ? 'Weiterleitung zur Zahlung…' : 'Jetzt upgraden · €9.99/Monat →'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--mid)', textAlign: 'center', marginTop: '.75rem', lineHeight: 1.5 }}>
          14-Tage Geld-zurück-Garantie · Gesichert durch Stripe
        </p>
      </div>
    </div>
  )
}
