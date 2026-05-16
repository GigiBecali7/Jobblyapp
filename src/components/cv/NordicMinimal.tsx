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

export default function NordicMinimal({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const navy = '#1B2E6B'

  const SectionHeading = ({ label }: { label: string }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: fs, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Georgia' }}>{label}</div>
      <hr style={{ border: 'none', borderTop: `1px solid ${navy}`, marginTop: 4, marginBottom: 0 }} />
    </div>
  )

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
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 4, fontWeight: 700, color: navy }}>{firstName} {lastName}</div>
            <div style={{ fontSize: fs - 1, color: '#666', marginTop: 3 }}>{position}</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{sections?.contact ?? DEFAULT_SECTIONS.contact}</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${navy}`, marginBottom: 6 }} />
          {email && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{email}</div>}
          {phone && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{phone}</div>}
          {city && <div style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>{city}</div>}
          {linkedin && <div style={{ fontSize: fs - 3, color: '#444', wordBreak: 'break-all' }}>{linkedin}</div>}
          {!email && !phone && !city && !linkedin && <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{sections?.skills ?? DEFAULT_SECTIONS.skills}</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${navy}`, marginBottom: 6 }} />
          {skills.length > 0
            ? skills.map((s, i) => <div key={i} style={{ fontSize: fs - 3, color: '#444', marginBottom: 3 }}>– {s}</div>)
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{sections?.languages ?? DEFAULT_SECTIONS.languages}</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${navy}`, marginBottom: 6 }} />
          {languages
            ? <div style={{ fontSize: fs - 3, color: '#444' }}>{languages}</div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <SectionHeading label={sections?.profile ?? DEFAULT_SECTIONS.profile} />
          {profile
            ? <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, marginTop: 8 }}>{profile}</div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic', marginTop: 8 }}>—</div>}
        </div>

        <div>
          <SectionHeading label={sections?.experience ?? DEFAULT_SECTIONS.experience} />
          {expEntries.length > 0
            ? <div style={{ marginTop: 8 }}>
                {expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: fs, color: '#1a1a1a' }}>{e.title}</div>
                    {e.company && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: navy }}>{e.company}</div>}
                    {e.period && <div style={{ fontSize: fs - 2, color: navy, fontWeight: 600 }}>{e.period}</div>}
                    {e.description && <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, marginTop: 2, whiteSpace: 'pre-wrap' }}>{e.description}</div>}
                  </div>
                ))}
              </div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic', marginTop: 8 }}>—</div>}
        </div>

        <div>
          <SectionHeading label={sections?.education ?? DEFAULT_SECTIONS.education} />
          {eduEntries.length > 0
            ? <div style={{ marginTop: 8 }}>
                {eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: fs, color: '#1a1a1a' }}>{e.degree}</div>
                    {e.institution && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: navy }}>{e.institution}</div>}
                    {e.period && <div style={{ fontSize: fs - 2, color: navy, fontWeight: 600 }}>{e.period}</div>}
                  </div>
                ))}
              </div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic', marginTop: 8 }}>—</div>}
        </div>
      </div>
    </div>
  )
}
