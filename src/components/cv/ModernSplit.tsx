'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#B8B5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, border: '3px solid #fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function SectionHead({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 2, backgroundColor: accent, marginTop: 3, opacity: 0.35, borderRadius: 1 }} />
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

export default function ModernSplit({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const accent   = '#7B78CC'
  const lavender = '#B8B5E8'
  const dark     = '#2D2D2D'
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, lineHeight: ls, overflow: 'hidden', position: 'relative' }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', backgroundColor: lavender, opacity: 0.3 }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: lavender, opacity: 0.25 }} />

      {/* Header */}
      <div style={{ padding: '36px 40px 20px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1, borderBottom: `1px solid ${lavender}` }}>
        {photoUrl
          ? <img src={photoUrl} alt="photo" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${lavender}`, flexShrink: 0 }} />
          : <InitialsAvatar firstName={firstName} lastName={lastName} size={80} />
        }
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: dark, lineHeight: 1.1 }}>{firstName} {lastName}</div>
          {position && <div style={{ fontSize: 13, color: accent, marginTop: 4, fontWeight: 500 }}>{position}</div>}
          <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap', fontSize: 10, color: '#666' }}>
            {email        && <span>{email}</span>}
            {phone        && <span>{phone}</span>}
            {locationLine && <span>{locationLine}</span>}
            {linkedin     && <span>{linkedin}</span>}
          </div>
        </div>
      </div>

      {/* Body columns */}
      <div style={{ display: 'flex', padding: '20px 40px', gap: 28 }}>
        {/* Left column */}
        <div style={{ width: '36%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Skills */}
          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: '14px 14px' }}>
            <SectionHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} accent={accent} />
            {skills.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {skills.slice(0, 10).map((s, i) => (
                    <span key={i} style={{ background: lavender, color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>

          {/* Languages */}
          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: '14px 14px' }}>
            <SectionHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} accent={accent} />
            {languages
              ? <div style={{ fontSize: 11, color: '#444' }}>{languages}</div>
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>

          {/* Education */}
          <div style={{ backgroundColor: '#F4F3FC', borderRadius: 8, padding: '14px 14px' }}>
            <SectionHead label={sections?.education ?? DEFAULT_SECTIONS.education} accent={accent} />
            {eduEntries.length > 0
              ? eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: dark }}>{e.degree}</div>
                    {e.institution && <div style={{ fontSize: 10, fontStyle: 'italic', color: accent, marginTop: 1 }}>{e.institution}</div>}
                    {e.period && <div style={{ fontSize: 10, color: accent, marginTop: 1 }}>{e.period}</div>}
                  </div>
                ))
              : <div style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profile && (
            <div>
              <SectionHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} accent={accent} />
              <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
            </div>
          )}

          <div>
            <SectionHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} accent={accent} />
            {expEntries.length > 0
              ? expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: dark }}>{e.title}</div>
                        {e.company && <div style={{ fontSize: 11, fontStyle: 'italic', color: accent, marginTop: 1 }}>{e.company}</div>}
                      </div>
                      {e.period && <div style={{ fontSize: 10, color: accent, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
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
