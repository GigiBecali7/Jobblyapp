'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: 4, backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 1, backgroundColor: '#ddd', marginTop: 3 }} />
    </div>
  )
}

function DescBullets({ text, fs, ls }: { text: string; fs: number; ls: number }) {
  const lines = text.split('\n').map(l => l.trim().replace(/^[•\-–*]\s*/, '')).filter(Boolean)
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 8, color: '#999', marginTop: 3, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

export default function MonoElegant({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const navy = '#1B2E6B'
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, overflow: 'hidden' }}>
      {/* Top accent bar */}
      <div style={{ height: 4, backgroundColor: navy }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '26px 36px 18px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', lineHeight: 1, letterSpacing: -1 }}>{firstName} {lastName}</div>
          {position && <div style={{ fontSize: 13, color: '#888', marginTop: 6, textTransform: 'uppercase', letterSpacing: 2 }}>{position}</div>}
          <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', fontSize: 10, color: '#666' }}>
            {email        && <span>{email}</span>}
            {phone        && <span>{phone}</span>}
            {locationLine && <span>{locationLine}</span>}
            {linkedin     && <span>{linkedin}</span>}
          </div>
        </div>
        <div style={{ marginLeft: 24, flexShrink: 0 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 84, height: 84, borderRadius: 4, objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={84} />
          }
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '0 36px 6px' }} />

      {/* Body */}
      <div style={{ display: 'flex', padding: '16px 36px', gap: 32 }}>
        {/* Left (main) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profile && (
            <div>
              <SectionLabel label={sections?.profile ?? DEFAULT_SECTIONS.profile} />
              <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
            </div>
          )}
          <div>
            <SectionLabel label={sections?.experience ?? DEFAULT_SECTIONS.experience} />
            {expEntries.length > 0
              ? expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{e.title}</div>
                        {e.company && <div style={{ fontSize: 11, fontStyle: 'italic', color: '#666', marginTop: 1 }}>{e.company}</div>}
                      </div>
                      {e.period && <div style={{ fontSize: 10, color: '#333', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                    </div>
                    {e.description && <DescBullets text={e.description} fs={fs} ls={ls} />}
                  </div>
                ))
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        {/* Right (sidebar) */}
        <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <SectionLabel label={sections?.education ?? DEFAULT_SECTIONS.education} />
            {eduEntries.length > 0
              ? eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{e.degree}</div>
                    {e.institution && <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666', marginTop: 1 }}>{e.institution}</div>}
                    {e.period && <div style={{ fontSize: 10, color: '#333', fontWeight: 600, marginTop: 1 }}>{e.period}</div>}
                  </div>
                ))
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionLabel label={sections?.skills ?? DEFAULT_SECTIONS.skills} />
            {skills.length > 0
              ? skills.map((s, i) => <div key={i} style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>· {s}</div>)
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionLabel label={sections?.languages ?? DEFAULT_SECTIONS.languages} />
            {languages
              ? <div style={{ fontSize: 11, color: '#444' }}>{languages}</div>
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
