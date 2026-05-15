'use client'
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CVDesign, FontFamily, FontSize, LineSpacing, CVProps } from '@/components/cv/types'
import { createClient } from '@/lib/supabase/client'

const NordicMinimal = dynamic(() => import('@/components/cv/NordicMinimal'), { ssr: false })
const NordicSidebar = dynamic(() => import('@/components/cv/NordicSidebar'), { ssr: false })
const ModernSplit   = dynamic(() => import('@/components/cv/ModernSplit'),   { ssr: false })
const DarkPro       = dynamic(() => import('@/components/cv/DarkPro'),       { ssr: false })
const ExecutivePhoto = dynamic(() => import('@/components/cv/ExecutivePhoto'), { ssr: false })
const MonoElegant   = dynamic(() => import('@/components/cv/MonoElegant'),   { ssr: false })

interface Props {
  isPro: boolean
  existingCVCount: number
  profile: Record<string, unknown> | null
  userId: string
}

interface SavedCV {
  id: string
  name: string
  design: CVDesign
  data: CVProps
  createdAt: string
}

const C = {
  bg: '#0A0A0F', card: '#0D1117', border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)', navy: '#1B2E6B', navy2: '#253A85',
  navy3: '#93AFFD', mid: '#8892A4', white: '#fff', success: '#4ADE80',
  amber: '#f59e0b', input: 'rgba(255,255,255,0.04)',
}

const DESIGNS: { id: CVDesign; label: string; desc: string; proOnly: boolean; accent: string }[] = [
  { id: 'NordicMinimal',   label: 'Nordic Minimal',   desc: 'Klar, sauber, zeitlos',        proOnly: false, accent: '#1B2E6B' },
  { id: 'NordicSidebar',  label: 'Nordic Sidebar',   desc: 'Beige Sidebar, elegant',       proOnly: true,  accent: '#8B7355' },
  { id: 'ModernSplit',    label: 'Modern Split',     desc: 'Zweispaltig, luftig',           proOnly: true,  accent: '#7B78CC' },
  { id: 'DarkPro',        label: 'Dark Pro',         desc: 'Dunkel, professionell',        proOnly: true,  accent: '#C9A84C' },
  { id: 'ExecutivePhoto', label: 'Executive Photo',  desc: 'Großes Foto, Führungsebene',   proOnly: true,  accent: '#1B2E6B' },
  { id: 'MonoElegant',    label: 'Mono Elegant',     desc: 'Minimalistisch, modern',       proOnly: true,  accent: '#333'   },
]

const FONT_FAMILIES: FontFamily[] = ['Inter', 'Georgia', 'Playfair Display', 'Roboto', 'Lato', 'Montserrat']

function CVRenderer({ design, props }: { design: CVDesign; props: CVProps }) {
  switch (design) {
    case 'NordicSidebar':  return <NordicSidebar {...props} />
    case 'ModernSplit':    return <ModernSplit {...props} />
    case 'DarkPro':        return <DarkPro {...props} />
    case 'ExecutivePhoto': return <ExecutivePhoto {...props} />
    case 'MonoElegant':    return <MonoElegant {...props} />
    default:               return <NordicMinimal {...props} />
  }
}

function emptyProps(profile: Record<string, unknown> | null): CVProps {
  const p = profile || {}
  return {
    firstName:  String(p.first_name  || ''),
    lastName:   String(p.last_name   || ''),
    email:      String(p.email       || ''),
    phone:      String(p.phone       || ''),
    city:       String(p.city        || ''),
    linkedin:   String(p.linkedin    || ''),
    photoUrl:   String(p.photo       || ''),
    position:   String(p.position    || ''),
    profile:    '',
    experience: String(p.experience  || ''),
    education:  String(p.education   || ''),
    skills:     [],
    languages:  String(p.languages   || ''),
    fontFamily: 'Inter',
    fontSize:   'medium',
    lineSpacing: 'normal',
  }
}

export default function LebenslaufClient({ isPro, existingCVCount, profile, userId }: Props) {
  const supabase = createClient()
  const storageKey = `jobbly_cvs_${userId}`

  const [view, setView]       = useState<'list' | 'build'>('list')
  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cvName, setCvName]   = useState('Mein Lebenslauf')
  const [selectedDesign, setSelectedDesign] = useState<CVDesign>('NordicMinimal')
  const [cvData, setCvData]   = useState<CVProps>(() => emptyProps(profile))
  const [skillsInput, setSkillsInput] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast]     = useState('')

  useEffect(() => {
    try { setSavedCVs(JSON.parse(localStorage.getItem(storageKey) || '[]')) } catch { /* ignore */ }
  }, [storageKey])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function persistCVs(cvs: SavedCV[]) {
    setSavedCVs(cvs)
    localStorage.setItem(storageKey, JSON.stringify(cvs))
  }

  function startNew() {
    setCvData(emptyProps(profile)); setSkillsInput('')
    setSelectedDesign('NordicMinimal'); setCvName('Mein Lebenslauf')
    setEditingId(null); setStep(1); setView('build')
  }

  function openEdit(cv: SavedCV) {
    setCvData(cv.data); setSkillsInput(cv.data.skills?.join(', ') || '')
    setSelectedDesign(cv.design); setCvName(cv.name)
    setEditingId(cv.id); setStep(1); setView('build')
  }

  function deleteCv(id: string) {
    persistCVs(savedCVs.filter(c => c.id !== id))
    showToast('Lebenslauf gelöscht')
  }

  function duplicateCv(cv: SavedCV) {
    const now = new Date().toISOString()
    persistCVs([...savedCVs, { ...cv, id: `cv_${Date.now()}`, name: `${cv.name} (Kopie)`, createdAt: now }])
    showToast('Lebenslauf dupliziert')
  }

  async function handleGenerate() {
    if (!cvData.firstName || !cvData.position) { showToast('Bitte Vorname und Stelle ausfüllen.'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: cvData.firstName, lastName: cvData.lastName, email: cvData.email,
          phone: cvData.phone, city: cvData.city, linkedin: cvData.linkedin,
          position: cvData.position, experienceRaw: cvData.experience,
          educationRaw: cvData.education, skillsRaw: skillsInput, languagesRaw: cvData.languages,
        }),
      })
      const json = await res.json()
      if (json.cvData) {
        const skills = json.cvData.skills || []
        setCvData(prev => ({ ...prev, profile: json.cvData.profile, experience: json.cvData.experience, education: json.cvData.education, skills, languages: json.cvData.languages }))
        setSkillsInput(skills.join(', '))
        showToast('KI-Inhalt generiert!')
      }
    } catch { showToast('Generierung fehlgeschlagen.') }
    finally { setGenerating(false) }
  }

  async function handleSave() {
    if (!isPro && existingCVCount >= 1 && !editingId) { showToast('Free: max. 1 Lebenslauf. Upgrade zu Pro!'); return }
    setSaving(true)
    const now = new Date().toISOString()
    const id  = editingId || `cv_${Date.now()}`
    const currentProps: CVProps = { ...cvData, skills: skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : cvData.skills }
    const newCV: SavedCV = { id, name: cvName, design: selectedDesign, data: currentProps, createdAt: editingId ? (savedCVs.find(c => c.id === editingId)?.createdAt || now) : now }
    persistCVs(editingId ? savedCVs.map(c => c.id === editingId ? newCV : c) : [...savedCVs, newCV])

    try {
      await supabase.from('applications').insert({
        user_id: userId, position: cvData.position || cvName,
        company: null, template: selectedDesign, style: 'balanced',
        cv_data: { profil: cvData.profile, erfahrung: cvData.experience, ausbildung: cvData.education, skills: currentProps.skills, sprachen: cvData.languages, anschreiben: '' },
        cover_letter: '',
      })
    } catch { /* non-critical */ }

    setSaving(false); setEditingId(id)
    showToast('Lebenslauf gespeichert!')
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF }       = await import('jspdf')
      const element = document.getElementById('cv-pdf-capture')
      if (!element) { showToast('Bitte zuerst Vorschau öffnen.'); return }
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
      pdf.save(`lebenslauf-${cvData.lastName || 'export'}.pdf`)
    } catch { showToast('PDF-Export fehlgeschlagen.') }
    finally { setExporting(false) }
  }

  async function handleExportWord() {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()) : cvData.skills
      const doc = new Document({ sections: [{ properties: {}, children: [
        new Paragraph({ text: `${cvData.firstName} ${cvData.lastName}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: cvData.position, bold: true })] }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: `E-Mail: ${cvData.email}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Tel: ${cvData.phone}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Ort: ${cvData.city}` })] }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Profil', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.profile }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Berufserfahrung', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.experience }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Ausbildung', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.education }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Kenntnisse', heading: HeadingLevel.HEADING_2 }),
        ...skills.map(s => new Paragraph({ text: `• ${s}` })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Sprachen', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.languages }),
      ] }] })
      const blob = await Packer.toBlob(doc)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url; a.download = `lebenslauf-${cvData.lastName || 'export'}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Word-Export fehlgeschlagen.') }
  }

  const currentProps: CVProps = {
    ...cvData,
    skills: skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : cvData.skills,
  }

  const inStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `0.5px solid ${C.border2}`,
    borderRadius: 9, fontSize: 13, backgroundColor: C.input, color: C.white,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const taStyle: React.CSSProperties = { ...inStyle, resize: 'vertical', lineHeight: 1.6 }
  const btnPrimary: React.CSSProperties = { backgroundColor: C.navy, color: C.white, border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
  const btnSecondary: React.CSSProperties = { backgroundColor: C.input, color: C.mid, border: `0.5px solid ${C.border}`, borderRadius: 9, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'DM Sans, Inter, sans-serif', color: C.white }}>
      {/* Hidden offscreen full-size render for pixel-perfect PDF export */}
      <div style={{ position: 'fixed', left: -9999, top: 0, width: 794, height: 1123, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div id="cv-pdf-capture"><CVRenderer design={selectedDesign} props={currentProps} /></div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: C.navy, color: C.white, padding: '12px 20px', borderRadius: 10, fontSize: 14, border: `0.5px solid ${C.border2}` }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: C.card, borderBottom: `0.5px solid ${C.border}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <a href="/dashboard" style={{ color: C.navy3, textDecoration: 'none', fontSize: 13 }}>← Dashboard</a>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: C.white }}>Lebenslauf</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {view === 'build' && (
            <>
              {/* Step indicators */}
              {[1, 2, 3].map(s => (
                <div key={s} onClick={() => step > s && setStep(s as 1|2|3)}
                  style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, backgroundColor: step >= s ? C.navy : 'rgba(255,255,255,0.06)', color: step >= s ? C.white : C.mid, cursor: step > s ? 'pointer' : 'default', border: `0.5px solid ${step >= s ? C.navy2 : C.border}` }}>
                  {s}
                </div>
              ))}
              <button onClick={() => setView('list')} style={btnSecondary}>← Übersicht</button>
            </>
          )}
          {view === 'list' && (
            <button onClick={startNew} style={btnPrimary}>+ Neuer Lebenslauf</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div>
            {savedCVs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: `0.5px solid ${C.border}`, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Erstelle deinen ersten Lebenslauf</div>
                <div style={{ fontSize: 14, color: C.mid, marginBottom: 28 }}>KI generiert professionelle Inhalte — du brauchst nur 2 Minuten.</div>
                <button onClick={startNew} style={{ ...btnPrimary, padding: '14px 28px', fontSize: 15 }}>✨ Jetzt erstellen</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {savedCVs.map(cv => (
                  <div key={cv.id} style={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {renamingId === cv.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={renameVal} onChange={e => setRenameVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { persistCVs(savedCVs.map(c => c.id === cv.id ? { ...c, name: renameVal || c.name } : c)); setRenamingId(null) } }} style={{ ...inStyle, flex: 1 }} autoFocus />
                        <button onClick={() => { persistCVs(savedCVs.map(c => c.id === cv.id ? { ...c, name: renameVal || c.name } : c)); setRenamingId(null) }} style={{ ...btnPrimary, padding: '8px 14px' }}>✓</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.white }}>{cv.name}</div>
                    )}
                    <div style={{ fontSize: 12, color: C.mid }}>{cv.design} · {new Date(cv.createdAt).toLocaleDateString('de-DE')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(cv)} style={{ ...btnPrimary, padding: '7px 14px', fontSize: 12 }}>Bearbeiten</button>
                      <button onClick={() => { setRenamingId(cv.id); setRenameVal(cv.name) }} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12 }}>Umbenennen</button>
                      <button onClick={() => duplicateCv(cv)} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12 }}>Kopieren</button>
                      <button onClick={() => deleteCv(cv.id)} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12, color: '#f87171' }}>Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BUILD VIEW ── */}
        {view === 'build' && (
          <>
            {/* STEP 1 — Design Picker */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 6 }}>Design wählen</h2>
                <p style={{ color: C.mid, marginBottom: 24, fontSize: 14 }}>
                  {isPro ? 'Alle 6 Designs verfügbar' : 'Free: Nordic Minimal kostenlos · Upgrade für alle Designs'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
                  {DESIGNS.map(d => {
                    const locked = d.proOnly && !isPro
                    const isSelected = selectedDesign === d.id
                    return (
                      <div key={d.id} onClick={() => { if (locked) { showToast('Nur für Pro-Nutzer — jetzt upgraden!'); return } setSelectedDesign(d.id) }}
                        style={{ position: 'relative', backgroundColor: isSelected ? 'rgba(27,46,107,0.2)' : C.card, border: `0.5px solid ${isSelected ? d.accent : C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all .2s', boxShadow: isSelected ? `0 0 0 2px ${d.accent}44` : 'none' }}>
                        {locked && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
                            <span style={{ fontSize: 22 }}>🔒</span>
                            <span style={{ backgroundColor: C.amber, color: '#000', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>PRO</span>
                          </div>
                        )}
                        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: d.accent, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {d.id === 'NordicMinimal' ? '📋' : d.id === 'NordicSidebar' ? '🌿' : d.id === 'ModernSplit' ? '✨' : d.id === 'DarkPro' ? '🌙' : d.id === 'ExecutivePhoto' ? '📸' : '⬛'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.white }}>{d.label}</div>
                        <div style={{ fontSize: 12, color: C.mid, marginTop: 4 }}>{d.desc}</div>
                        {isSelected && !locked && <div style={{ marginTop: 8, fontSize: 12, color: d.accent, fontWeight: 600 }}>✓ Ausgewählt</div>}
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => setStep(2)} style={{ ...btnPrimary, padding: '12px 32px', fontSize: 15 }}>Weiter →</button>
              </div>
            )}

            {/* STEP 2 — Form */}
            {step === 2 && (
              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white }}>Deine Daten</h2>
                    <div style={{ fontSize: 12, color: C.mid, backgroundColor: C.card, padding: '6px 12px', borderRadius: 8, border: `0.5px solid ${C.border}` }}>
                      Design: <span style={{ color: C.navy3 }}>{DESIGNS.find(d => d.id === selectedDesign)?.label}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {([
                      ['firstName', 'Vorname *'], ['lastName', 'Nachname'],
                      ['email', 'E-Mail'], ['phone', 'Telefon'],
                      ['city', 'Ort'], ['linkedin', 'LinkedIn URL'],
                      ['position', 'Stelle *'], ['photoUrl', 'Foto URL'],
                    ] as [keyof CVProps, string][]).map(([field, label]) => (
                      <div key={field}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
                        <input value={(cvData[field] as string) || ''} onChange={e => setCvData(p => ({ ...p, [field]: e.target.value }))} style={inStyle} />
                      </div>
                    ))}
                  </div>

                  {[
                    ['experience', 'Berufserfahrung', 4, 'Beschreibe deine Berufserfahrung...'],
                    ['education',  'Ausbildung',       3, 'Deine Ausbildung...'],
                  ].map(([field, label, rows, ph]) => (
                    <div key={field} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
                      <textarea value={(cvData[field as keyof CVProps] as string) || ''} onChange={e => setCvData(p => ({ ...p, [field]: e.target.value }))} rows={Number(rows)} placeholder={String(ph)} style={taStyle} />
                    </div>
                  ))}

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Kenntnisse (kommagetrennt)</label>
                    <input value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="React, TypeScript, Projektmanagement..." style={inStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Sprachen</label>
                    <input value={cvData.languages} onChange={e => setCvData(p => ({ ...p, languages: e.target.value }))} placeholder="Deutsch (Muttersprache), Englisch (C1)..." style={inStyle} />
                  </div>

                  {/* CV Name */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Lebenslauf-Name</label>
                    <input value={cvName} onChange={e => setCvName(e.target.value)} placeholder="z.B. Mein Lebenslauf 2025" style={inStyle} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleGenerate} disabled={generating} style={{ ...btnPrimary, backgroundColor: generating ? '#444' : '#10b981', cursor: generating ? 'not-allowed' : 'pointer' }}>
                      {generating ? '⏳ Generiere...' : '✨ KI generiert Inhalt'}
                    </button>
                    <button onClick={() => setStep(3)} style={btnPrimary}>Vorschau →</button>
                    <button onClick={() => setStep(1)} style={btnSecondary}>← Design</button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Preview & Export */}
            {step === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 4 }}>Vorschau & Export</h2>
                    <p style={{ color: C.mid, fontSize: 13 }}>Typografie anpassen, speichern und exportieren</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setStep(2)} style={btnSecondary}>← Bearbeiten</button>
                    <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, backgroundColor: '#6366f1' }}>
                      {saving ? 'Speichern...' : '💾 Speichern'}
                    </button>
                    <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnPrimary, backgroundColor: '#ef4444' }}>
                      {exporting ? '...' : '📄 PDF'}
                    </button>
                    <button onClick={handleExportWord} style={{ ...btnPrimary, backgroundColor: '#2563eb' }}>📝 Word</button>
                  </div>
                </div>

                {/* Typography toolbar */}
                <div style={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { label: 'Schriftart', key: 'fontFamily', options: FONT_FAMILIES.map(f => ({ val: f, label: f })) },
                    { label: 'Größe', key: 'fontSize', options: [{ val: 'small', label: 'Klein' }, { val: 'medium', label: 'Mittel' }, { val: 'large', label: 'Groß' }] },
                    { label: 'Zeilenabstand', key: 'lineSpacing', options: [{ val: 'compact', label: 'Kompakt' }, { val: 'normal', label: 'Normal' }, { val: 'relaxed', label: 'Luftig' }] },
                  ].map(({ label, key, options }) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                      <select value={String(cvData[key as keyof CVProps] || '')} onChange={e => setCvData(p => ({ ...p, [key]: e.target.value }))}
                        style={{ padding: '7px 10px', border: `0.5px solid ${C.border2}`, borderRadius: 7, fontSize: 13, backgroundColor: C.input, color: C.white, fontFamily: 'inherit', cursor: 'pointer' }}>
                        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* A4 Preview — scaled down visually, full-size in hidden div for PDF */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', boxShadow: '0 8px 48px rgba(0,0,0,0.6)', borderRadius: 2 }}>
                    <CVRenderer design={selectedDesign} props={currentProps} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
