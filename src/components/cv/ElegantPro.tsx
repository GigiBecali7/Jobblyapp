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
const L_PAD    = 22
const R_PAD    = 30
const LANG_BAR = LEFT_W - L_PAD * 2   // 234

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
function LeftHead({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: 'inherit' }}>{label}</div>
      <div style={{ height: 1.5, backgroundColor: NAVY, marginTop: 4, opacity: 0.3 }} />
    </div>
  )
}

function RightHead({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8, fontWeight: 800, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: 'inherit' }}>{label}</div>
        <div style={{ height: 1.5, backgroundColor: NAVY, marginTop: 3, opacity: 0.3 }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ElegantPro({
  firstName, lastName, email, phone, city, address, zipCode, linkedin, photoUrl,
  position, profile, experience, education, skills, languages,
  certifications, drivingLicense, nationality, dateOfBirth, availability,
  fontFamily = 'Inter', sections,
}: CVProps) {
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
    <div style={{ width: 794, height: 1123, backgroundColor: '#fff', fontFamily: ff, overflow: 'hidden', position: 'relative' }}>

      {/* ── HEADER ── */}
      <div style={{ width: 794, height: HEADER_H, backgroundColor: NAVY, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 26, flexShrink: 0 }}>
        {photoUrl ? (
          <img src={photoUrl} alt="photo" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.28)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: '3px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>{initials || '?'}</span>
          </div>
        )}
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', textTransform: 'uppercase' as const, lineHeight: 1.05, letterSpacing: '-0.5px', fontFamily: 'inherit' }}>
            {firstName} {lastName}
          </div>
          {position && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', marginTop: 8, textTransform: 'uppercase' as const, letterSpacing: '2.5px', fontWeight: 500, fontFamily: 'inherit' }}>
              {position}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', width: 794, height: 1123 - HEADER_H, overflow: 'hidden' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ width: LEFT_W, flexShrink: 0, backgroundColor: '#F2F4F7', padding: `22px ${L_PAD}px`, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'hidden' }}>

          {/* Kontakt */}
          <div>
            <LeftHead label={sections?.contact ?? DEFAULT_SECTIONS.contact} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(address || zipCode || city) && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, flexShrink: 0, width: 14 }}>📍</span>
                  <span style={{ fontSize: 10, color: '#444', lineHeight: 1.5, fontFamily: 'inherit' }}>
                    {[address, [zipCode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {phone && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, flexShrink: 0, width: 14 }}>📞</span>
                  <span style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>{phone}</span>
                </div>
              )}
              {email && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, flexShrink: 0, width: 14 }}>✉️</span>
                  <span style={{ fontSize: 10, color: '#444', wordBreak: 'break-all', fontFamily: 'inherit' }}>{email}</span>
                </div>
              )}
              {linkedin && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, flexShrink: 0, width: 14 }}>🔗</span>
                  <span style={{ fontSize: 10, color: '#444', wordBreak: 'break-all', fontFamily: 'inherit' }}>{linkedin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sprachen */}
          {langEntries.length > 0 && (
            <div>
              <LeftHead label={sections?.languages ?? DEFAULT_SECTIONS.languages} />
              {langEntries.map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3, fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>{l.name}</span>
                    {l.level && <span style={{ color: '#888', fontSize: 9 }}>{l.level}</span>}
                  </div>
                  <div style={{ height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, width: LANG_BAR }}>
                    <div style={{ height: '100%', width: Math.round((l.pct / 100) * LANG_BAR), backgroundColor: NAVY, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kenntnisse */}
          {skills.length > 0 && (
            <div>
              <LeftHead label={sections?.skills ?? DEFAULT_SECTIONS.skills} />
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
              <LeftHead label="Weitere Angaben" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {dateOfBirth && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Geb.: </span>{dateOfBirth}
                  </div>
                )}
                {nationality && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Nationalität: </span>{nationality}
                  </div>
                )}
                {drivingLicense && drivingLicense !== 'Kein' && drivingLicense !== '' && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Führerschein: </span>{drivingLicense}
                  </div>
                )}
                {availability && (
                  <div style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 600, color: '#555' }}>Verfügbar: </span>{availability}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ width: RIGHT_W, flexShrink: 0, backgroundColor: '#fff', padding: `22px ${R_PAD}px`, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'hidden' }}>

          {/* Zusammenfassung / Profil */}
          {profile && (
            <div>
              <RightHead label={sections?.profile ?? DEFAULT_SECTIONS.profile} icon="👤" />
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.65, fontFamily: 'inherit' }}>{profile}</div>
            </div>
          )}

          {/* Ausbildung */}
          {eduEntries.length > 0 && (
            <div>
              <RightHead label={sections?.education ?? DEFAULT_SECTIONS.education} icon="🎓" />
              {eduEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit' }}>{e.degree}</div>
                      {e.institution && <div style={{ fontSize: 11, color: NAVY, fontStyle: 'italic', marginTop: 1, fontFamily: 'inherit' }}>{e.institution}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{e.period}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Berufserfahrung */}
          {expEntries.length > 0 && (
            <div>
              <RightHead label={sections?.experience ?? DEFAULT_SECTIONS.experience} icon="💼" />
              {expEntries.map((e, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  {i > 0 && <div style={{ height: 1, backgroundColor: '#eee', marginBottom: 10 }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit' }}>{e.title}</div>
                      {e.company && <div style={{ fontSize: 11, color: NAVY, fontStyle: 'italic', marginTop: 1, fontFamily: 'inherit' }}>{e.company}</div>}
                    </div>
                    {e.period && <div style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit' }}>{e.period}</div>}
                  </div>
                  {e.description && (
                    <div style={{ marginTop: 4 }}>
                      {e.description.split('\n').map(l => l.trim().replace(/^[•\-–*▸]\s*/, '')).filter(Boolean).map((line, li) => (
                        <div key={li} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 3 }}>
                          <span style={{ fontSize: 9, color: NAVY, flexShrink: 0, marginTop: 3, fontFamily: 'inherit' }}>▸</span>
                          <span style={{ fontSize: 10, color: '#444', lineHeight: 1.55, fontFamily: 'inherit' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Zertifikate & Kurse */}
          {certLines.length > 0 && (
            <div>
              <RightHead label="Zertifikate & Kurse" icon="🏆" />
              {certLines.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: NAVY, flexShrink: 0, marginTop: 3 }}>•</span>
                  <span style={{ fontSize: 10, color: '#444', fontFamily: 'inherit' }}>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* Closing line */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic', textAlign: 'center', fontFamily: 'inherit' }}>
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
