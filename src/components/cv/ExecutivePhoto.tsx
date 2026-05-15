'use client'
import React from 'react'
import type { CVProps } from './types'

function InitialsAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40, fontWeight: 700 }}>
      {initials}
    </div>
  )
}

function ProgressBar({ label, pct = 80 }: { label: string; pct?: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span>{label}</span><span style={{ color: '#1B2E6B' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, backgroundColor: '#1B2E6B', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function ExecutivePhoto({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal' }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', height: 200 }}>
        {/* Left header */}
        <div style={{ flex: 1, backgroundColor: '#1B2E6B', padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: fs + 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 2 }}>{firstName}</div>
          <div style={{ fontSize: fs + 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 2 }}>{lastName}</div>
          <div style={{ fontSize: fs, color: '#8BA3D4', marginTop: 6 }}>{position}</div>
        </div>
        {/* Photo right */}
        <div style={{ width: '40%', overflow: 'hidden' }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} />
          }
        </div>
      </div>

      {/* Contact bar */}
      <div style={{ backgroundColor: '#F0F3FA', padding: '10px 28px', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: fs - 2, color: '#1B2E6B' }}>
        {email && <span>✉ {email}</span>}
        {phone && <span>☎ {phone}</span>}
        {city && <span>📍 {city}</span>}
        {linkedin && <span>in {linkedin}</span>}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '24px 28px', gap: 28 }}>
        {/* Left */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #1B2E6B', paddingBottom: 4, marginBottom: 10 }}>Kenntnisse</div>
            {skills.map((s, i) => <ProgressBar key={i} label={s} pct={Math.max(60, 95 - i * 7)} />)}
          </div>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #1B2E6B', paddingBottom: 4, marginBottom: 8 }}>Sprachen</div>
            <div style={{ fontSize: fs - 1, color: '#444' }}>{languages}</div>
          </div>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #1B2E6B', paddingBottom: 4, marginBottom: 8 }}>Ausbildung</div>
            <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{education}</div>
          </div>
        </div>
        {/* Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #1B2E6B', paddingBottom: 4, marginBottom: 8 }}>Profil</div>
            <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
          </div>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #1B2E6B', paddingBottom: 4, marginBottom: 8 }}>Berufserfahrung</div>
            <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls, whiteSpace: 'pre-wrap' }}>{experience}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
