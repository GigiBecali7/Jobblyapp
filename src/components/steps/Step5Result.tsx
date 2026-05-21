'use client'

import { useState, useRef, useCallback } from 'react'
import type { CVData, UserData, Template } from '@/lib/types'
import type { Translation } from '@/lib/translations'
import type { Job } from '@/components/steps/Step4Jobs'
import NordicSidebar from '@/components/cv/NordicSidebar'
import MonoElegant from '@/components/cv/MonoElegant'
import ModernSplit from '@/components/cv/ModernSplit'

interface Props {
  t: Translation
  loading: boolean
  loadMsg: string
  cvData: CVData | null
  userData: UserData
  template: Template
  onStartOver: () => void
  selectedJob?: Job | null
  isPro: boolean
  onNeedPro: () => void
  lang: string
}

const tplColors: Record<string, { acc: string; hbg: string; dark: boolean }> = {
  classic:   { acc: '#fff',     hbg: '#0A0A0F', dark: true  },
  modern:    { acc: '#1B2E6B', hbg: '#1B2E6B', dark: true  },
  minimal:   { acc: '#1B2E6B', hbg: '#f9f9f9', dark: false },
  navy:      { acc: '#fff',     hbg: '#1B2E6B', dark: true  },
  executive: { acc: '#0A0A0F', hbg: '#f5f5f5', dark: false },
  tech:      { acc: '#253A85', hbg: '#0D1117', dark: true  },
}

const PREMIUM_TEMPLATES = ['nordic', 'mono', 'split']

export default function Step5Result({
  t, loading, loadMsg, cvData, userData, template,
  onStartOver, selectedJob, isPro, onNeedPro, lang,
}: Props) {
  const cvRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState<CVData | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)
  const [adapting, setAdapting] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [jobDesc, setJobDesc] = useState('')
  const [adaptedLetter, setAdaptedLetter] = useState<string | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  const active = editMode && editedData ? editedData : cvData

  function startEdit() {
    if (!isPro) { onNeedPro(); return }
    setEditedData(cvData ? { ...cvData, skills: [...(cvData.skills || [])] } : null)
    setEditMode(true)
  }

  function saveEdit() { setEditMode(false) }

  function updateField(key: keyof CVData, value: string | string[]) {
    setEditedData(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function exportPDF() {
    if (!cvRef.current) return
    setExporting('pdf')
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${userData.fullname || 'CV'}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  async function exportWord() {
    if (!active) return
    setExporting('word')
    try {
      const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } = await import('docx')
      const skills = Array.isArray(active.skills)
        ? active.skills
        : String(active.skills || '').split(',').filter(Boolean)

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: userData.fullname, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({
              children: [new TextRun({ text: `${userData.position || ''}  ·  ${[userData.email, userData.phone, userData.city].filter(Boolean).join('  ·  ')}`, color: '666666' })],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Profile', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: active.profil })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: active.erfahrung })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: active.ausbildung || userData.education || '–' })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }),
            ...skills.map(s => new Paragraph({ text: `• ${s.trim()}`, alignment: AlignmentType.LEFT })),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Languages', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: active.sprachen || userData.languages || '–' })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Cover Letter', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: adaptedLetter || active.anschreiben })] }),
          ],
        }],
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${userData.fullname || 'CV'}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }

  const adaptCoverLetter = useCallback(async () => {
    if (!isPro) { onNeedPro(); return }
    if (!active) return
    setAdapting(true)
    try {
      const res = await fetch('/api/one-click-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData,
          jobTitle: selectedJob?.t || 'this position',
          jobCompany: selectedJob?.c || 'this company',
          jobDescription: jobDesc || undefined,
          lang,
        }),
      })
      const data = await res.json()
      if (data.coverLetter) setAdaptedLetter(data.coverLetter)
    } finally {
      setAdapting(false)
    }
  }, [isPro, onNeedPro, active, userData, selectedJob, jobDesc, lang])

  async function copyLetter() {
    await navigator.clipboard.writeText(adaptedLetter || active?.anschreiben || '')
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  if (loading) {
    return (
      <div className="loading">
        <div style={{ marginBottom: '1rem' }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
        <p style={{ fontSize: 14, color: 'var(--mid)' }}>{loadMsg}</p>
      </div>
    )
  }

  if (!active) return null

  const isPremium = PREMIUM_TEMPLATES.includes(template)
  const skillsArr = Array.isArray(active.skills)
    ? active.skills
    : String(active.skills || '').split(',').filter(Boolean)
  const c = tplColors[template] || tplColors.classic
  const isDark = c?.dark ?? true
  const txtColor = isDark ? 'rgba(255,255,255,0.85)' : '#1C2333'
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : '#5a6272'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1.5rem .75rem', flexWrap: 'wrap', gap: 10 }}>
        <div className="ok-badge" style={{ margin: 0 }}>✓ {t.ok}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editMode ? (
            <button className="nbtn" style={{ fontSize: 12 }} onClick={startEdit}>
              {isPro ? '✎ Edit fields' : '✎ Edit (Pro)'}
            </button>
          ) : (
            <button className="nbtn" style={{ fontSize: 12, color: 'var(--success)', borderColor: 'var(--success-border)' }} onClick={saveEdit}>
              ✓ Save edits
            </button>
          )}
        </div>
      </div>

      {/* CV preview — ref'd for PDF export */}
      <div ref={cvRef} style={{ margin: '0 1.5rem', borderRadius: isPremium ? 8 : 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        {template === 'nordic' && <NordicSidebar
          firstName={userData.fname} lastName={userData.lname}
          email={userData.email} phone={userData.phone} city={userData.city}
          linkedin={userData.linkedin} photoUrl={userData.photo}
          position={userData.position} profile={active.profil}
          experience={active.erfahrung} education={active.ausbildung || userData.education}
          skills={Array.isArray(active.skills) ? active.skills : String(active.skills || '').split(',').filter(Boolean)}
          languages={active.sprachen || userData.languages}
        />}
        {template === 'mono' && <MonoElegant
          firstName={userData.fname} lastName={userData.lname}
          email={userData.email} phone={userData.phone} city={userData.city}
          linkedin={userData.linkedin} photoUrl={userData.photo}
          position={userData.position} profile={active.profil}
          experience={active.erfahrung} education={active.ausbildung || userData.education}
          skills={Array.isArray(active.skills) ? active.skills : String(active.skills || '').split(',').filter(Boolean)}
          languages={active.sprachen || userData.languages}
        />}
        {template === 'split' && <ModernSplit
          firstName={userData.fname} lastName={userData.lname}
          email={userData.email} phone={userData.phone} city={userData.city}
          linkedin={userData.linkedin} photoUrl={userData.photo}
          position={userData.position} profile={active.profil}
          experience={active.erfahrung} education={active.ausbildung || userData.education}
          skills={Array.isArray(active.skills) ? active.skills : String(active.skills || '').split(',').filter(Boolean)}
          languages={active.sprachen || userData.languages}
        />}
        {!isPremium && (
          <>
            <div style={{ background: c.hbg, padding: '1.25rem', borderBottom: '2px solid rgba(27,46,107,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {userData.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userData.photo} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: isDark ? 'rgba(27,46,107,0.5)' : 'rgba(27,46,107,0.1)', border: `1.5px solid ${isDark ? 'rgba(27,46,107,0.6)' : 'rgba(27,46,107,0.25)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: isDark ? '#93AFFD' : '#1B2E6B' }}>
                    {(userData.fname || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.3px', color: isDark ? '#fff' : c.acc }}>{userData.fullname}</div>
                  <div style={{ fontSize: 12, marginTop: 2, color: subColor }}>{userData.position || 'Applicant'}</div>
                  <div style={{ fontSize: 11, marginTop: 3, color: isDark ? 'rgba(255,255,255,0.3)' : '#aaa' }}>
                    {[userData.email, userData.phone, userData.city].filter(Boolean).join('  ·  ')}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '1.25rem', background: isDark ? 'rgba(255,255,255,0.02)' : '#fff' }}>
              {[
                { label: 'Profile', content: active.profil },
                { label: 'Experience', content: active.erfahrung },
                { label: 'Education', content: active.ausbildung || userData.education || '–' },
                { label: 'Languages', content: active.sprachen || userData.languages || '–' },
              ].map(({ label, content }) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <div className="slabel" style={{ color: isDark ? '#93AFFD' : '#1B2E6B', borderColor: 'rgba(27,46,107,0.2)' }}>{label}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: txtColor }}>{content}</p>
                </div>
              ))}
              <div style={{ marginBottom: '1rem' }}>
                <div className="slabel" style={{ color: isDark ? '#93AFFD' : '#1B2E6B', borderColor: 'rgba(27,46,107,0.2)' }}>Skills</div>
                <div>{skillsArr.map((s, i) => <span key={i} className="chip" style={{ borderColor: `rgba(27,46,107,${isDark ? '0.4' : '0.25'})`, color: isDark ? '#93AFFD' : '#1B2E6B', background: `rgba(27,46,107,${isDark ? '0.2' : '0.08'})` }}>{typeof s === 'string' ? s.trim() : s}</span>)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit fields panel (Pro) */}
      {editMode && editedData && (
        <div style={{ margin: '1rem 1.5rem 0', padding: '1.25rem', background: 'rgba(27,46,107,0.08)', border: '0.5px solid rgba(27,46,107,0.3)', borderRadius: 10 }}>
          <div className="slabel" style={{ marginBottom: '1rem' }}>Edit CV fields</div>
          {(['profil', 'erfahrung', 'ausbildung', 'sprachen'] as const).map(key => (
            <div className="field" key={key}>
              <label>{{ profil: 'Profile', erfahrung: 'Experience', ausbildung: 'Education', sprachen: 'Languages' }[key]}</label>
              <textarea value={editedData[key] as string} rows={3} onChange={e => updateField(key, e.target.value)} />
            </div>
          ))}
          <div className="field">
            <label>Skills (comma separated)</label>
            <input type="text" value={Array.isArray(editedData.skills) ? editedData.skills.join(', ') : editedData.skills} onChange={e => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div className="field">
            <label>Cover letter</label>
            <textarea value={editedData.anschreiben} rows={6} onChange={e => updateField('anschreiben', e.target.value)} />
          </div>
          <button className="btn" onClick={saveEdit} style={{ marginTop: 4 }}>✓ Apply changes</button>
        </div>
      )}

      {/* Cover letter */}
      <div className="cover-box" style={{ margin: '1rem 1.5rem 0' }}>
        <span className="slabel">{t.cover}</span>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap' }}>
          {adaptedLetter || active.anschreiben}
        </div>
        {adaptedLetter && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="nbtn" style={{ fontSize: 12 }} onClick={copyLetter}>{copyDone ? '✓ Copied!' : 'Copy'}</button>
            <button className="nbtn" style={{ fontSize: 12 }} onClick={() => setAdaptedLetter(null)}>Reset original</button>
          </div>
        )}
      </div>

      {/* One-click apply */}
      <div style={{ margin: '1rem 1.5rem 0', border: '0.5px solid rgba(27,46,107,0.4)', borderRadius: 10, overflow: 'hidden' }}>
        <button
          onClick={() => { if (!isPro) { onNeedPro(); return } setApplyOpen(o => !o) }}
          style={{ width: '100%', padding: '12px 16px', background: applyOpen ? 'rgba(27,46,107,0.2)' : 'rgba(27,46,107,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', color: '#93AFFD', fontSize: 13, fontWeight: 500 }}
        >
          <span>⚡ One-click apply — adapt cover letter to a specific job</span>
          <span style={{ fontSize: 11, color: 'var(--mid)' }}>{isPro ? (applyOpen ? '▲' : '▼') : 'Pro'}</span>
        </button>
        {applyOpen && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '0.5px solid rgba(27,46,107,0.3)' }}>
            <p style={{ fontSize: 12, color: 'var(--mid)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
              AI will rewrite your cover letter to perfectly match a specific job. Paste the job description below (optional — already tailored to <strong style={{ color: '#fff' }}>{selectedJob?.t || 'your profile'}</strong>).
            </p>
            <div className="field">
              <label>Job description (optional)</label>
              <textarea value={jobDesc} rows={4} placeholder="Paste the full job posting here for best results…" onChange={e => setJobDesc(e.target.value)} />
            </div>
            <button className="btn" onClick={adaptCoverLetter} disabled={adapting}>
              {adapting ? 'Adapting…' : '⚡ Adapt cover letter now →'}
            </button>
          </div>
        )}
      </div>

      {/* Export + navigation */}
      <div style={{ padding: '1.25rem 1.5rem', borderTop: '0.5px solid var(--border)', marginTop: '1.5rem', display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <button className="btn btn-out" onClick={onStartOver} style={{ fontSize: 13 }}>Start over</button>
        <button className="btn" onClick={exportPDF} disabled={exporting === 'pdf'} style={{ fontSize: 13, position: 'relative' }}>
          {exporting === 'pdf' ? 'Exporting…' : '↓ PDF'}
        </button>
        <button className="btn" onClick={exportWord} disabled={exporting === 'word'} style={{ fontSize: 13, background: 'rgba(27,46,107,0.5)' }}>
          {exporting === 'word' ? 'Exporting…' : '↓ Word'}
        </button>
      </div>
    </div>
  )
}
