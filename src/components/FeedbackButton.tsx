'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  userEmail?: string
}

const CATEGORIES = [
  { value: 'bug',         label: '🐛 Bug gefunden' },
  { value: 'improvement', label: '💡 Verbesserungsvorschlag' },
  { value: 'general',     label: '⭐ Allgemeines Feedback' },
  { value: 'love',        label: '🎉 Ich liebe Jobbly!' },
]

export default function FeedbackButton({ userEmail = '' }: Props) {
  const [open, setOpen]         = useState(false)
  const [category, setCategory] = useState(CATEGORIES[2].value)
  const [message, setMessage]   = useState('')
  const [email, setEmail]       = useState(userEmail)
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [mob, setMob]           = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const check = () => setMob(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (open) {
      setMessage(''); setSent(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: CATEGORIES.find(c => c.value === category)?.label || category,
          message, email,
          pageUrl: window.location.href,
        }),
      })
      setSent(true)
      setTimeout(() => { setOpen(false); setSent(false) }, 2000)
    } catch { /* non-fatal */ }
    finally { setSending(false) }
  }

  const btnStyle: React.CSSProperties = {
    position: 'fixed',
    right: 24,
    bottom: mob ? 88 : 24,
    width: 56, height: 56,
    borderRadius: '50%',
    backgroundColor: '#93AFFD',
    border: 'none',
    cursor: 'pointer',
    fontSize: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(147,175,253,0.45)',
    zIndex: 9999,
    transition: 'transform .15s, background-color .15s',
    color: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'rgba(255,255,255,0.55)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.8,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff',
    fontFamily: 'inherit', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', minHeight: 44,
  }
  const btnPrimary: React.CSSProperties = {
    backgroundColor: '#1B2E6B', color: '#fff', border: 'none',
    borderRadius: 9, padding: '11px 22px', fontSize: 14,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnSecondary: React.CSSProperties = {
    backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9,
    padding: '11px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  }

  // Modal geometry
  const modalStyle: React.CSSProperties = mob
    ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#111827',
        borderRadius: '16px 16px 0 0',
        padding: '20px 20px 32px',
        zIndex: 10000,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'slideUp .25s ease-out',
      }
    : {
        position: 'fixed', bottom: 96, right: 24,
        width: 380,
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 24,
        zIndex: 10000,
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
      }

  return (
    <>
      {/* Feedback trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={btnStyle}
        title="Feedback geben"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7B9AFF' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#93AFFD' }}
        aria-label="Feedback geben"
      >
        💬
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Modal */}
      {open && (
        <div style={modalStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Dein Feedback 💬</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Hilf uns Jobbly zu verbessern!</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 16, color: '#4ADE80', fontWeight: 600 }}>
              Danke für dein Feedback! 🎉
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Kategorie</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nachricht *</label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Was möchtest du uns mitteilen?"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Deine E-Mail (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: 10, flexDirection: mob ? 'column' : 'row' }}>
                <button type="button" onClick={() => setOpen(false)} style={{ ...btnSecondary, ...(mob ? { width: '100%' } : {}) }}>
                  Abbrechen
                </button>
                <button type="submit" disabled={sending || !message.trim()}
                  style={{ ...btnPrimary, ...(mob ? { width: '100%' } : { flex: 1 }), opacity: (sending || !message.trim()) ? 0.6 : 1 }}>
                  {sending ? 'Wird gesendet…' : 'Feedback senden →'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
