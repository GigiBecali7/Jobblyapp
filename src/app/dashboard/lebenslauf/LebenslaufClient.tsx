'use client'
import React, { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { CVDesign, FontFamily, FontSize, LineSpacing } from '@/components/cv/types'
import type { CVProps } from '@/components/cv/types'
import { exportToPDF, exportToWord } from '@/lib/cv-export'
import { createClient } from '@/lib/supabase/client'

const NordicMinimal = dynamic(() => import('@/components/cv/NordicMinimal'), { ssr: false })
const NordicSidebar = dynamic(() => import('@/components/cv/NordicSidebar'), { ssr: false })
const ModernSplit = dynamic(() => import('@/components/cv/ModernSplit'), { ssr: false })
const DarkPro = dynamic(() => import('@/components/cv/DarkPro'), { ssr: false })
const ExecutivePhoto = dynamic(() => import('@/components/cv/ExecutivePhoto'), { ssr: false })
const MonoElegant = dynamic(() => import('@/components/cv/MonoElegant'), { ssr: false })

interface Props {
  isPro: boolean
  existingCVCount: number
  profile: Record<string, unknown> | null
  userId: string
}

const DESIGNS: { id: CVDesign; label: string; desc: string; proOnly: boolean; color: string }[] = [
  { id: 'NordicMinimal', label: 'Nordic Minimal', desc: 'Klar, sauber, zeitlos', proOnly: false, color: '#1B2E6B' },
  { id: 'NordicSidebar', label: 'Nordic Sidebar', desc: 'Beige Sidebar, elegant', proOnly: true, color: '#8B7355' },
  { id: 'ModernSplit', label: 'Modern Split', desc: 'Zweispaltig, luftig', proOnly: true, color: '#7B78CC' },
  { id: 'DarkPro', label: 'Dark Pro', desc: 'Dunkel, professionell', proOnly: true, color: '#C9A84C' },
  { id: 'ExecutivePhoto', label: 'Executive Photo', desc: 'Großes Foto, Führungsebene', proOnly: true, color: '#1B2E6B' },
  { id: 'MonoElegant', label: 'Mono Elegant', desc: 'Minimalistisch, modern', proOnly: true, color: '#333' },
]

const FONT_FAMILIES: FontFamily[] = ['Inter', 'Georgia', 'Playfair Display', 'Roboto', 'Lato', 'Montserrat']

const emptyCV: CVProps = {
  firstName: '', lastName: '', email: '', phone: '', city: '', linkedin: '', photoUrl: '',
  position: '', profile: '', experience: '', education: '', skills: [], languages: '',
  fontFamily: 'Inter', fontSize: 'medium', lineSpacing: 'normal',
}

function CVRenderer({ design, cvProps }: { design: CVDesign; cvProps: CVProps }) {
  switch (design) {
    case 'NordicMinimal': return <NordicMinimal {...cvProps} />
    case 'NordicSidebar': return <NordicSidebar {...cvProps} />
    case 'ModernSplit': return <ModernSplit {...cvProps} />
    case 'DarkPro': return <DarkPro {...cvProps} />
    case 'ExecutivePhoto': return <ExecutivePhoto {...cvProps} />
    case 'MonoElegant': return <MonoElegant {...cvProps} />
    default: return <NordicMinimal {...cvProps} />
  }
}

export default function LebenslaufClient({ isPro, existingCVCount, profile, userId }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedDesign, setSelectedDesign] = useState<CVDesign>('NordicMinimal')
  const [cvData, setCvData] = useState<CVProps>({ ...emptyCV })
  const [skillsInput, setSkillsInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleGenerate() {
    if (!cvData.firstName || !cvData.position) {
      showToast('Bitte Vorname und Stelle ausfüllen.')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: cvData.firstName, lastName: cvData.lastName,
          email: cvData.email, phone: cvData.phone, city: cvData.city,
          linkedin: cvData.linkedin, position: cvData.position,
          experienceRaw: cvData.experience, educationRaw: cvData.education,
          skillsRaw: skillsInput, languagesRaw: cvData.languages,
          photoUrl: cvData.photoUrl,
        }),
      })
      const json = await res.json()
      if (json.cvData) {
        setCvData(prev => ({
          ...prev,
          profile: json.cvData.profile,
          experience: json.cvData.experience,
          education: json.cvData.education,
          skills: json.cvData.skills || [],
          languages: json.cvData.languages,
        }))
        setSkillsInput((json.cvData.skills || []).join(', '))
        showToast('KI-Inhalt erfolgreich generiert!')
      }
    } catch {
      showToast('Generierung fehlgeschlagen.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!isPro && existingCVCount >= 1) {
      showToast('Free-Nutzer können nur 1 Lebenslauf speichern. Upgrade zu Pro!')
      return
    }
    setSaving(true)
    try {
      await supabase.from('applications').insert({
        user_id: userId,
        position: cvData.position || 'Lebenslauf',
        company: null,
        template: selectedDesign,
        style: 'balanced',
        cv_data: {
          profil: cvData.profile,
          erfahrung: cvData.experience,
          ausbildung: cvData.education,
          skills: cvData.skills,
          sprachen: cvData.languages,
          anschreiben: '',
        },
        cover_letter: '',
      })
      showToast('Lebenslauf gespeichert!')
    } catch {
      showToast('Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      await exportToPDF('cv-preview-area', `lebenslauf-${cvData.lastName || 'export'}.pdf`)
    } catch {
      showToast('PDF-Export fehlgeschlagen.')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportWord() {
    try {
      await exportToWord({
        firstName: cvData.firstName, lastName: cvData.lastName,
        email: cvData.email, phone: cvData.phone, city: cvData.city,
        linkedin: cvData.linkedin, position: cvData.position,
        profile: cvData.profile, experience: cvData.experience,
        education: cvData.education, skills: cvData.skills, languages: cvData.languages,
      }, `lebenslauf-${cvData.lastName || 'export'}.docx`)
    } catch {
      showToast('Word-Export fehlgeschlagen.')
    }
  }

  const currentCvProps: CVProps = {
    ...cvData,
    skills: skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : cvData.skills,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: '#1B2E6B', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e9ecef', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <a href="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← Dashboard</a>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Lebenslauf erstellen</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, backgroundColor: step >= s ? '#1B2E6B' : '#e9ecef', color: step >= s ? '#fff' : '#666', cursor: step > s ? 'pointer' : 'default' }} onClick={() => step > s && setStep(s as 1 | 2 | 3)}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* STEP 1: Choose Design */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Design wählen</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>{isPro ? 'Alle Designs verfügbar' : 'Free: Nordic Minimal kostenlos. Upgrade für alle Designs.'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {DESIGNS.map(d => {
                const locked = d.proOnly && !isPro
                return (
                  <div key={d.id} onClick={() => !locked && setSelectedDesign(d.id)} style={{ border: `2px solid ${selectedDesign === d.id ? d.color : '#e9ecef'}`, borderRadius: 12, padding: 20, cursor: locked ? 'not-allowed' : 'pointer', position: 'relative', backgroundColor: locked ? '#fafafa' : '#fff', opacity: locked ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {locked && <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>PRO</div>}
                    <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: d.color, marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{d.label}</div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{d.desc}</div>
                    {selectedDesign === d.id && !locked && <div style={{ marginTop: 8, fontSize: 12, color: d.color, fontWeight: 600 }}>✓ Ausgewählt</div>}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setStep(2)} style={{ backgroundColor: '#1B2E6B', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Weiter →
            </button>
          </div>
        )}

        {/* STEP 2: Fill data */}
        {step === 2 && (
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Deine Daten eingeben</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {([['firstName', 'Vorname *'], ['lastName', 'Nachname'], ['email', 'E-Mail'], ['phone', 'Telefon'], ['city', 'Ort'], ['linkedin', 'LinkedIn URL'], ['position', 'Stelle *'], ['photoUrl', 'Foto URL']] as [keyof CVProps, string][]).map(([field, label]) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>{label}</label>
                    <input value={(cvData[field] as string) || ''} onChange={e => setCvData(prev => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Berufserfahrung</label>
                <textarea value={cvData.experience} onChange={e => setCvData(prev => ({ ...prev, experience: e.target.value }))} rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} placeholder="Beschreibe deine Berufserfahrung..." />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Ausbildung</label>
                <textarea value={cvData.education} onChange={e => setCvData(prev => ({ ...prev, education: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} placeholder="Deine Ausbildung..." />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Kenntnisse (kommagetrennt)</label>
                <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} placeholder="React, TypeScript, Projektmanagement..." />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Sprachen</label>
                <input value={cvData.languages} onChange={e => setCvData(prev => ({ ...prev, languages: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} placeholder="Deutsch (Muttersprache), Englisch (C1)..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={handleGenerate} disabled={generating} style={{ backgroundColor: generating ? '#ccc' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
                  {generating ? '⏳ Generiere...' : '✨ KI generiert Inhalt'}
                </button>
                <button onClick={() => setStep(3)} style={{ backgroundColor: '#1B2E6B', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Vorschau →
                </button>
                <button onClick={() => setStep(1)} style={{ backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, cursor: 'pointer' }}>
                  ← Zurück
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Preview + Export */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Vorschau & Export</h2>
                <p style={{ color: '#666', fontSize: 14 }}>Typografie anpassen und exportieren</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setStep(2)} style={{ backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>← Bearbeiten</button>
                <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Speichern...' : '💾 Speichern'}
                </button>
                <button onClick={handleExportPDF} disabled={exporting} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer' }}>
                  {exporting ? 'Exportiere...' : '📄 PDF'}
                </button>
                <button onClick={handleExportWord} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  📝 Word
                </button>
              </div>
            </div>

            {/* Typography toolbar */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Schriftart</label>
                <select value={cvData.fontFamily} onChange={e => setCvData(prev => ({ ...prev, fontFamily: e.target.value as FontFamily }))} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Schriftgröße</label>
                <select value={cvData.fontSize} onChange={e => setCvData(prev => ({ ...prev, fontSize: e.target.value as FontSize }))} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                  <option value="small">Klein</option>
                  <option value="medium">Mittel</option>
                  <option value="large">Groß</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Zeilenabstand</label>
                <select value={cvData.lineSpacing} onChange={e => setCvData(prev => ({ ...prev, lineSpacing: e.target.value as LineSpacing }))} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                  <option value="compact">Kompakt</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Luftig</option>
                </select>
              </div>
            </div>

            {/* A4 Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', borderRadius: 2 }}>
                <div id="cv-preview-area" ref={previewRef}>
                  <CVRenderer design={selectedDesign} cvProps={currentCvProps} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
