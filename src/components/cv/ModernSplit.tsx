'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#B8B5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, border: '3px solid #fff' }}>
      {initials}
    </div>
  )
}

export default function ModernSplit({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, lineHeight: ls, overflow: 'hidden', position: 'relative' }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', backgroundColor: '#B8B5E8', opacity: 0.4 }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: '#B8B5E8', opacity: 0.3 }} />

      {/* Header */}
      <div style={{ padding: '40px 40px 20px', display: 'flex', alignItems: 'flex-end', gap: 20, position: 'relative', zIndex: 1 }}>
        {photoUrl
          ? <img src={photoUrl} alt="photo" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #B8B5E8', flexShrink: 0 }} />
          : <InitialsAvatar firstName={firstName} lastName={lastName} size={90} />
        }
        <div>
          <div style={{ fontSize: fs + 10, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.1 }}>{firstName} {lastName}</div>
          <div style={{ fontSize: fs + 1, color: '#7B78CC', marginTop: 4 }}>{position}</div>
        </div>
      </div>

      {/* Body columns */}
      <div style={{ display: 'flex', padding: '0 40px', gap: 32, marginTop: 8 }}>
        {/* Left column */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#7B78CC', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.contact ?? DEFAULT_SECTIONS.contact}</div>
            {email && <div style={{ fontSize: fs - 2, marginBottom: 3, wordBreak: 'break-all' }}>✉ {email}</div>}
            {phone && <div style={{ fontSize: fs - 2, marginBottom: 3 }}>☎ {phone}</div>}
            {city && <div style={{ fontSize: fs - 2, marginBottom: 3 }}>📍 {city}</div>}
            {linkedin && <div style={{ fontSize: fs - 2, wordBreak: 'break-all' }}>in {linkedin}</div>}
            {!email && !phone && !city && !linkedin && <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>

          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#7B78CC', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.skills ?? DEFAULT_SECTIONS.skills}</div>
            {skills.length > 0
              ? skills.map((s, i) => (
                  <div key={i} style={{ fontSize: fs - 2, marginBottom: 4 }}>• {s}</div>
                ))
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>

          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#7B78CC', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.languages ?? DEFAULT_SECTIONS.languages}</div>
            {languages
              ? <div style={{ fontSize: fs - 2 }}>{languages}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#2D2D2D', borderBottom: '2px solid #B8B5E8', paddingBottom: 4, marginBottom: 8 }}>{sections?.profile ?? DEFAULT_SECTIONS.profile}</div>
            {profile
              ? <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#2D2D2D', borderBottom: '2px solid #B8B5E8', paddingBottom: 4, marginBottom: 8 }}>{sections?.education ?? DEFAULT_SECTIONS.education}</div>
            {education
              ? <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{education}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: fs, fontWeight: 700, color: '#2D2D2D', borderBottom: '2px solid #B8B5E8', paddingBottom: 4, marginBottom: 8 }}>{sections?.experience ?? DEFAULT_SECTIONS.experience}</div>
            {experience
              ? <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls, whiteSpace: 'pre-wrap' }}>{experience}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
