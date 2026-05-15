'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: 4, backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700 }}>
      {initials}
    </div>
  )
}

export default function MonoElegant({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, overflow: 'hidden' }}>
      {/* Top accent bar */}
      <div style={{ height: 4, backgroundColor: '#1B2E6B' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 36px 20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: fs + 16, fontWeight: 900, color: '#1a1a1a', lineHeight: 1, letterSpacing: -1 }}>{firstName} {lastName}</div>
          <div style={{ fontSize: fs + 2, color: '#999', marginTop: 6, textTransform: 'uppercase', letterSpacing: 2 }}>{position}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', fontSize: fs - 2, color: '#666' }}>
            {email && <span>{email}</span>}
            {phone && <span>{phone}</span>}
            {city && <span>{city}</span>}
            {linkedin && <span>{linkedin}</span>}
          </div>
        </div>
        <div style={{ marginLeft: 24, flexShrink: 0 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 90, height: 90, borderRadius: 4, objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={90} />
          }
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '0 36px' }} />

      {/* Body */}
      <div style={{ display: 'flex', padding: '20px 36px', gap: 32 }}>
        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sections?.profile ?? DEFAULT_SECTIONS.profile}</div>
            {profile
              ? <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{profile}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sections?.experience ?? DEFAULT_SECTIONS.experience}</div>
            {experience
              ? <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, whiteSpace: 'pre-wrap' }}>{experience}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
        {/* Right */}
        <div style={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sections?.education ?? DEFAULT_SECTIONS.education}</div>
            {education
              ? <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{education}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sections?.skills ?? DEFAULT_SECTIONS.skills}</div>
            {skills.length > 0
              ? skills.map((s, i) => <div key={i} style={{ fontSize: fs - 2, color: '#333', marginBottom: 3 }}>· {s}</div>)
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sections?.languages ?? DEFAULT_SECTIONS.languages}</div>
            {languages
              ? <div style={{ fontSize: fs - 1, color: '#333' }}>{languages}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
