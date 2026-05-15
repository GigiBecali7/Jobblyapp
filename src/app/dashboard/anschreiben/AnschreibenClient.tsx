'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CVDesign } from '@/components/cv/types'

interface CoverLetter {
  id: string
  job_title: string
  company: string
  design: string
  content: string
  created_at: string
}

interface Props {
  isPro: boolean
  letters: CoverLetter[]
  lastDesign: string
  userId: string
  profile: Record<string, unknown> | null
}

const C = {
  bg: '#0A0A0F', card: '#0D1117', border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)', navy: '#1B2E6B', navy2: '#253A85',
  navy3: '#93AFFD', mid: '#8892A4', white: '#fff', success: '#4ADE80',
  amber: '#f59e0b', input: 'rgba(255,255,255,0.04)',
}

const MAX_FREE = 3

async function exportLetterToPDF(elementId: string, filename: string) {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF } = await import('jspdf')
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
  pdf.save(filename)
}

export default function AnschreibenClient({ isPro, letters: initialLetters, lastDesign, userId, profile }: Props) {
  const [letters, setLetters] = useState<CoverLetter[]>(initialLetters)
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [selectedDesign] = useState<CVDesign>((lastDesign as CVDesign) || 'NordicMinimal')
  const [generating, setGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function handleGenerate() {
    if (!jobTitle || !company) { showToast('Bitte Stelle und Unternehmen eingeben.'); return }
    if (!isPro && letters.length >= MAX_FREE) { showToast(`Free-Nutzer: max. ${MAX_FREE} Anschreiben. Upgrade zu Pro!`); return }
    setGenerating(true)
    try {
      const userProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, userProfile }),
      })
      const json = await res.json()
      if (json.coverLetter) { setGeneratedText(json.coverLetter); setView('preview') }
    } catch { showToast('Generierung fehlgeschlagen.') }
    finally { setGenerating(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await supabase.from('cover_letters').insert({
        user_id: userId, job_title: jobTitle, company, design: selectedDesign, content: generatedText,
      }).select().single()
      if (data) { setLetters(prev => [data as CoverLetter, ...prev]); showToast('Gespeichert!'); setView('list') }
    } catch { showToast('Speichern fehlgeschlagen.') }
    finally { setSaving(false) }
  }

  async function handleExportPDF() {
    setExporting(true)
    try { await exportLetterToPDF('cover-letter-preview', `anschreiben-${company || 'export'}.pdf`) }
    catch { showToast('PDF-Export fehlgeschlagen.') }
    finally { setExporting(false) }
  }

  async function handleExportWord() {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const doc = new Document({ sections: [{ properties: {}, children: [
        new Paragraph({ text: `Bewerbung als ${jobTitle} bei ${company}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' }),
        ...generatedText.split('\n').filter(Boolean).map(line => new Paragraph({ children: [new TextRun({ text: line })] })),
      ] }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `anschreiben-${company || 'export'}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Word-Export fehlgeschlagen.') }
  }

  const inStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `0.5px solid ${C.border2}`,
    borderRadius: 9, fontSize: 14, backgroundColor: C.input, color: C.white,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  const btnPrimary: React.CSSProperties = {
    backgroundColor: C.navy, color: C.white, border: 'none', borderRadius: 9,
    padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }
  const btnSecondary: React.CSSProperties = {
    backgroundColor: C.input, color: C.mid, border: `0.5px solid ${C.border}`,
    borderRadius: 9, padding: '11px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'DM Sans, Inter, sans-serif', color: C.white }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, backgroundColor: C.navy, color: C.white, padding: '12px 20px', borderRadius: 10, fontSize: 14, border: `0.5px solid ${C.border2}` }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: C.card, borderBottom: `0.5px solid ${C.border}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <a href="/dashboard" style={{ color: C.navy3, textDecoration: 'none', fontSize: 13 }}>← Dashboard</a>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: C.white }}>Anschreiben</h1>
        </div>
        {view === 'list' && (
          <button onClick={() => { setView('create'); setJobTitle(''); setCompany(''); setGeneratedText('') }} style={btnPrimary}>
            + Neues Anschreiben
          </button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
            {!isPro && (
              <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: `0.5px solid rgba(245,158,11,0.3)`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.amber }}>
                Free-Plan: {letters.length}/{MAX_FREE} Anschreiben.{' '}
                <a href="/dashboard" style={{ color: C.navy3, fontWeight: 600 }}>Upgrade zu Pro</a> für unbegrenzte Anschreiben.
              </div>
            )}

            {letters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: `0.5px solid ${C.border}`, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Dein KI-Anschreiben wartet</div>
                <div style={{ fontSize: 14, color: C.mid, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                  Wähle eine Stelle aus und lass die KI ein professionelles deutsches Anschreiben für dich erstellen — in unter 30 Sekunden.
                </div>
                <button onClick={() => { setView('create'); setJobTitle(''); setCompany(''); setGeneratedText('') }} style={{ ...btnPrimary, padding: '14px 28px', fontSize: 15 }}>
                  ✨ Erstes Anschreiben erstellen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {letters.map(l => (
                  <div key={l.id} style={{ backgroundColor: C.card, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: C.white }}>{l.job_title}</div>
                      <div style={{ fontSize: 13, color: C.mid, marginTop: 3 }}>{l.company} · {new Date(l.created_at).toLocaleDateString('de-DE')}</div>
                    </div>
                    <button onClick={() => { setJobTitle(l.job_title); setCompany(l.company); setGeneratedText(l.content); setView('preview') }}
                      style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13 }}>
                      Ansehen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && (
          <div style={{ backgroundColor: C.card, borderRadius: 14, padding: 32, border: `0.5px solid ${C.border}` }}>
            <div style={{ backgroundColor: 'rgba(27,46,107,0.15)', border: `0.5px solid rgba(27,46,107,0.35)`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: C.navy3 }}>
              Wir haben automatisch den Stil deines Lebenslaufs übernommen ({selectedDesign})
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: C.white }}>Neues Anschreiben</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Stelle *</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={inStyle} placeholder="z.B. Software Engineer" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Unternehmen *</label>
                <input value={company} onChange={e => setCompany(e.target.value)} style={inStyle} placeholder="z.B. Google GmbH" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleGenerate} disabled={generating} style={{ ...btnPrimary, backgroundColor: generating ? '#555' : '#10b981', cursor: generating ? 'not-allowed' : 'pointer' }}>
                {generating ? '⏳ Generiere...' : '✨ KI generiert Anschreiben'}
              </button>
              <button onClick={() => setView('list')} style={btnSecondary}>Abbrechen</button>
            </div>
          </div>
        )}

        {/* PREVIEW VIEW */}
        {view === 'preview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>{jobTitle} — {company}</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setView(letters.find(l => l.content === generatedText) ? 'list' : 'create')} style={btnSecondary}>← Zurück</button>
                <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, backgroundColor: '#6366f1' }}>
                  {saving ? 'Speichern...' : '💾 Speichern'}
                </button>
                <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnPrimary, backgroundColor: '#ef4444' }}>
                  {exporting ? 'Exportiere...' : '📄 PDF'}
                </button>
                <button onClick={handleExportWord} style={{ ...btnPrimary, backgroundColor: '#2563eb' }}>📝 Word</button>
              </div>
            </div>

            {/* A4 Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
                <div id="cover-letter-preview" style={{ width: 794, minHeight: 1123, backgroundColor: '#fff', boxSizing: 'border-box', fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
                  {/* Styled navy header */}
                  <div style={{ backgroundColor: '#1B2E6B', padding: '32px 56px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.5px' }}>
                          {String(profile?.first_name || '')} {String(profile?.last_name || '')}
                        </div>
                        <div style={{ fontSize: 13, color: '#93AFFD', marginTop: 6 }}>
                          {profile?.email ? String(profile.email) : ''}
                        </div>
                      </div>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#93AFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#1B2E6B', flexShrink: 0 }}>
                        {String(profile?.first_name || '?').charAt(0)}{String(profile?.last_name || '').charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Letter body */}
                  <div style={{ padding: '40px 56px' }}>
                    <div style={{ marginBottom: 28, fontSize: 13, color: '#666' }}>
                      <div>{new Date().toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div style={{ marginTop: 16, fontWeight: 600, color: '#1a1a1a' }}>{company}</div>
                    </div>
                    <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e9ecef' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2E6B' }}>
                        Bewerbung als {jobTitle} bei {company}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: '#333', marginBottom: 20 }}>Sehr geehrte Damen und Herren,</div>
                    <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 32 }}>{generatedText}</div>
                    <div style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>Mit freundlichen Grüßen,</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2E6B', marginTop: 24 }}>
                      {String(profile?.first_name || '')} {String(profile?.last_name || '')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
