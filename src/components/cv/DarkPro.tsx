'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

function InitialsAvatar({ firstName, lastName, size = 80 }: { firstName: string; lastName: string; size?: number }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#555', border: '3px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function StarRating({ label, stars = 4 }: { label: string; stars?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#ccc' }}>{label}</span>
      <span style={{ color: '#C9A84C', fontSize: 10 }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
    </div>
  )
}

function LangBar({ label, pct = 80 }: { label: string; pct?: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>{label}</div>
      <div style={{ height: 4, backgroundColor: '#555', borderRadius: 2 }}>
        <div style={{ height: 4, width: `${pct}%`, backgroundColor: '#C9A84C', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function DarkPro({ firstName, lastName, email, phone, city, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.5, relaxed: 1.8 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const gold = '#C9A84C'

  const langList = languages
    ? languages.split(',').map(l => l.trim()).filter(Boolean)
    : []

  return (
    <div style={{ width: 794, height: 1123, display: 'flex', fontFamily, fontSize: fs, overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Sidebar */}
      <div style={{ width: '33%', backgroundColor: '#3D3D3D', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${gold}` }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={88} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: fs + 2, fontWeight: 800, color: '#fff' }}>{firstName} {lastName}</div>
            <div style={{ fontSize: fs - 2, color: gold, marginTop: 3 }}>{position}</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #555', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.contact ?? DEFAULT_SECTIONS.contact}</div>
          {email && <div style={{ fontSize: fs - 3, color: '#bbb', marginBottom: 4 }}>✉ {email}</div>}
          {phone && <div style={{ fontSize: fs - 3, color: '#bbb', marginBottom: 4 }}>☎ {phone}</div>}
          {city && <div style={{ fontSize: fs - 3, color: '#bbb', marginBottom: 4 }}>📍 {city}</div>}
          {linkedin && <div style={{ fontSize: fs - 3, color: '#bbb', wordBreak: 'break-all' }}>in {linkedin}</div>}
          {!email && !phone && !city && !linkedin && <div style={{ fontSize: fs - 2, color: '#666', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #555', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.skills ?? DEFAULT_SECTIONS.skills}</div>
          {skills.length > 0
            ? skills.map((s, i) => <StarRating key={i} label={s} stars={Math.max(3, 5 - (i % 3))} />)
            : <div style={{ fontSize: fs - 2, color: '#666', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #555', margin: 0 }} />

        <div>
          <div style={{ fontSize: fs - 2, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{sections?.languages ?? DEFAULT_SECTIONS.languages}</div>
          {langList.length > 0
            ? langList.map((l, i) => <LangBar key={i} label={l} pct={Math.max(50, 100 - i * 20)} />)
            : languages
              ? <div style={{ fontSize: fs - 3, color: '#ccc' }}>{languages}</div>
              : <div style={{ fontSize: fs - 2, color: '#666', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: fs + 6, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.1 }}>{firstName} {lastName}</div>
          <div style={{ fontSize: fs, color: gold, marginTop: 2 }}>{position}</div>
        </div>
        <hr style={{ border: 'none', borderTop: `2px solid ${gold}`, margin: 0 }} />

        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#3D3D3D', borderBottom: `2px solid ${gold}`, paddingBottom: 4, marginBottom: 8 }}>◈ {sections?.profile ?? DEFAULT_SECTIONS.profile}</div>
          {profile
            ? <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls }}>{profile}</div>
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#3D3D3D', borderBottom: `2px solid ${gold}`, paddingBottom: 4, marginBottom: 8 }}>◈ {sections?.experience ?? DEFAULT_SECTIONS.experience}</div>
          {expEntries.length > 0
            ? expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: fs, color: '#2D2D2D' }}>{e.title}</div>
                  {e.company && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: gold }}>{e.company}</div>}
                  {e.period && <div style={{ fontSize: fs - 2, color: gold, fontWeight: 600 }}>{e.period}</div>}
                  {e.description && <div style={{ fontSize: fs - 1, color: '#444', lineHeight: ls, marginTop: 2, whiteSpace: 'pre-wrap' }}>{e.description}</div>}
                </div>
              ))
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <div style={{ fontSize: fs, fontWeight: 700, color: '#3D3D3D', borderBottom: `2px solid ${gold}`, paddingBottom: 4, marginBottom: 8 }}>◈ {sections?.education ?? DEFAULT_SECTIONS.education}</div>
          {eduEntries.length > 0
            ? eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: fs, color: '#2D2D2D' }}>{e.degree}</div>
                  {e.institution && <div style={{ fontStyle: 'italic', fontSize: fs - 1, color: gold }}>{e.institution}</div>}
                  {e.period && <div style={{ fontSize: fs - 2, color: gold, fontWeight: 600 }}>{e.period}</div>}
                </div>
              ))
            : <div style={{ fontSize: fs - 2, color: '#bbb', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
