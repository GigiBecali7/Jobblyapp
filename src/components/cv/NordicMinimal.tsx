'use client'
import React from 'react'
import type { CVProps } from './types'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: 4, backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700 }}>
      {initials}
    </div>
  )
}

export default function NordicMinimal({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal' }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#FAFAFA', fontFamily, fontSize: fs, lineHeight: ls, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '32%', backgroundColor: '#F5F5F5', padding: '36px 20px', display: 'flex', flexDirection: 'column', gap: 20, borderRight: '1px solid #E8E8E8' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 80, height: 80, borderRadius: 4, objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={80} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 3, fontWeight: 700, color: '#1B2E6B' }}>{firstName} {lastName}</div>
            <div style={{ fontSize: fs - 2, color: '#666', marginTop: 3 }}>{position}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Kontakt</div>
          {email && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{email}</div>}
          {phone && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{phone}</div>}
          {city && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{city}</div>}
          {linkedin && <div style={{ fontSize: fs - 3, color: '#444', wordBreak: 'break-all' }}>{linkedin}</div>}
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Kenntnisse</div>
          {skills.map((s, i) => <div key={i} style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>– {s}</div>)}
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: '#1B2E6B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Sprachen</div>
          <div style={{ fontSize: fs - 3, color: '#444' }}>{languages}</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', fontFamily: 'Georgia', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Profil</div>
          <hr style={{ border: 'none', borderTop: '1px solid #1B2E6B', marginBottom: 8 }} />
          <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{profile}</div>
        </div>
        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', fontFamily: 'Georgia', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Berufserfahrung</div>
          <hr style={{ border: 'none', borderTop: '1px solid #1B2E6B', marginBottom: 8 }} />
          <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, whiteSpace: 'pre-wrap' }}>{experience}</div>
        </div>
        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#1B2E6B', fontFamily: 'Georgia', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Ausbildung</div>
          <hr style={{ border: 'none', borderTop: '1px solid #1B2E6B', marginBottom: 8 }} />
          <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{education}</div>
        </div>
      </div>
    </div>
  )
}
