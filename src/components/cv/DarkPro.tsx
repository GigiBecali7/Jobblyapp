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

function SidebarHead({ label, gold }: { label: string; gold: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 1, backgroundColor: gold, marginTop: 3, opacity: 0.5 }} />
    </div>
  )
}

function MainHead({ label, gold }: { label: string; gold: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{ height: 1, backgroundColor: gold, marginTop: 3, opacity: 0.6 }} />
    </div>
  )
}

function DescBullets({ text, fs, ls }: { text: string; fs: number; ls: number }) {
  const lines = text.split('\n').map(l => l.trim().replace(/^[•\-–*]\s*/, '')).filter(Boolean)
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 8, color: '#aaa', marginTop: 3, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: fs - 1, color: '#ccc', lineHeight: ls }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

function LangBar({ label, pct = 80 }: { label: string; pct?: number }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: '#ccc', marginBottom: 2 }}>{label}</div>
      <div style={{ height: 3, backgroundColor: '#555', borderRadius: 2 }}>
        <div style={{ height: 3, width: `${pct}%`, backgroundColor: '#C9A84C', borderRadius: 2 }} />
      </div>
    </div>
  )
}

export default function DarkPro({ firstName, lastName, email, phone, city, address, zipCode, country, linkedin, photoUrl, position, profile, experience, education, skills, languages, fontFamily = 'Inter', fontSize = 'medium', lineSpacing = 'normal', sections }: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)

  const gold = '#C9A84C'
  const locationLine = address && zipCode ? `${address}, ${zipCode} ${city}${country && country !== 'Österreich' ? ', ' + country : ', Österreich'}` : city

  const langList = languages
    ? languages.split(',').map(l => l.trim()).filter(Boolean)
    : []

  return (
    <div style={{ width: 794, height: 1123, display: 'flex', fontFamily, fontSize: fs, overflow: 'hidden', backgroundColor: '#1E1E1E' }}>
      {/* Sidebar */}
      <div style={{ width: '32%', backgroundColor: '#2A2A2A', padding: '32px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {photoUrl
            ? <img src={photoUrl} alt="photo" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${gold}` }} />
            : <InitialsAvatar firstName={firstName} lastName={lastName} size={84} />
          }
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{firstName} {lastName}</div>
            {position && <div style={{ fontSize: 10, color: gold, marginTop: 5 }}>{position}</div>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #444', margin: 0 }} />

        <div>
          <SidebarHead label={sections?.contact ?? DEFAULT_SECTIONS.contact} gold={gold} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {email        && <div style={{ fontSize: 10, color: '#bbb' }}>✉ {email}</div>}
            {phone        && <div style={{ fontSize: 10, color: '#bbb' }}>☎ {phone}</div>}
            {locationLine && <div style={{ fontSize: 10, color: '#bbb' }}>📍 {locationLine}</div>}
            {linkedin     && <div style={{ fontSize: 10, color: '#bbb', wordBreak: 'break-all' }}>in {linkedin}</div>}
            {!email && !phone && !locationLine && !linkedin && <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</div>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #444', margin: 0 }} />

        <div>
          <SidebarHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} gold={gold} />
          {skills.length > 0
            ? skills.slice(0, 10).map((s, i) => (
                <div key={i} style={{ fontSize: 10, color: '#ccc', marginBottom: 4, paddingLeft: 8 }}>• {s}</div>
              ))
            : <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</div>}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #444', margin: 0 }} />

        <div>
          <SidebarHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} gold={gold} />
          {langList.length > 0
            ? langList.map((l, i) => <LangBar key={i} label={l} pct={Math.max(50, 100 - i * 20)} />)
            : languages
              ? <div style={{ fontSize: 10, color: '#ccc' }}>{languages}</div>
              : <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px 26px', display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#1E1E1E' }}>
        {/* Name in main area */}
        <div style={{ borderBottom: `1px solid ${gold}`, paddingBottom: 12, marginBottom: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{firstName} {lastName}</div>
          {position && <div style={{ fontSize: 12, color: gold, marginTop: 4 }}>{position}</div>}
        </div>

        {profile && (
          <div>
            <MainHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} gold={gold} />
            <div style={{ fontSize: fs - 1, color: '#ddd', lineHeight: ls }}>{profile}</div>
          </div>
        )}

        <div>
          <MainHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} gold={gold} />
          {expEntries.length > 0
            ? expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{e.title}</div>
                      {e.company && <div style={{ fontSize: 11, fontStyle: 'italic', color: gold, marginTop: 1 }}>{e.company}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: gold, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                  </div>
                  {e.description && <DescBullets text={e.description} fs={fs} ls={ls} />}
                </div>
              ))
            : <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</div>}
        </div>

        <div>
          <MainHead label={sections?.education ?? DEFAULT_SECTIONS.education} gold={gold} />
          {eduEntries.length > 0
            ? eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{e.degree}</div>
                      {e.institution && <div style={{ fontSize: 11, fontStyle: 'italic', color: gold, marginTop: 1 }}>{e.institution}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: gold, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2 }}>{e.period}</div>}
                  </div>
                </div>
              ))
            : <div style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>—</div>}
        </div>
      </div>
    </div>
  )
}
