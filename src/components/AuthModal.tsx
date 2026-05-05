'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialTab?: 'login' | 'register'
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ initialTab = 'login', onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regFn, setRegFn] = useState('')
  const [regLn, setRegLn] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regPw2, setRegPw2] = useState('')
  const [agb, setAgb] = useState(false)
  const [age, setAge] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }
    setError(''); setLoading(true)

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (err) {
      if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email first. Check your inbox.')
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password.')
      } else {
        setError(err.message)
      }
      return
    }
    onSuccess()
    onClose()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!agb) { setError('Please accept Terms of Service and Privacy Policy.'); return }
    if (!age) { setError('Please confirm you are at least 18 years old.'); return }
    if (!regFn || !regEmail || !regPw) { setError('Please fill in all required fields.'); return }
    if (regPw !== regPw2) { setError('Passwords do not match.'); return }
    if (regPw.length < 8) { setError('Password must be at least 8 characters.'); return }

    setError(''); setLoading(true)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    const { error: err } = await supabase.auth.signUp({
      email: regEmail,
      password: regPw,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          first_name: regFn,
          last_name: regLn,
        },
      },
    })

    setLoading(false)
    if (err) { setError(err.message); return }

    setSuccess(`Verification email sent to ${regEmail}. Please check your inbox and click the link to activate your account.`)
  }

  async function handleGoogle() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${appUrl}/auth/callback` },
    })
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email above, then click Forgot password.'); return }
    setError(''); setLoading(true)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Password reset email sent. Check your inbox.')
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-x" onClick={onClose}>✕</button>
        <div className="modal-title">
          {tab === 'login' ? 'Welcome back' : 'Create account'}
        </div>
        <div className="modal-sub">
          {tab === 'login' ? 'Sign in to manage your applications' : 'Start free — no credit card needed'}
        </div>

        <div className="mtabs">
          <button className={`mtab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
            Sign in
          </button>
          <button className={`mtab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
            Register
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        {tab === 'login' && !success && (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn" type="submit" style={{ marginTop: '.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--mid)', textAlign: 'center', marginTop: '.75rem' }}>
              Forgot password?{' '}
              <span className="llink" onClick={handleForgotPassword}>Reset here</span>
            </p>
          </form>
        )}

        {tab === 'register' && !success && (
          <form onSubmit={handleRegister}>
            <div className="g2">
              <div className="field">
                <label>First name *</label>
                <input type="text" placeholder="Max" value={regFn} onChange={(e) => setRegFn(e.target.value)} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input type="text" placeholder="Mustermann" value={regLn} onChange={(e) => setRegLn(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" placeholder="you@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password (min. 8 chars) *</label>
              <input type="password" placeholder="••••••••" value={regPw} onChange={(e) => setRegPw(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirm password *</label>
              <input type="password" placeholder="••••••••" value={regPw2} onChange={(e) => setRegPw2(e.target.value)} />
            </div>
            <div style={{ margin: '.75rem 0' }}>
              <label className="consent">
                <input type="checkbox" checked={agb} onChange={(e) => setAgb(e.target.checked)} />
                I accept the{' '}
                <span className="llink">Terms of Service</span>{' '}
                and{' '}
                <span className="llink">Privacy Policy</span> *
              </label>
              <label className="consent">
                <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} />
                I confirm I am at least 18 years old *
              </label>
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--mid)', marginTop: '.75rem', lineHeight: 1.5 }}>
              * Required. Data processed under GDPR. Never shared with advertisers.
            </p>
          </form>
        )}

        {!success && (
          <>
            <div className="divider">or</div>
            <button className="gbtn" type="button" onClick={handleGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  )
}
