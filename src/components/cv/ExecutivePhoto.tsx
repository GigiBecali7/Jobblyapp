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

function ProgressBar({ label, pct = 80 }: { label: string; pct?: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span>{label}</span><span style={{ color: '#1B2E6B' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, backgroundColor: '#1B2E6B', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function ExecutivePhoto({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const navy = '#1B2E6B'
  const visibleSkills = skills.slice(0, 8)

  const SectionHeading = ({ label }: { label: string }) => (
    <div style={{ fontSize: fs, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `2px solid ${navy}`, paddingBottom: 4, marginBottom: 8 }}>{label}</div>
  )

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily, fontSize: fs, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', height: 200 }}>
        {/* Left header */}
        <div style={{ flex: 1, backgroundColor: navy, padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: fs + 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 2 }}>{firstName}</div>
          <div style={{ fontSize: fs + 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1, letterSpacing: 2 }}>{lastName}</div>
          <div style={{ fontSize: fs, color: '#8BA3D4', marginTop: 6 }}>{position}</div>
        </div>
        {/* Photo right */}
        <div style={{ width: '40%', overflow: 'hidden' }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} />
          }
        </div>
      </div>

      {/* Contact bar */}
      <div style={{ backgroundColor: '#F0F3FA', padding: '10px 28px', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: fs - 2, color: navy }}>
        {email && <span>✉ {email}</span>}
        {phone && <span>☎ {phone}</span>}
        {city && <span>📍 {city}</span>}
        {linkedin && <span>in {linkedin}</span>}
        {!email && !phone && !city && !linkedin && <span style={{ color: '#bbb', fontStyle: 'italic' }}>—</span>}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '24px 28px', gap: 28 }}>
        {/* Left */}
        <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <SectionHeading label={sections?.skills ?? DEFAULT_SECTIONS.skills} />
            {visibleSkills.length > 0
              ? visibleSkills.map((s, i) => <ProgressBar key={i} label={s} pct={Math.max(60, 95 - i * 7)} />)
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionHeading label={sections?.languages ?? DEFAULT_SECTIONS.languages} />
            {languages
              ? <div style={{ fontSize: fs - 1, color: '#444' }}>{languages}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionHeading label={sections?.education ?? DEFAULT_SECTIONS.education} />
            {eduEntries.length > 0
              ? eduEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: fs, color: navy }}>{e.degree}</div>
                    {e.institution && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: '#4A6FA5' }}>{e.institution}</div>}
                    {e.period && <div style={{ fontSize: fs - 2, color: navy, fontWeight: 600 }}>{e.period}</div>}
                  </div>
                ))
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
        {/* Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <SectionHeading label={sections?.profile ?? DEFAULT_SECTIONS.profile} />
            {profile
              ? <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
          <div>
            <SectionHeading label={sections?.experience ?? DEFAULT_SECTIONS.experience} />
            {expEntries.length > 0
              ? expEntries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: fs, color: navy }}>{e.title}</div>
                    {e.company && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: '#4A6FA5' }}>{e.company}</div>}
                    {e.period && <div style={{ fontSize: fs - 2, color: navy, fontWeight: 600 }}>{e.period}</div>}
                    {e.description && <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls, marginTop: 2, whiteSpace: 'pre-wrap' }}>{e.description}</div>}
                  </div>
                ))
              : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
