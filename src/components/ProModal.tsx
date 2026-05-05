'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  isLoggedIn: boolean
  onNeedAuth: () => void
}

export default function ProModal({ onClose, isLoggedIn, onNeedAuth }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpgrade() {
    if (!isLoggedIn) {
      onClose()
      onNeedAuth()
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-x" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', padding: '.5rem 0 1rem' }}>
          <div className="pro-icon">⚡</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Jobbly Pro</div>
          <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: '.75rem' }}>
            Save and edit unlimited applications
          </div>
          <div className="price">€9.99<span>/month</span></div>
          <div style={{ fontSize: 12, color: 'var(--mid)', marginBottom: '1.25rem' }}>
            Cancel anytime · No hidden fees
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
          {[
            'Save & edit unlimited applications',
            'Email alerts for matching jobs',
            'AI tailors your CV to each job posting',
            'All 6 designs & 4 writing styles',
            'PDF export & priority support',
          ].map((feat) => (
            <div key={feat} className="feat">
              <div className="feat-dot">✓</div>
              {feat}
            </div>
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting to checkout...' : 'Unlock Pro · €9.99/month'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--mid)', textAlign: 'center', marginTop: '.75rem' }}>
          14-day money-back guarantee · Secured by Stripe
        </p>
      </div>
    </div>
  )
}
