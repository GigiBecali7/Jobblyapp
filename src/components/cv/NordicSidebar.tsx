'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

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

export default function NordicSidebar({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const accent = '#8B7355'
  const dark = '#3D2B1F'
  const body = '#5C4033'
  const divider = '#C4AA8E'

  const SidebarHeading = ({ label }: { label: string }) => (
    <div style={{ fontSize: fs - 1, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
  )

  return (
    <div style={{ width: 794, height: 1123, display: 'flex', fontFamily, fontSize: fs, lineHeight: ls, backgroundColor: '#fff', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '35%', backgroundColor: '#F5EDE3', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${divider}` }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={90} color={accent} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 5, fontWeight: 700, color: dark, lineHeight: 1.1 }}>{firstName}</div>
            <div style={{ fontFamily: 'Georgia', fontSize: fs + 5, fontWeight: 700, color: dark, lineHeight: 1.1 }}>{lastName}</div>
            <div style={{ fontSize: fs - 1, color: accent, marginTop: 4 }}>{position}</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHeading label={sections?.contact ?? DEFAULT_SECTIONS.contact} />
          {email && <div style={{ fontSize: fs - 2, color: body, marginBottom: 4 }}>✉ {email}</div>}
          {phone && <div style={{ fontSize: fs - 2, color: body, marginBottom: 4 }}>☎ {phone}</div>}
          {city && <div style={{ fontSize: fs - 2, color: body, marginBottom: 4 }}>📍 {city}</div>}
          {linkedin && <div style={{ fontSize: fs - 2, color: body, wordBreak: 'break-all' }}>in {linkedin}</div>}
          {!email && !phone && !city && !linkedin && <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHeading label={sections?.skills ?? DEFAULT_SECTIONS.skills} />
          {skills.length > 0
            ? skills.slice(0, 8).map((s, i) => (
                <div key={i} style={{ fontSize: fs - 2, color: body, marginBottom: 4, paddingLeft: 8 }}>• {s}</div>
              ))
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHeading label={sections?.languages ?? DEFAULT_SECTIONS.languages} />
          {languages
            ? <div style={{ fontSize: fs - 2, color: body }}>{languages}</div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHeading label={sections?.education ?? DEFAULT_SECTIONS.education} />
          {eduEntries.length > 0
            ? eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: fs, color: dark }}>{e.degree}</div>
                  {e.institution && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: accent }}>{e.institution}</div>}
                  {e.period && <div style={{ fontSize: fs - 2, color: accent, fontWeight: 600 }}>{e.period}</div>}
                </div>
              ))
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: fs + 2, fontWeight: 700, color: dark, marginBottom: 4, fontFamily: 'Georgia', textTransform: 'uppercase', letterSpacing: 1 }}>{sections?.profile ?? DEFAULT_SECTIONS.profile}</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${accent}`, marginBottom: 8 }} />
          {profile
            ? <div style={{ fontSize: fs - 1, color: body, lineHeight: ls }}>{profile}</div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <div style={{ fontSize: fs + 2, fontWeight: 700, color: dark, marginBottom: 4, fontFamily: 'Georgia', textTransform: 'uppercase', letterSpacing: 1 }}>{sections?.experience ?? DEFAULT_SECTIONS.experience}</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${accent}`, marginBottom: 8 }} />
          {expEntries.length > 0
            ? expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: fs, color: dark }}>{e.title}</div>
                  {e.company && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: accent }}>{e.company}</div>}
                  {e.period && <div style={{ fontSize: fs - 2, color: accent, fontWeight: 600 }}>{e.period}</div>}
                  {e.description && <div style={{ fontSize: fs - 1, color: body, lineHeight: ls, marginTop: 2, whiteSpace: 'pre-wrap' }}>{e.description}</div>}
                </div>
              ))
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
