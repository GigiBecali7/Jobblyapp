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

const ALL_PLATFORMS = [
  { key: 'stepstone', label: 'StepStone' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'indeed', label: 'Indeed' },
  { key: 'willhaben', label: 'Willhaben' },
  { key: 'karriere', label: 'Karriere.at' },
  { key: 'monster', label: 'Monster' },
  { key: 'glassdoor', label: 'Glassdoor' },
  { key: 'xing', label: 'XING' },
]

export default function DashboardClient({ profile, applications, justUpgraded }: Props) {
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'applications' | 'alerts'>('applications')

  // Job alert preferences state
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [alertFreq, setAlertFreq] = useState<'instant' | 'daily' | 'weekly'>('daily')
  const [alertPlatforms, setAlertPlatforms] = useState<string[]>(['stepstone', 'linkedin', 'indeed', 'willhaben', 'karriere'])
  const [alertsSaved, setAlertsSaved] = useState(false)
  const [savingAlerts, setSavingAlerts] = useState(false)

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

  async function saveAlertPrefs() {
    setSavingAlerts(true)
    try {
      await supabase.from('job_alerts').upsert({
        user_id: profile.id,
        enabled: alertsEnabled,
        platforms: alertPlatforms,
        frequency: alertFreq,
      }, { onConflict: 'user_id' })
      setAlertsSaved(true)
      setTimeout(() => setAlertsSaved(false), 3000)
    } finally {
      setSavingAlerts(false)
    }
  }

  function togglePlatform(key: string) {
    setAlertPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  return (
    <div className="main" style={{ borderRadius: 12, border: '0.5px solid var(--border)' }}>
      {/* Header */}
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
          <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(27,46,107,0.15)', borderRadius: 10, border: '0.5px solid rgba(27,46,107,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 3 }}>⚡ Upgrade to Pro</div>
              <div style={{ fontSize: 12, color: 'var(--mid)' }}>
                Job alerts, one-click apply, PDF/Word export, 3 premium designs — €9.99/month
              </div>
            </div>
            <button className="nbtn pri" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Loading...' : 'Upgrade →'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
        {(['applications', 'alerts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: activeTab === tab ? '#fff' : 'var(--mid)', borderBottom: activeTab === tab ? '2px solid #1B2E6B' : '2px solid transparent', transition: 'all .2s' }}
          >
            {tab === 'applications' ? `📄 Applications (${applications.length})` : '🔔 Job Alerts'}
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {activeTab === 'applications' && (
        <div style={{ padding: '1.5rem' }}>
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
                      <button className="nbtn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                        {expandedId === app.id ? 'Hide' : 'View'}
                      </button>
                      <button className="nbtn" style={{ fontSize: 11, padding: '4px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => handleDeleteApplication(app.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {expandedId === app.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '0.5px solid var(--border)' }}>
                      <div className="slabel">Profile</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '1rem' }}>{app.cv_data?.profil}</p>
                      <div className="slabel">Cover Letter</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{app.cover_letter}</p>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="slabel">Skills</div>
                        <div>{(app.cv_data?.skills || []).map((s, i) => <span key={i} className="chip">{s}</span>)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job alerts tab */}
      {activeTab === 'alerts' && (
        <div style={{ padding: '1.5rem' }}>
          {!profile.is_pro && (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(27,46,107,0.1)', borderRadius: 10, border: '0.5px solid rgba(27,46,107,0.3)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6 }}>
                🔒 <strong style={{ color: '#fff' }}>Job alerts are a Pro feature.</strong> Upgrade to get instant notifications when your dream job is posted on 8+ platforms — and apply with one click.
              </div>
              <button className="nbtn pri" style={{ marginTop: '0.75rem', fontSize: 12 }} onClick={handleUpgrade}>Upgrade to Pro →</button>
            </div>
          )}

          <div style={{ opacity: profile.is_pro ? 1 : 0.4, pointerEvents: profile.is_pro ? 'auto' : 'none' }}>
            {/* On/off toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '0.5px solid var(--border)', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Job alerts</div>
                <div style={{ fontSize: 12, color: 'var(--mid)', marginTop: 2 }}>Get notified when matching jobs are posted</div>
              </div>
              <button
                onClick={() => setAlertsEnabled(e => !e)}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: alertsEnabled ? '#1B2E6B' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: 3, left: alertsEnabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: alertsEnabled ? '#93AFFD' : 'rgba(255,255,255,0.3)', transition: 'left .2s' }} />
              </button>
            </div>

            {/* Frequency */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 12, color: 'var(--mid)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notification frequency</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['instant', 'daily', 'weekly'] as const).map(f => (
                  <button key={f} onClick={() => setAlertFreq(f)} style={{ padding: '6px 14px', borderRadius: 8, border: `0.5px solid ${alertFreq === f ? '#253A85' : 'var(--border)'}`, background: alertFreq === f ? 'rgba(27,46,107,0.3)' : 'transparent', color: alertFreq === f ? '#93AFFD' : 'var(--mid)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 12, color: 'var(--mid)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platforms</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_PLATFORMS.map(({ key, label }) => {
                  const on = alertPlatforms.includes(key)
                  return (
                    <button key={key} onClick={() => togglePlatform(key)} style={{ padding: '6px 14px', borderRadius: 8, border: `0.5px solid ${on ? '#253A85' : 'var(--border)'}`, background: on ? 'rgba(27,46,107,0.3)' : 'transparent', color: on ? '#93AFFD' : 'var(--mid)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}>
                      {on ? '✓ ' : ''}{label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button className="btn" onClick={saveAlertPrefs} disabled={savingAlerts}>
              {savingAlerts ? 'Saving…' : alertsSaved ? '✓ Saved!' : 'Save preferences'}
            </button>

            {/* Platform notice */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--mid)', lineHeight: 1.7 }}>
                <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Note:</strong> Live job feeds require platform API keys. To activate, add your <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>STEPSTONE_API_KEY</code>, <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>INDEED_API_KEY</code> etc. to your Vercel environment variables. Preferences are saved and ready to activate.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
