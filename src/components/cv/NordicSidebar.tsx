'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

function InitialsAvatar({ firstName, lastName, size = 80, color = '#8B7355' }: { firstName: string; lastName: string; size?: number; color?: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function SidebarHead({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 1, backgroundColor: accent, marginTop: 3, opacity: 0.4 }} />
    </div>
  )
}

function MainHead({ label, accent, dark }: { label: string; accent: string; dark: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: dark, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 1, backgroundColor: accent, marginTop: 3, opacity: 0.5 }} />
    </div>
  )
}

function DescBullets({ text, fs, ls, color }: { text: string; fs: number; ls: number; color: string }) {
  const lines = text.split('\n').map(l => l.trim().replace(/^[•\-–*]\s*/, '')).filter(Boolean)
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 8, color, marginTop: 3, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: fs - 1, color, lineHeight: ls }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

export default function NordicSidebar({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const accent  = '#8B7355'
  const dark    = '#3D2B1F'
  const body    = '#5C4033'
  const divider = '#C4AA8E'
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  return (
    <div style={{ width: 794, height: 1123, display: 'flex', fontFamily, fontSize: fs, lineHeight: ls, backgroundColor: '#fff', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '32%', backgroundColor: '#F5EDE3', padding: '32px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${divider}` }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={88} color={accent} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: dark, lineHeight: 1.2, fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>{firstName} {lastName}</div>
            {position && <div style={{ fontSize: 11, color: accent, marginTop: 5, fontWeight: 500 }}>{position}</div>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHead label={sections?.contact ?? DEFAULT_SECTIONS.contact} accent={accent} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {email        && <div style={{ fontSize: 10, color: body }}>✉ {email}</div>}
            {phone        && <div style={{ fontSize: 10, color: body }}>☎ {phone}</div>}
            {locationLine && <div style={{ fontSize: 10, color: body }}>📍 {locationLine}</div>}
            {linkedin     && <div style={{ fontSize: 10, color: body, wordBreak: 'break-all' }}>in {linkedin}</div>}
            {!email && !phone && !locationLine && !linkedin && <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} accent={accent} />
          {skills.length > 0
            ? skills.slice(0, 8).map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: body, marginBottom: 4, paddingLeft: 8 }}>• {s}</div>
              ))
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} accent={accent} />
          {languages
            ? <div style={{ fontSize: 10, color: body }}>{languages}</div>
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: 0 }} />

        <div>
          <SidebarHead label={sections?.education ?? DEFAULT_SECTIONS.education} accent={accent} />
          {eduEntries.length > 0
            ? eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>{e.degree}</div>
                  {e.institution && <div style={{ fontSize: 10, color: accent, fontStyle: 'italic', marginTop: 1 }}>{e.institution}</div>}
                  {e.period && <div style={{ fontSize: 10, color: accent, fontWeight: 600, marginTop: 1 }}>{e.period}</div>}
                </div>
              ))
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {profile && (
          <div>
            <MainHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} accent={accent} dark={dark} />
            <div style={{ fontSize: fs - 1, color: body, lineHeight: ls }}>{profile}</div>
          </div>
        )}

        <div>
          <MainHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} accent={accent} dark={dark} />
          {expEntries.length > 0
            ? expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{e.title}</div>
                      {e.company && <div style={{ fontSize: 12, color: accent, fontStyle: 'italic', marginTop: 1 }}>{e.company}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: accent, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                  </div>
                  {e.description && <DescBullets text={e.description} fs={fs} ls={ls} color={body} />}
                </div>
              ))
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
