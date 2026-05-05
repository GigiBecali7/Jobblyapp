'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/'), 2000)
  }

  return (
    <div className="app">
      <div className="nav">
        <Link href="/" className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1B2E6B"/>
            <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".95"/>
            <rect x="15" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
            <rect x="6" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
            <rect x="15" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".15"/>
          </svg>
          <div className="logo-text">jobbly<span className="logo-ai">.ai</span></div>
        </Link>
      </div>

      <div className="verify-box">
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔑</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: '.5rem' }}>
          Set new password
        </div>
        <p style={{ fontSize: 14, color: 'var(--mid)', marginBottom: '1.5rem' }}>
          Choose a strong password for your account.
        </p>

        {success ? (
          <div className="success-msg" style={{ maxWidth: 320, margin: '0 auto' }}>
            Password updated! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label>New password</label>
              <input
                type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} minLength={8}
              />
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input
                type="password" placeholder="••••••••" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} minLength={8}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
