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

function SectionHead({ label, navy }: { label: string; navy: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'inherit' }}>{label}</div>
      <div style={{ height: 1, backgroundColor: navy, marginTop: 3, opacity: 0.5 }} />
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

export default function NordicMinimal({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const navy = '#1B2E6B'
  const sidebarBg = '#F0F0F0'
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#FAFAFA', fontFamily, fontSize: fs, lineHeight: ls, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '30%', backgroundColor: sidebarBg, padding: '36px 18px', display: 'flex', flexDirection: 'column', gap: 22, borderRight: '1px solid #E0E0E0' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 80, height: 80, borderRadius: 4, objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={80} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2, fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>{firstName} {lastName}</div>
            {position && <div style={{ fontSize: 11, color: navy, marginTop: 5, fontWeight: 500 }}>{position}</div>}
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionHead label={sections?.contact ?? DEFAULT_SECTIONS.contact} navy={navy} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {email        && <div style={{ fontSize: 10, color: '#444' }}>{email}</div>}
            {phone        && <div style={{ fontSize: 10, color: '#444' }}>{phone}</div>}
            {locationLine && <div style={{ fontSize: 10, color: '#444' }}>{locationLine}</div>}
            {linkedin     && <div style={{ fontSize: 10, color: '#444', wordBreak: 'break-all' }}>{linkedin}</div>}
            {!email && !phone && !locationLine && !linkedin && <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        {/* Skills */}
        <div>
          <SectionHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} navy={navy} />
          {skills.length > 0
            ? skills.slice(0, 10).map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: '#444', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>
              ))
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        {/* Languages */}
        <div>
          <SectionHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} navy={navy} />
          {languages
            ? <div style={{ fontSize: 10, color: '#444' }}>{languages}</div>
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '36px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile */}
        {profile && (
          <div>
            <SectionHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} navy={navy} />
            <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls }}>{profile}</div>
          </div>
        )}

        {/* Experience */}
        <div>
          <SectionHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} navy={navy} />
          {expEntries.length > 0
            ? <div>
                {expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{e.title}</div>
                        {e.company && <div style={{ fontSize: 12, color: navy, fontStyle: 'italic', marginTop: 1 }}>{e.company}</div>}
                      </div>
                      {e.period && <div style={{ fontSize: 10, color: navy, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                    </div>
                    {e.description && <DescBullets text={e.description} fs={fs} ls={ls} color="#333" />}
                  </div>
                ))}
              </div>
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        {/* Education */}
        <div>
          <SectionHead label={sections?.education ?? DEFAULT_SECTIONS.education} navy={navy} />
          {eduEntries.length > 0
            ? <div>
                {eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{e.degree}</div>
                        {e.institution && <div style={{ fontSize: 12, color: navy, fontStyle: 'italic', marginTop: 1 }}>{e.institution}</div>}
                      </div>
                      {e.period && <div style={{ fontSize: 10, color: navy, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                    </div>
                  </div>
                ))}
              </div>
            : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
