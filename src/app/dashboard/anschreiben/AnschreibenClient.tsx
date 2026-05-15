'use client'
import React, { useState } from 'react'
import { exportToPDF } from '@/lib/cv-export'
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

const MAX_FREE = 3

export default function AnschreibenClient({ isPro, letters: initialLetters, lastDesign, userId, profile }: Props) {
  const [letters, setLetters] = useState<CoverLetter[]>(initialLetters)
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [selectedDesign] = useState<CVDesign>((lastDesign as CVDesign) || 'NordicMinimal')
  const [generating, setGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleGenerate() {
    if (!jobTitle || !company) {
      showToast('Bitte Stelle und Unternehmen eingeben.')
      return
    }
    if (!isPro && letters.length >= MAX_FREE) {
      showToast(`Free-Nutzer können max. ${MAX_FREE} Anschreiben erstellen. Upgrade zu Pro!`)
      return
    }
    setGenerating(true)
    try {
      const userProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, userProfile }),
      })
      const json = await res.json()
      if (json.coverLetter) {
        setGeneratedText(json.coverLetter)
        setView('preview')
      }
    } catch {
      showToast('Generierung fehlgeschlagen.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await supabase.from('cover_letters').insert({
        user_id: userId,
        job_title: jobTitle,
        company,
        design: selectedDesign,
        content: generatedText,
      }).select().single()
      if (data) {
        setLetters(prev => [data as CoverLetter, ...prev])
        showToast('Anschreiben gespeichert!')
        setView('list')
      }
    } catch {
      showToast('Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPDF() {
    try {
      await exportToPDF('cover-letter-preview', `anschreiben-${company || 'export'}.pdf`)
    } catch {
      showToast('PDF-Export fehlgeschlagen.')
    }
  }

  async function handleExportWord() {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: `Bewerbung als ${jobTitle} bei ${company}`, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: '' }),
            ...generatedText.split('\n').filter(Boolean).map(line => new Paragraph({ children: [new TextRun({ text: line })] })),
          ],
        }],
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anschreiben-${company || 'export'}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Word-Export fehlgeschlagen.')
    }
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
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Anschreiben</h1>
        </div>
        {view === 'list' && (
          <button onClick={() => { setView('create'); setJobTitle(''); setCompany(''); setGeneratedText('') }} style={{ backgroundColor: '#1B2E6B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + Neues Anschreiben
          </button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* LIST */}
        {view === 'list' && (
          <div>
            {!isPro && (
              <div style={{ backgroundColor: '#fff8e1', border: '1px solid #f59e0b', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#92400e' }}>
                Free-Plan: {letters.length}/{MAX_FREE} Anschreiben. <a href="/dashboard" style={{ color: '#1B2E6B', fontWeight: 600 }}>Upgrade zu Pro</a> für unbegrenzte Anschreiben.
              </div>
            )}
            {letters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Dein KI-Anschreiben wartet</div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                  Wähle eine Stelle aus und lass die KI ein professionelles deutsches Anschreiben für dich erstellen — in unter 30 Sekunden.
                </div>
                <button
                  onClick={() => { setView('create'); setJobTitle(''); setCompany(''); setGeneratedText('') }}
                  style={{ backgroundColor: '#1B2E6B', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  ✨ Erstes Anschreiben erstellen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {letters.map(l => (
                  <div key={l.id} style={{ backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#1a1a1a' }}>{l.job_title}</div>
                      <div style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{l.company} · {new Date(l.created_at).toLocaleDateString('de-DE')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setJobTitle(l.job_title); setCompany(l.company); setGeneratedText(l.content); setView('preview') }} style={{ backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Ansehen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE */}
        {view === 'create' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ backgroundColor: '#e8f0fe', border: '1px solid #c7d7f9', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#1B2E6B' }}>
              Wir haben automatisch den Stil deines Lebenslaufs übernommen ({selectedDesign})
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Neues Anschreiben</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Stelle *</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} placeholder="z.B. Software Engineer" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>Unternehmen *</label>
                <input value={company} onChange={e => setCompany(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} placeholder="z.B. Google GmbH" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleGenerate} disabled={generating} style={{ backgroundColor: generating ? '#ccc' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer' }}>
                {generating ? '⏳ Generiere...' : '✨ KI generiert Anschreiben'}
              </button>
              <button onClick={() => setView('list')} style={{ backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, cursor: 'pointer' }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {view === 'preview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{jobTitle} — {company}</h2>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setView(letters.find(l => l.content === generatedText) ? 'list' : 'create')} style={{ backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer' }}>← Zurück</button>
                <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Speichern...' : '💾 Speichern'}
                </button>
                <button onClick={handleExportPDF} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>📄 PDF</button>
                <button onClick={handleExportWord} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>📝 Word</button>
              </div>
            </div>

            {/* A4 Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div id="cover-letter-preview" style={{ width: 794, minHeight: 1123, backgroundColor: '#fff', boxSizing: 'border-box', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
                {/* Styled header matching CV design */}
                <div style={{ backgroundColor: '#1B2E6B', padding: '32px 56px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.5px' }}>
                        {profile?.first_name as string || ''} {profile?.last_name as string || ''}
                      </div>
                      <div style={{ fontSize: 13, color: '#93AFFD', marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {profile?.email ? <span>✉ {String(profile.email)}</span> : null}
                      </div>
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#93AFFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#1B2E6B', flexShrink: 0 }}>
                      {String(profile?.first_name || '?').charAt(0)}{String(profile?.last_name || '').charAt(0)}
                    </div>
                  </div>
                </div>

                {/* Letter body */}
                <div style={{ padding: '40px 56px' }}>
                  {/* Date + recipient */}
                  <div style={{ marginBottom: 32, fontSize: 13, color: '#666' }}>
                    <div>{new Date().toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ marginTop: 16, fontWeight: 600, color: '#1a1a1a' }}>{company}</div>
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2E6B' }}>
                      Bewerbung als {jobTitle} bei {company}
                    </div>
                  </div>

                  {/* Salutation */}
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 20 }}>Sehr geehrte Damen und Herren,</div>

                  {/* Body */}
                  <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 32 }}>{generatedText}</div>

                  {/* Closing */}
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>Mit freundlichen Grüßen,</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2E6B', marginTop: 24 }}>
                    {profile?.first_name as string || ''} {profile?.last_name as string || ''}
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
