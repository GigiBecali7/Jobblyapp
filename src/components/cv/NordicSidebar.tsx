'use client'
import React from 'react'
import type { CVProps } from './types'

function InitialsAvatar({ firstName, lastName, size = 80, color = '#8B7355' }: { firstName: string; lastName: string; size?: number; color?: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function NordicSidebar({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal' }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  return (
    <div style={{ width: 794, height: 1123, display: 'flex', fontFamily, fontSize: fs, lineHeight: ls, backgroundColor: '#fff', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '35%', backgroundColor: '#F5EDE3', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={90} color="#8B7355" />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 4, fontWeight: 700, color: '#3D2B1F' }}>{firstName}</div>
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 4, fontWeight: 700, color: '#3D2B1F' }}>{lastName}</div>
            <div style={{ fontSize: fs - 1, color: '#8B7355', marginTop: 4 }}>{position}</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #C4AA8E', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Kontakt</div>
          {email && <div style={{ fontSize: fs - 2, color: '#5C4033', marginBottom: 4 }}>✉ {email}</div>}
          {phone && <div style={{ fontSize: fs - 2, color: '#5C4033', marginBottom: 4 }}>☎ {phone}</div>}
          {city && <div style={{ fontSize: fs - 2, color: '#5C4033', marginBottom: 4 }}>📍 {city}</div>}
          {linkedin && <div style={{ fontSize: fs - 2, color: '#5C4033', wordBreak: 'break-all' }}>in {linkedin}</div>}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #C4AA8E', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Kenntnisse</div>
          {skills.map((s, i) => (
            <div key={i} style={{ fontSize: fs - 2, color: '#5C4033', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #C4AA8E', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Sprachen</div>
          <div style={{ fontSize: fs - 2, color: '#5C4033' }}>{languages}</div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #C4AA8E', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 1, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ausbildung</div>
          <div style={{ fontSize: fs - 2, color: '#5C4033' }}>{education}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: fs + 2, fontWeight: 700, color: '#3D2B1F', marginBottom: 2, fontFamily: 'Georgia' }}>Profil</div>
          <hr style={{ border: 'none', borderTop: '1px solid #8B7355', marginBottom: 8 }} />
          <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{profile}</div>
        </div>

        <div>
          <div style={{ fontSize: fs + 2, fontWeight: 700, color: '#3D2B1F', marginBottom: 2, fontFamily: 'Georgia' }}>Berufserfahrung</div>
          <hr style={{ border: 'none', borderTop: '1px solid #8B7355', marginBottom: 8 }} />
          <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, whiteSpace: 'pre-wrap' }}>{experience}</div>
        </div>
      </div>
    </div>
  )
}
