'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { JMark } from '@/components/JLogo'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return }

    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/'), 3000)
  }

  return (
    <div className="app">
      <div className="nav">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <JMark size={28} />
          <div className="logo-text">jobbly<span className="logo-ai">.ai</span></div>
        </Link>
      </div>

      <div className="verify-box">
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔑</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: '.5rem' }}>
          Neues Passwort festlegen
        </div>
        <p style={{ fontSize: 14, color: 'var(--mid)', marginBottom: '1.5rem' }}>
          Wähle ein sicheres Passwort für dein Konto.
        </p>

        {success ? (
          <div className="success-msg" style={{ maxWidth: 320, margin: '0 auto' }}>
            ✓ Passwort erfolgreich geändert! Du wirst weitergeleitet…
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label>Neues Passwort</label>
              <input type="password" placeholder="Min. 8 Zeichen" value={password} onChange={e => setPassword(e.target.value)} minLength={8} />
            </div>
            <div className="field">
              <label>Passwort bestätigen</label>
              <input type="password" placeholder="Passwort wiederholen" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--mid)', textAlign: 'center', marginTop: '1rem' }}>
              <Link href="/" style={{ color: 'var(--navy3)', textDecoration: 'none' }}>← Zurück zur Startseite</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
