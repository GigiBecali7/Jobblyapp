'use client'
import React from 'react'
import type { CVProps } from './types'
import { DEFAULT_SECTIONS } from './types'
import { parseExp, parseEdu } from './parse'

// ── Constants ─────────────────────────────────────────────────────────────────
const NAVY     = '#1B2E6B'
const HEADER_H = 185
const LEFT_W   = 278
const RIGHT_W  = 516   // 794 - 278
const L_PAD    = 20
const R_PAD    = 28
const LANG_BAR = LEFT_W - L_PAD * 2   // 238

// ── Language helpers ──────────────────────────────────────────────────────────
function levelToPct(level: string): number {
  const l = level.toLowerCase()
  if (l.includes('mutter') || l.includes('native'))                                               return 100
  if (l.includes('fließend') || l.includes('fliessend') || l.includes('c2') || l.includes('c1')) return 90
  if (l.includes('gut') || l.includes('b2'))                                                      return 75
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
function SectionHead({ label, navy }: { label: string; navy: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: navy, textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: 'inherit' }}>{label}</div>
      <div style={{ height: 1, backgroundColor: navy, marginTop: 4, opacity: 0.4 }} />
    </div>
  )
}

function DescBullets({ text, fs, ls, color }: { text: string; fs: number; ls: number; color: string }) {
  const lines = text.split('\n').map(l => l.trim().replace(/^[•\-–*▸]\s*/, '')).filter(Boolean)
  return (
    <div style={{ marginTop: 4 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 8, color, marginTop: 3, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: fs - 1, color, lineHeight: ls, fontFamily: 'inherit' }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NordicMinimal({
  firstName, lastName, email, phone, city, address, zipCode, linkedin, photoUrl,
  position, profile, experience, education, skills, languages,
  certifications, drivingLicense, nationality, dateOfBirth, availability,
  fontFamily = 'Georgia', fontSize = 'medium', lineSpacing = 'normal', sections,
}: CVProps) {
  const fsMap = { small: 11, medium: 13, large: 15 }
  const lsMap = { compact: 1.3, normal: 1.6, relaxed: 1.9 }
  const fs = fsMap[fontSize]
  const ls = lsMap[lineSpacing]

  const expEntries  = parseExp(experience)
  const eduEntries  = parseEdu(education)
  const langEntries = parseLangs(languages)
  const initials    = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  const now          = new Date()
  const closingMonth = now.toLocaleString('de-AT', { month: 'long' })
  const closingYear  = now.getFullYear()
  const closingCity  = city || 'Wien'

  const certLines  = certifications?.trim().split('\n').map(l => l.trim()).filter(Boolean) || []
  const hasWeitere = !!(dateOfBirth || (drivingLicense && drivingLicense !== 'Kein' && drivingLicense !== '') || nationality || availability)

  const ff = fontFamily === 'Georgia' ? 'Georgia, serif'
    : fontFamily === 'Playfair Display' ? '"Playfair Display", Georgia, serif'
    : `${fontFamily}, sans-serif`

  return (
    <div style={{ width: 794, height: 1123, backgroundColor: '#FAFAFA', fontFamily: ff, fontSize: fs, lineHeight: ls, overflow: 'hidden', position: 'relative' }}>

      {/* ── HEADER ── */}
      <div style={{ width: 794, height: HEADER_H, backgroundColor: NAVY, display: 'flex', alignItems: 'center', padding: '0 30px', gap: 24, flexShrink: 0 }}>
        {photoUrl ? (
          <img src={photoUrl} alt="photo" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: '3px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>{initials || '?'}</span>
          </div>
        )}
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px', fontFamily: 'Georgia, serif' }}>
            {firstName} {lastName}
          </div>
          {position && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 8, fontWeight: 400, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
              {position}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', width: 794, height: 1123 - HEADER_H, overflow: 'hidden' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ width: LEFT_W, flexShrink: 0, backgroundColor: '#F0F0F0', padding: `22px ${L_PAD}px`, display: 'flex', flexDirection: 'column', gap: 18, borderRight: '1px solid #E0E0E0', overflowY: 'hidden' }}>

          {/* Kontakt */}
          <div>
            <SectionHead label={sections?.contact ?? DEFAULT_SECTIONS.contact} navy={NAVY} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(address || zipCode || city) && (
                <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                  📍 {[address, [zipCode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                </div>
              )}
              {phone    && <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>✆ {phone}</div>}
              {email    && <div style={{ fontSize: 10, color: '#444', wordBreak: 'break-all', fontFamily: 'inherit' }}>✉ {email}</div>}
              {linkedin && <div style={{ fontSize: 10, color: '#444', wordBreak: 'break-all', fontFamily: 'inherit' }}>in {linkedin}</div>}
            </div>
          </div>

          {/* Sprachen */}
          {langEntries.length > 0 && (
            <div>
              <SectionHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} navy={NAVY} />
              {langEntries.map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: '#333', fontFamily: 'inherit' }}>{l.name}</span>
                    {l.level && <span style={{ color: '#888', fontSize: 9 }}>{l.level}</span>}
                  </div>
                  <div style={{ height: 3, backgroundColor: '#D0D0D0', borderRadius: 2, width: LANG_BAR }}>
                    <div style={{ height: '100%', width: Math.round((l.pct / 100) * LANG_BAR), backgroundColor: NAVY, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kenntnisse */}
          {skills.length > 0 && (
            <div>
              <SectionHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} navy={NAVY} />
              {skills.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 9, color: NAVY, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Weitere Angaben */}
          {hasWeitere && (
            <div>
              <SectionHead label="Weitere Angaben" navy={NAVY} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dateOfBirth && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600 }}>Geb.: </span>{dateOfBirth}
                  </div>
                )}
                {nationality && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600 }}>Nationalität: </span>{nationality}
                  </div>
                )}
                {drivingLicense && drivingLicense !== 'Kein' && drivingLicense !== '' && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600 }}>Führerschein: </span>{drivingLicense}
                  </div>
                )}
                {availability && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600 }}>Verfügbar: </span>{availability}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ width: RIGHT_W, flexShrink: 0, backgroundColor: '#FAFAFA', padding: `22px ${R_PAD}px`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'hidden' }}>

          {/* Profil / Zusammenfassung */}
          {profile && (
            <div>
              <SectionHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} navy={NAVY} />
              <div style={{ fontSize: fs - 1, color: '#333', lineHeight: ls, fontFamily: 'inherit' }}>{profile}</div>
            </div>
          )}

          {/* Ausbildung */}
          {eduEntries.length > 0 && (
            <div>
              <SectionHead label={sections?.education ?? DEFAULT_SECTIONS.education} navy={NAVY} />
              {eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', fontFamily: 'inherit' }}>{e.degree}</div>
                      {e.institution && <div style={{ fontSize: 12, color: NAVY, fontStyle: 'italic', marginTop: 1, fontFamily: 'inherit' }}>{e.institution}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: NAVY, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, fontFamily: 'inherit' }}>{e.period}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Berufserfahrung */}
          {expEntries.length > 0 && (
            <div>
              <SectionHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} navy={NAVY} />
              {expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', fontFamily: 'inherit' }}>{e.title}</div>
                      {e.company && <div style={{ fontSize: 12, color: NAVY, fontStyle: 'italic', marginTop: 1, fontFamily: 'inherit' }}>{e.company}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: NAVY, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2, fontFamily: 'inherit' }}>{e.period}</div>}
                  </div>
                  {e.description && <DescBullets text={e.description} fs={fs} ls={ls} color="#333" />}
                </div>
              ))}
            </div>
          )}

          {/* Zertifikate & Kurse */}
          {certLines.length > 0 && (
            <div>
              <SectionHead label="Zertifikate & Kurse" navy={NAVY} />
              {certLines.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 8, color: NAVY, flexShrink: 0, marginTop: 3 }}>•</span>
                  <span style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* Closing line */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #ddd' }}>
            <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
              Ich freue mich auf ein persönliches Gespräch.
            </div>
            <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4, fontFamily: 'inherit' }}>
              — {firstName} {lastName}, {closingCity}, {closingMonth} {closingYear}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
