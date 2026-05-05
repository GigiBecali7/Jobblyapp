'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UserProfile, Application } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  profile: UserProfile
  applications: Application[]
  justUpgraded: boolean
}

export default function DashboardClient({ profile, applications, justUpgraded }: Props) {
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteApplication(id: string) {
    await supabase.from('applications').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div className="main" style={{ borderRadius: 12, border: '0.5px solid var(--border)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 3 }}>
              Hello, {profile?.first_name || 'there'} 👋
            </div>
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>{profile?.email}</div>
          </div>
          <button className="nbtn" onClick={handleLogout}>Sign out</button>
        </div>

        {justUpgraded && (
          <div className="success-msg" style={{ marginTop: '1rem' }}>
            🎉 Welcome to Jobbly Pro! Your subscription is now active.
          </div>
        )}

        {!profile?.is_pro && (
          <div style={{
            marginTop: '1rem', padding: '1rem 1.25rem',
            background: 'rgba(27,46,107,0.15)', borderRadius: 10,
            border: '0.5px solid rgba(27,46,107,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 3 }}>
                ⚡ Upgrade to Pro
              </div>
              <div style={{ fontSize: 12, color: 'var(--mid)' }}>
                Save applications, AI tailoring & PDF export — €9.99/month
              </div>
            </div>
            <button className="nbtn pri" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Loading...' : 'Upgrade →'}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div className="sec-title" style={{ marginBottom: '1rem' }}>
          <div className="sec-icon">📄</div>
          <span>Your applications ({applications.length})</span>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--mid)', fontSize: 14 }}>
            No applications yet.{' '}
            <Link href="/" style={{ color: 'var(--navy3)' }}>Create your first one →</Link>
          </div>
        ) : (
          <div className="dash-grid">
            {applications.map((app) => (
              <div key={app.id} className="app-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="app-card-title">{app.position}</div>
                    <div className="app-card-meta">
                      {app.company && `${app.company} · `}
                      {app.style} · {app.template} ·{' '}
                      {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="nbtn"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      {expandedId === app.id ? 'Hide' : 'View'}
                    </button>
                    <button
                      className="nbtn"
                      style={{ fontSize: 11, padding: '4px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                      onClick={() => handleDeleteApplication(app.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === app.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--border)' }}>
                    <div className="slabel">Profile</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '1rem' }}>
                      {app.cv_data?.profil}
                    </p>
                    <div className="slabel">Cover Letter</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {app.cover_letter}
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                      <div className="slabel">Skills</div>
                      <div>
                        {(app.cv_data?.skills || []).map((s, i) => (
                          <span key={i} className="chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
