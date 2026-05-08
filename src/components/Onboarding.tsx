'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'

const C = {
  bg: '#0D1117', border: 'rgba(255,255,255,0.08)', navy: '#1B2E6B',
  navy2: '#253A85', navy3: '#93AFFD', mid: '#8892A4', white: '#fff',
  success: '#4ADE80', purple: '#7C3AED',
}

const INDUSTRIES = [
  { id: 'tech', icon: '💻', label: 'IT & Technologie' },
  { id: 'finance', icon: '💰', label: 'Finanzen & Banking' },
  { id: 'marketing', icon: '📣', label: 'Marketing & Sales' },
  { id: 'healthcare', icon: '🏥', label: 'Gesundheit & Medizin' },
  { id: 'engineering', icon: '⚙️', label: 'Ingenieurwesen' },
  { id: 'education', icon: '🎓', label: 'Bildung & Forschung' },
  { id: 'creative', icon: '🎨', label: 'Design & Kreativ' },
  { id: 'logistics', icon: '🚚', label: 'Logistik & Transport' },
  { id: 'other', icon: '🌐', label: 'Andere Branche' },
]

const EXPERIENCE = ['0–1 Jahre', '1–3 Jahre', '3–5 Jahre', '5–10 Jahre', '10+ Jahre']
const WORK_MODELS = [
  { id: 'remote', label: 'Remote', icon: '🏠' },
  { id: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { id: 'office', label: 'Vor Ort', icon: '🏢' },
]

interface Props {
  profile: UserProfile
  onComplete: () => void
}

export default function Onboarding({ profile, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Step 1: Name
  const [firstName, setFirstName] = useState(profile.first_name || '')
  const [lastName, setLastName] = useState(profile.last_name || '')

  // Step 2: Industry
  const [industry, setIndustry] = useState('')

  // Step 3: Position + Experience
  const [position, setPosition] = useState('')
  const [experience, setExperience] = useState('')

  // Step 4: Location + Work model
  const [city, setCity] = useState('')
  const [workModel, setWorkModel] = useState('hybrid')

  const TOTAL = 5

  async function finish() {
    setLoading(true)
    try {
      await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName,
      }).eq('id', profile.id)
      // Extended fields (if columns exist, they'll be saved; otherwise gracefully ignored)
      try {
        await supabase.from('profiles').update({
          industry, position, experience, city, work_model: workModel,
          has_completed_onboarding: true,
        } as Record<string, unknown>).eq('id', profile.id)
      } catch { /* columns may not exist yet */ }
    } finally {
      setLoading(false)
      onComplete()
    }
  }

  const pct = ((step - 1) / (TOTAL - 1)) * 100

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: C.bg, borderRadius: 20, border: `0.5px solid ${C.border}`, width: '100%', maxWidth: 500, padding: '36px 40px' }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.mid, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Schritt {step} von {TOTAL}</span>
            <span style={{ fontSize: 11, color: C.navy3 }}>{Math.round(pct)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.navy}, ${C.purple})`, borderRadius: 4, transition: 'width .4s ease' }} />
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>Willkommen bei Jobbly!</h2>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 28, lineHeight: 1.6 }}>Wie heißt du? Wir personalisieren deine Erfahrung.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Vorname *</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Max" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Nachname</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mustermann" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            <button onClick={() => { if (firstName.trim()) setStep(2) }} disabled={!firstName.trim()} style={{ width: '100%', padding: 13, borderRadius: 10, background: firstName.trim() ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: firstName.trim() ? C.white : C.mid, border: 'none', cursor: firstName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
              Weiter →
            </button>
          </div>
        )}

        {/* Step 2: Industry */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>In welcher Branche suchst du?</h2>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 24 }}>Wir zeigen dir die passendsten Jobs.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {INDUSTRIES.map(ind => (
                <button key={ind.id} onClick={() => setIndustry(ind.id)} style={{ padding: '12px 8px', borderRadius: 10, border: `0.5px solid ${industry === ind.id ? C.navy2 : 'rgba(255,255,255,0.08)'}`, background: industry === ind.id ? 'rgba(27,46,107,0.3)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{ind.icon}</div>
                  <div style={{ fontSize: 10, color: industry === ind.id ? C.navy3 : C.mid, fontWeight: 500, lineHeight: 1.3 }}>{ind.label}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ padding: 12, borderRadius: 10, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
              <button onClick={() => { if (industry) setStep(3) }} disabled={!industry} style={{ padding: 12, borderRadius: 10, background: industry ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: industry ? C.white : C.mid, border: 'none', cursor: industry ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Weiter →</button>
            </div>
          </div>
        )}

        {/* Step 3: Position + Experience */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>Welche Position strebst du an?</h2>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 24 }}>Damit finden wir die besten Matches für dich.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Gewünschte Position</label>
              <input value={position} onChange={e => setPosition(e.target.value)} placeholder="z.B. Product Manager, Data Analyst..." style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 10, fontWeight: 500 }}>Berufserfahrung</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EXPERIENCE.map(e => (
                  <button key={e} onClick={() => setExperience(e)} style={{ padding: '7px 14px', borderRadius: 20, border: `0.5px solid ${experience === e ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: experience === e ? 'rgba(27,46,107,0.3)' : 'transparent', color: experience === e ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: 12, borderRadius: 10, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
              <button onClick={() => setStep(4)} style={{ padding: 12, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Weiter →</button>
            </div>
          </div>
        )}

        {/* Step 4: Location + Work model */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>Wo möchtest du arbeiten?</h2>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 24 }}>Dein bevorzugter Standort und Arbeitsmodell.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Stadt / Region</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="z.B. Wien, Graz, Berlin..." style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 10, fontWeight: 500 }}>Arbeitsmodell</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {WORK_MODELS.map(m => (
                  <button key={m.id} onClick={() => setWorkModel(m.id)} style={{ flex: 1, padding: '12px 8px', borderRadius: 10, border: `0.5px solid ${workModel === m.id ? C.navy2 : 'rgba(255,255,255,0.08)'}`, background: workModel === m.id ? 'rgba(27,46,107,0.3)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                    <div style={{ fontSize: 11, color: workModel === m.id ? C.navy3 : C.mid, fontWeight: 500 }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setStep(3)} style={{ padding: 12, borderRadius: 10, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
              <button onClick={() => setStep(5)} style={{ padding: 12, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Weiter →</button>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Fast geschafft, {firstName}!</h2>
            <p style={{ fontSize: 14, color: C.mid, marginBottom: 28, lineHeight: 1.7 }}>
              Dein Profil ist bereit. Jobbly sucht jetzt die besten Jobs für dich in <strong style={{ color: C.white }}>{INDUSTRIES.find(i => i.id === industry)?.label || 'deiner Branche'}</strong>.
            </p>
            <div style={{ background: 'rgba(27,46,107,0.15)', border: `0.5px solid rgba(27,46,107,0.35)`, borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
              {[
                { icon: '🔍', text: 'Tägliche Job-Matches' },
                { icon: '⚡', text: '1-Klick Bewerbungen mit KI' },
                { icon: '📄', text: 'Lebenslauf & Anschreiben Generator' },
              ].map(f => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: C.mid }}>
                  <span>{f.icon}</span><span>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={finish} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, #6D28D9)`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700 }}>
              {loading ? 'Wird gespeichert…' : 'Zum Dashboard →'}
            </button>
            <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: C.mid, fontSize: 12, cursor: 'pointer', marginTop: 12, fontFamily: 'inherit' }}>← Zurück</button>
          </div>
        )}
      </div>
    </div>
  )
}
