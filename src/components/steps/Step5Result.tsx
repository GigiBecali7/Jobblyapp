'use client'

import type { CVData, UserData, Template } from '@/lib/types'
import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  loading: boolean
  loadMsg: string
  cvData: CVData | null
  userData: UserData
  template: Template
  onStartOver: () => void
}

const tplColors: Record<Template, { acc: string; hbg: string; dark: boolean }> = {
  classic:   { acc: '#fff',     hbg: '#0A0A0F', dark: true  },
  modern:    { acc: '#1B2E6B', hbg: '#1B2E6B', dark: true  },
  minimal:   { acc: '#1B2E6B', hbg: '#f9f9f9', dark: false },
  navy:      { acc: '#fff',     hbg: '#1B2E6B', dark: true  },
  executive: { acc: '#0A0A0F', hbg: '#f5f5f5', dark: false },
  tech:      { acc: '#253A85', hbg: '#0D1117', dark: true  },
}

export default function Step5Result({ t, loading, loadMsg, cvData, userData, template, onStartOver }: Props) {
  if (loading) {
    return (
      <div className="loading">
        <div style={{ marginBottom: '1rem' }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
        <p style={{ fontSize: 14, color: 'var(--mid)' }}>{loadMsg}</p>
      </div>
    )
  }

  if (!cvData) return null

  const c = tplColors[template] || tplColors.classic
  const isDark = c.dark
  const txtColor = isDark ? 'rgba(255,255,255,0.85)' : '#1C2333'
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : '#5a6272'
  const skillsArr = Array.isArray(cvData.skills)
    ? cvData.skills
    : (cvData.skills as unknown as string || '').split(',').filter(Boolean)

  return (
    <div>
      <div className="ok-badge">✓ {t.ok}</div>

      <div className="cv-box">
        <div style={{ background: c.hbg, padding: '1.25rem', borderBottom: '2px solid rgba(27,46,107,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: isDark ? 'rgba(27,46,107,0.5)' : 'rgba(27,46,107,0.1)',
              border: `1.5px solid ${isDark ? 'rgba(27,46,107,0.6)' : 'rgba(27,46,107,0.25)'}`,
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, color: isDark ? '#93AFFD' : '#1B2E6B',
            }}>
              {(userData.fname || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.3px', color: isDark ? '#fff' : c.acc }}>
                {userData.fullname}
              </div>
              <div style={{ fontSize: 12, marginTop: 2, color: subColor }}>{userData.position || 'Applicant'}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: isDark ? 'rgba(255,255,255,0.3)' : '#aaa' }}>
                {[userData.email, userData.phone, userData.city].filter(Boolean).join('  ·  ')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', background: isDark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
          {[
            { label: 'Profile', content: <p style={{ fontSize: 13, lineHeight: 1.7, color: txtColor }}>{cvData.profil}</p> },
            { label: 'Experience', content: <p style={{ fontSize: 13, lineHeight: 1.7, color: txtColor }}>{cvData.erfahrung}</p> },
            { label: 'Education', content: <p style={{ fontSize: 13, lineHeight: 1.7, color: txtColor }}>{cvData.ausbildung || userData.education || '–'}</p> },
            {
              label: 'Skills',
              content: (
                <div>
                  {skillsArr.map((s, i) => (
                    <span key={i} className="chip" style={{
                      borderColor: `rgba(27,46,107,${isDark ? '0.4' : '0.25'})`,
                      color: isDark ? '#93AFFD' : '#1B2E6B',
                      background: `rgba(27,46,107,${isDark ? '0.2' : '0.08'})`,
                    }}>{typeof s === 'string' ? s.trim() : s}</span>
                  ))}
                </div>
              ),
            },
            { label: 'Languages', content: <p style={{ fontSize: 13, color: txtColor }}>{cvData.sprachen || userData.languages || '–'}</p> },
          ].map(({ label, content }) => (
            <div key={label} style={{ marginBottom: '1rem' }}>
              <div className="slabel" style={{ color: isDark ? '#93AFFD' : '#1B2E6B', borderColor: 'rgba(27,46,107,0.2)' }}>
                {label}
              </div>
              {content}
            </div>
          ))}
        </div>
      </div>

      <div className="cover-box">
        <span className="slabel">{t.cover}</span>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap' }}>
          {cvData.anschreiben}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-out" onClick={onStartOver}>Start over</button>
        <button className="btn" onClick={() => window.print()}>Save as PDF ↓</button>
      </div>
    </div>
  )
}
