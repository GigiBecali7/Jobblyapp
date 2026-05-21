'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

// ── Helpers ───────────────────────────────────────────────────────────────────
function levelToPct(level: string): number {
  const l = level.toLowerCase()
  if (l.includes('mutter') || l.includes('native')) return 100
  if (l.includes('fließend') || l.includes('fliessend') || l.includes('c2') || l.includes('c1')) return 90
  if (l.includes('gut') || l.includes('b2')) return 75
  if (l.includes('a1') || l.includes('a2') || l.includes('b1') || l.includes('grundkenntnisse')) return 50
  return 70
}

interface LangParsed { name: string; level: string; pct: number }

function parseLangs(raw: string): LangParsed[] {
  if (!raw?.trim()) return []
  return raw.split(/[,;]\s*|\n/).map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.+?)\s*[\(\[]\s*(.+?)\s*[\)\]]$/)
    if (m) return { name: m[1].trim(), level: m[2].trim(), pct: levelToPct(m[2].trim()) }
    return { name: s, level: '', pct: 70 }
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#1B2E6B', textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: 'inherit' }}>
        {label}
      </div>
      <div style={{ width: 30, height: 2, backgroundColor: '#1B2E6B', marginTop: 4 }} />
    </div>
  )
}

// Right-column content width: 318 - 16 (left pad) - 32 (right pad) = 270px
const BAR_MAX = 270

function SkillBar({ label, pct }: { label: string; pct: number }) {
  const barW = Math.round((pct / 100) * BAR_MAX)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 3, fontFamily: 'inherit' }}>{label}</div>
      <div style={{ height: 5, backgroundColor: '#e0e0e0', borderRadius: 3, width: BAR_MAX }}>
        <div style={{ height: '100%', width: barW, backgroundColor: '#1B2E6B', borderRadius: 3 }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ElegantPro({
  firstName, lastName, email, phone, city, linkedin, photoUrl,
  position, profile, experience, education, skills, languages,
  sections,
}: CVProps) {
  const expEntries = parseExp(experience)
  const eduEntries = parseEdu(education)
  const langEntries = parseLangs(languages)
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily: 'Georgia, serif', overflow: 'hidden', position: 'relative' }}>

      {/* ── LEBENSLAUF badge ── */}
      <div style={{ backgroundColor: '#1B2E6B', padding: '5px 40px', display: 'inline-block' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '3px', fontFamily: 'inherit' }}>
          LEBENSLAUF
        </span>
      </div>

      {/* ── Header: Name + Photo ── */}
      <div style={{ padding: '18px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ paddingRight: 20 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#1a1a1a', textTransform: 'uppercase' as const, letterSpacing: '-1px', lineHeight: 1.0, fontFamily: 'inherit' }}>
            {firstName}
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#1a1a1a', textTransform: 'uppercase' as const, letterSpacing: '-1px', lineHeight: 1.0, marginBottom: 8, fontFamily: 'inherit' }}>
            {lastName}
          </div>
          {position && (
            <div style={{ fontSize: 13, color: '#666', fontWeight: 400, fontStyle: 'italic', fontFamily: 'inherit' }}>{position}</div>
          )}
        </div>

        {/* Photo or initials avatar */}
        {photoUrl ? (
          <img src={photoUrl} alt="photo" style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1B2E6B', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 130, height: 130, borderRadius: '50%', backgroundColor: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid #1B2E6B' }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>{initials || '?'}</span>
          </div>
        )}
      </div>

      {/* ── Divider + Contact row ── */}
      <div style={{ margin: '14px 40px 0', height: 1, backgroundColor: '#e0e0e0' }} />
      <div style={{ padding: '10px 40px', display: 'flex', gap: 24, flexWrap: 'wrap' as const, fontSize: 11, color: '#555', fontFamily: 'inherit' }}>
        {city     && <span>◉ {city}</span>}
        {phone    && <span>✆ {phone}</span>}
        {email    && <span>✉ {email}</span>}
        {linkedin && <span>in {linkedin}</span>}
      </div>
      <div style={{ margin: '0 40px', height: 1, backgroundColor: '#e0e0e0' }} />

      {/* ── Two-column body ── */}
      {/* Fixed pixel widths so html2canvas renders correctly */}
      <div style={{ display: 'flex', overflow: 'hidden' }}>

        {/* Left column — Berufserfahrung (60%) */}
        <div style={{ width: 476, flexShrink: 0, padding: '24px 20px 24px 40px' }}>
          <SectionHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} />

          {expEntries.length > 0 ? (
            <div>
              {expEntries.map((e, i) => (
                <div key={i}>
                  {i > 0 && <div style={{ height: 1, backgroundColor: '#eee', margin: '12px 0' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit', flex: 1, paddingRight: 8 }}>{e.title}</div>
                    {e.period && (
                      <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap' as const, flexShrink: 0, fontFamily: 'inherit' }}>{e.period}</div>
                    )}
                  </div>
                  {e.company && (
                    <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', marginBottom: 5, fontFamily: 'inherit' }}>{e.company}</div>
                  )}
                  {e.description && (
                    <div>
                      {e.description.split('\n').map(l => l.trim().replace(/^[•\-–*▸]\s*/, '')).filter(Boolean).map((line, li) => (
                        <div key={li} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 3 }}>
                          <span style={{ fontSize: 9, color: '#1B2E6B', flexShrink: 0, marginTop: 3, fontFamily: 'inherit' }}>▸</span>
                          <span style={{ fontSize: 11, color: '#444', lineHeight: 1.6, fontFamily: 'inherit' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic', fontFamily: 'inherit' }}>Berufserfahrung ergänzen</div>
          )}
        </div>

        {/* Right column — Ausbildung, Skills, Sprachen, Zitat (40%) */}
        <div style={{ width: 318, flexShrink: 0, padding: '24px 32px 24px 16px', backgroundColor: '#f8f9fa', borderLeft: '1px solid #e8e8e8' }}>

          {/* Ausbildung */}
          {eduEntries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHead label={sections?.education ?? DEFAULT_SECTIONS.education} />
              {eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit', flex: 1, paddingRight: 6 }}>{e.degree}</div>
                    {e.period && (
                      <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap' as const, flexShrink: 0, fontFamily: 'inherit' }}>{e.period}</div>
                    )}
                  </div>
                  {e.institution && (
                    <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', marginTop: 1, fontFamily: 'inherit' }}>{e.institution}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} />
              {skills.slice(0, 8).map((skill, i) => {
                const pct = Math.max(60, 90 - i * 5)
                return <SkillBar key={skill} label={skill} pct={pct} />
              })}
            </div>
          )}

          {/* Sprachen */}
          {langEntries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} />
              {langEntries.map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>{l.name}</span>
                    {l.level && <span style={{ color: '#888', fontSize: 10 }}>{l.level}</span>}
                  </div>
                  <div style={{ height: 5, backgroundColor: '#e0e0e0', borderRadius: 3, width: BAR_MAX }}>
                    <div style={{ height: '100%', width: Math.round((l.pct / 100) * BAR_MAX), backgroundColor: '#1B2E6B', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profil-Zitat */}
          {profile && (
            <div style={{ backgroundColor: 'rgba(27,46,107,0.05)', borderLeft: '3px solid #1B2E6B', padding: '12px 14px', borderRadius: '0 4px 4px 0' }}>
              <div style={{ fontSize: 32, color: '#1B2E6B', opacity: 0.25, lineHeight: 0.8, fontFamily: 'Georgia, serif', marginBottom: 6 }}>❝</div>
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                {profile.slice(0, 200)}{profile.length > 200 ? '…' : ''}
              </div>
              <div style={{ fontSize: 32, color: '#1B2E6B', opacity: 0.25, lineHeight: 0.8, fontFamily: 'Georgia, serif', textAlign: 'right' as const, marginTop: 4 }}>❞</div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
