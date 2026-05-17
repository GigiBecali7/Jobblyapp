'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

function InitialsAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40, fontWeight: 700 }}>
      {initials}
    </div>
  )
}

function SectionHead({ label, navy }: { label: string; navy: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 2, backgroundColor: navy, marginTop: 3 }} />
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

function ProgressBar({ label, pct = 80, navy }: { label: string; pct?: number; navy: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
        <span style={{ color: '#333' }}>{label}</span>
        <span style={{ color: navy, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 3, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
        <div style={{ height: 3, width: `${pct}%`, backgroundColor: navy, borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function ExecutivePhoto({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const navy = '#1B2E6B'
  const accent = '#4A6FA5'
  const visibleSkills = skills.slice(0, 8)
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', height: 190 }}>
        <div style={{ flex: 1, backgroundColor: navy, padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 1 }}>{firstName}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 1 }}>{lastName}</div>
          {position && <div style={{ fontSize: 12, color: '#8BA3D4', marginTop: 7 }}>{position}</div>}
        </div>
        <div style={{ width: '38%', overflow: 'hidden' }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} />
          }
        </div>
      </div>

      {/* Contact bar */}
      <div style={{ backgroundColor: '#F0F3FA', padding: '9px 28px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 10, color: navy }}>
        {email        && <span>✉ {email}</span>}
        {phone        && <span>☎ {phone}</span>}
        {locationLine && <span>📍 {locationLine}</span>}
        {linkedin     && <span>in {linkedin}</span>}
        {!email && !phone && !locationLine && !linkedin && <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '22px 28px', gap: 28 }}>
        {/* Left */}
        <div style={{ width: '36%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <SectionHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} navy={navy} />
            {visibleSkills.length > 0
              ? visibleSkills.map((s, i) => <ProgressBar key={i} label={s} pct={Math.max(60, 95 - i * 7)} navy={navy} />)
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} navy={navy} />
            {languages
              ? <div style={{ fontSize: 11, color: '#444' }}>{languages}</div>
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionHead label={sections?.education ?? DEFAULT_SECTIONS.education} navy={navy} />
            {eduEntries.length > 0
              ? eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: navy }}>{e.degree}</div>
                    {e.institution && <div style={{ fontSize: 10, fontStyle: 'italic', color: accent, marginTop: 1 }}>{e.institution}</div>}
                    {e.period && <div style={{ fontSize: 10, color: navy, fontWeight: 600, marginTop: 1 }}>{e.period}</div>}
                  </div>
                ))
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profile && (
            <div>
              <SectionHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} navy={navy} />
              <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
            </div>
          )}
          <div>
            <SectionHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} navy={navy} />
            {expEntries.length > 0
              ? expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: navy }}>{e.title}</div>
                        {e.company && <div style={{ fontSize: 11, fontStyle: 'italic', color: accent, marginTop: 1 }}>{e.company}</div>}
                      </div>
                      {e.period && <div style={{ fontSize: 10, color: navy, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                    </div>
                    {e.description && <DescBullets text={e.description} fs={fs} ls={ls} color="#444" />}
                  </div>
                ))
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
