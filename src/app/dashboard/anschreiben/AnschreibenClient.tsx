'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CVDesign } from '@/components/cv/types'
import { getDashT, getCurrentLang } from '@/lib/dashboard-i18n'
import { useIsMobile } from '@/lib/useIsMobile'
import { trackEvent } from '@/components/MetaPixel'

const MAX_FREE_EDITS = 5
const MAX_PRO_LETTERS = 5
const MAX_FREE_LETTERS = 1

// ── Types ─────────────────────────────────────────────────────────────────────
interface CoverLetter {
  id: string
  job_title: string
  company: string
  design: string
  content: string
  created_at: string
  edit_count: number
}

interface Props {
  isPro: boolean
  letters: CoverLetter[]
  lastDesign: string
  userId: string
  profile: Record<string, unknown> | null
}

// ── Design config for cover letter styling ────────────────────────────────────
const DESIGN_CFG: Record<CVDesign, { headerBg: string; headerColor: string; accent: string }> = {
  NordicMinimal:   { headerBg: '#1B2E6B', headerColor: '#fff',    accent: '#1B2E6B' },
  NordicSidebar:   { headerBg: '#F5EDE3', headerColor: '#3D2B1F', accent: '#8B7355' },
  ModernSplit:     { headerBg: '#7B78CC', headerColor: '#fff',    accent: '#7B78CC' },
  DarkPro:         { headerBg: '#2A2A2A', headerColor: '#C9A84C', accent: '#C9A84C' },
  ExecutivePhoto:  { headerBg: '#1B2E6B', headerColor: '#fff',    accent: '#1B2E6B' },
  MonoElegant:     { headerBg: '#111',    headerColor: '#fff',    accent: '#333'    },
}

const DESIGNS: { id: CVDesign; label: string; desc: string; proOnly: boolean; emoji: string }[] = [
  { id: 'NordicMinimal',   label: 'Nordic Minimal',   desc: 'Klar & zeitlos',        proOnly: false, emoji: '📋' },
  { id: 'NordicSidebar',  label: 'Nordic Sidebar',   desc: 'Beige, elegant',        proOnly: true,  emoji: '🌿' },
  { id: 'ModernSplit',    label: 'Modern Split',     desc: 'Zweispaltig, modern',   proOnly: true,  emoji: '✨' },
  { id: 'DarkPro',        label: 'Dark Pro',         desc: 'Dunkel, professionell', proOnly: true,  emoji: '🌙' },
  { id: 'ExecutivePhoto', label: 'Executive Photo',  desc: 'Führungsebene',         proOnly: true,  emoji: '📸' },
  { id: 'MonoElegant',    label: 'Mono Elegant',     desc: 'Minimalistisch',        proOnly: true,  emoji: '⬛' },
]

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0F', card: '#0D1117', border: 'rgba(255,255,255,0.07)',
  navy: '#1B2E6B', navy3: '#93AFFD', mid: '#8892A4', white: '#fff',
  success: '#4ADE80', amber: '#f59e0b', input: '#0d0d1a', error: '#f87171',
}

const inStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 9, fontSize: 14, backgroundColor: '#0d0d1a', color: '#fff',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const btnPrimary = (bg = C.navy): React.CSSProperties => ({
  backgroundColor: bg, color: C.white, border: 'none', borderRadius: 9,
  padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
})
const btnSecondary: React.CSSProperties = {
  backgroundColor: C.input, color: C.mid, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 9, padding: '11px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: C.mid,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
}
const btnDanger: React.CSSProperties = {
  backgroundColor: 'transparent', color: '#f87171',
  border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 7,
  padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
}

// ── Cover Letter A4 Preview ───────────────────────────────────────────────────
function CoverLetterA4({
  profile, jobTitle, company, text, design, greeting, closing, subjectPrefix,
}: {
  profile: Record<string, unknown> | null
  jobTitle: string; company: string; text: string; design: CVDesign
  greeting: string; closing: string; subjectPrefix: string
}) {
  const cfg = DESIGN_CFG[design] || DESIGN_CFG.NordicMinimal
  const p = profile || {}
  const firstName = String(p.first_name || '')
  const lastName  = String(p.last_name || '')
  const email     = String(p.email || '')
  const phone     = String(p.phone || '')
  const city      = String(p.city || '')
  const initials  = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'
  const today     = new Date().toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' })
  const isDark    = design === 'DarkPro' || design === 'MonoElegant'
  const bodyBg    = design === 'DarkPro' ? '#1E1E1E' : design === 'MonoElegant' ? '#f5f5f5' : '#fff'
  const bodyColor = isDark ? '#e5e5e5' : '#333'

  return (
    <div style={{ width: 794, minHeight: 1123, backgroundColor: bodyBg, fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
      <div style={{ backgroundColor: cfg.headerBg, padding: '32px 56px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: cfg.headerColor, letterSpacing: '-.5px' }}>{firstName} {lastName}</div>
            {email && <div style={{ fontSize: 12, color: design === 'NordicSidebar' ? '#8B7355' : 'rgba(255,255,255,0.75)', marginTop: 4 }}>{email}</div>}
            {(phone || city) && <div style={{ fontSize: 12, color: design === 'NordicSidebar' ? '#8B7355' : 'rgba(255,255,255,0.6)', marginTop: 2 }}>{[phone, city].filter(Boolean).join(' · ')}</div>}
          </div>
          <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: design === 'NordicSidebar' ? '#8B7355' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: cfg.headerColor, flexShrink: 0 }}>
            {initials}
          </div>
        </div>
      </div>
      <div style={{ padding: '40px 56px', color: bodyColor }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: isDark ? '#999' : '#888', marginBottom: 16 }}>{today}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e5e5e5' : '#1a1a1a' }}>{company}</div>
        </div>
        <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e9ecef'}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: cfg.accent }}>
            {subjectPrefix} {jobTitle}{company ? ` bei ${company}` : ''}
          </div>
        </div>
        <div style={{ fontSize: 13, marginBottom: 20 }}>{greeting}</div>
        <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 32 }}>{text}</div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>{closing}</div>
        <div style={{ marginTop: 24, fontSize: 14, fontWeight: 700, color: cfg.accent }}>{firstName} {lastName}</div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AnschreibenClient({ isPro, letters: initialLetters, lastDesign, userId, profile }: Props) {
  const supabaseRef = useRef(createClient())
  const lang     = getCurrentLang()
  const t        = getDashT(lang)
  const mob      = useIsMobile()

  const [view, setView]       = useState<'list' | 'input' | 'preview'>('list')
  const [letters, setLetters] = useState<CoverLetter[]>(initialLetters)

  const [jobTitle, setJobTitle]   = useState('')
  const [company, setCompany]     = useState('')
  const [editableText, setEditableText]     = useState('')
  const [selectedDesign, setSelectedDesign] = useState<CVDesign>((lastDesign as CVDesign) || 'NordicMinimal')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [exporting, setExporting]   = useState(false)
  const [applying, setApplying]     = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const [errors, setErrors]         = useState<{ job?: string; company?: string }>({})
  const [isDirty, setIsDirty]       = useState(false)
  const [validModal, setValidModal] = useState<Array<{ field: string; label: string }> | null>(null)

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSaveDataRef  = useRef({ isDirty: false, editingId: null as string | null, editableText: '', selectedDesign: 'NordicMinimal' as CVDesign })

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  // ── Dirty tracking ──
  const markDirty = useCallback(() => { if (view === 'preview') setIsDirty(true) }, [view])

  // Keep stable ref in sync
  useEffect(() => {
    autoSaveDataRef.current = { isDirty, editingId, editableText, selectedDesign }
  }, [isDirty, editingId, editableText, selectedDesign])

  // Warn on page leave when dirty
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Auto-save every 60 seconds silently — stable callback reads from ref
  const handleAutoSave = useCallback(async () => {
    const d = autoSaveDataRef.current
    if (!d.isDirty || !d.editingId) return
    try {
      const supabase = supabaseRef.current
      const { error } = await supabase.from('cover_letters').update({
        content: d.editableText, design: d.selectedDesign,
        updated_at: new Date().toISOString(),
      }).eq('id', d.editingId)
      if (!error) setIsDirty(false)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (view !== 'preview') return
    autoSaveTimerRef.current = setInterval(() => { handleAutoSave() }, 60000)
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current) }
  }, [view, handleAutoSave])

  function validate(): boolean {
    const errs: { job?: string; company?: string } = {}
    if (!jobTitle.trim()) errs.job = 'Stelle ist erforderlich.'
    if (!company.trim()) errs.company = 'Unternehmen ist erforderlich.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function resetForm() {
    setJobTitle(''); setCompany(''); setEditableText('')
    setEditingId(null); setErrors({}); setSelectedDesign('NordicMinimal')
    setIsDirty(false)
  }

  function handleBackToList() {
    if (isDirty) {
      if (window.confirm('Ungespeicherte Änderungen. Speichern?')) {
        handleSave().then(() => { setIsDirty(false); setView('list'); resetForm() })
        return
      }
    }
    setIsDirty(false)
    setView('list')
    resetForm()
  }

  async function handleGenerate() {
    if (!validate()) return
    const maxLetters = isPro ? MAX_PRO_LETTERS : MAX_FREE_LETTERS
    if (letters.length >= maxLetters) {
      const msg = isPro
        ? `Du hast das Maximum von ${MAX_PRO_LETTERS} Anschreiben erreicht. Lösche eines um ein neues zu erstellen.`
        : `Free-Plan: max. ${MAX_FREE_LETTERS} Anschreiben. Upgrade zu Pro!`
      showToast(msg, false)
      return
    }
    setGenerating(true)
    try {
      const userProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, userProfile, lang }),
      })
      const json = await res.json()
      if (json.coverLetter) {
        setEditableText(json.coverLetter); setView('preview'); trackEvent('StartTrial')
      } else if (json.action === 'complete_profile' && json.missing) {
        setValidModal(json.missing as Array<{ field: string; label: string }>)
      } else if (json.action === 'fill_form') {
        showToast(json.error || 'Bitte fülle Stelle und Unternehmen aus.', false)
      } else if (json.action === 'upgrade') {
        showToast(json.error || 'Tageslimit erreicht. Upgrade zu Pro!', false)
      } else {
        const errMsg = json.error || t.toastGenerateError
        const isTempDown = res.status === 503
        console.error('cover-letter generate error:', errMsg)
        showToast(isTempDown ? 'KI-Generierung vorübergehend nicht verfügbar. Bitte versuche es in ein paar Minuten erneut.' : errMsg, false)
      }
    } catch (e) { console.error('Generate fetch error:', e); showToast(t.toastGenerateError, false) }
    finally { setGenerating(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = supabaseRef.current
      if (editingId) {
        const existing = letters.find(l => l.id === editingId)
        if (!isPro && existing && existing.edit_count >= MAX_FREE_EDITS) {
          showToast(`Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen. Upgrade zu Pro!`, false)
          return
        }
        const newCount = (existing?.edit_count || 0) + 1
        await supabase.from('cover_letters').update({
          content: editableText, design: selectedDesign,
          edit_count: newCount, updated_at: new Date().toISOString(),
        }).eq('id', editingId)
        setLetters(prev => prev.map(l => l.id === editingId ? { ...l, content: editableText, design: selectedDesign, edit_count: newCount } : l))
        if (!isPro && newCount === MAX_FREE_EDITS) {
          showToast(`Letzte Bearbeitung! Free-Plan erlaubt max. ${MAX_FREE_EDITS}. Upgrade für mehr.`, true)
        } else {
          showToast('Anschreiben gespeichert ✅')
        }
      } else {
        const { data, error } = await supabase.from('cover_letters').insert({
          user_id: userId, job_title: jobTitle, company, design: selectedDesign, content: editableText, edit_count: 0,
        }).select().single()
        if (error) throw error
        if (data) { setLetters(prev => [data as CoverLetter, ...prev]); setEditingId((data as CoverLetter).id) }
        showToast('Anschreiben gespeichert ✅')
      }
      setIsDirty(false)
    } catch { showToast('Fehler beim Speichern. Bitte versuche es erneut.', false) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const supabase = supabaseRef.current
    const { error } = await supabase.from('cover_letters').delete().eq('id', id)
    if (!error) { setLetters(prev => prev.filter(l => l.id !== id)); showToast('Anschreiben gelöscht') }
    else { showToast('Fehler beim Löschen', false) }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF }       = await import('jspdf')
      const el = document.getElementById('cover-letter-a4-hidden')
      if (!el) { showToast(t.toastPdfError, false); return }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: null })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
      pdf.save(`anschreiben-${company || 'export'}.pdf`)
    } catch { showToast(t.toastPdfError, false) }
    finally { setExporting(false) }
  }

  async function handleExportWord() {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const fn = String(profile?.first_name || ''), ln = String(profile?.last_name || '')
      const doc = new Document({ sections: [{ properties: {}, children: [
        new Paragraph({ text: `${t.letterSubjectPrefix} ${jobTitle} bei ${company}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.letterGreeting }),
        new Paragraph({ text: '' }),
        ...editableText.split('\n').filter(Boolean).map(line => new Paragraph({ children: [new TextRun({ text: line })] })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.letterClosing }),
        new Paragraph({ children: [new TextRun({ text: `${fn} ${ln}`, bold: true })] }),
      ] }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `anschreiben-${company || 'export'}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast(t.toastWordError, false) }
  }

  async function handleApply() {
    setApplying(true)
    try {
      const supabase = supabaseRef.current
      await supabase.from('applications').insert({
        user_id: userId, position: jobTitle, company,
        template: selectedDesign, style: 'balanced',
        cv_data: { profil: '', erfahrung: '', ausbildung: '', skills: [], sprachen: '', anschreiben: editableText },
        cover_letter: editableText,
        applied_at: new Date().toISOString(),
        status: 'Gesendet',
      })
      if (!editingId) await handleSave()
      showToast(t.toastApplySuccess)
      setTimeout(() => { window.location.href = '/dashboard' }, 1800)
    } catch { showToast(t.toastApplyError, false) }
    finally { setApplying(false) }
  }

  function openLetter(l: CoverLetter) {
    setJobTitle(l.job_title); setCompany(l.company)
    setEditableText(l.content)
    setSelectedDesign((l.design as CVDesign) || 'NordicMinimal')
    setEditingId(l.id); setIsDirty(false); setView('preview')
  }

  const maxLetters = isPro ? MAX_PRO_LETTERS : MAX_FREE_LETTERS
  const atLimit = letters.length >= maxLetters

  const a4Props = { profile, jobTitle, company, text: editableText, design: selectedDesign, greeting: t.letterGreeting, closing: t.letterClosing, subjectPrefix: t.letterSubjectPrefix }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'DM Sans, Inter, sans-serif', color: C.white }}>
      {/* Hidden A4 for PDF capture */}
      <div style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <div id="cover-letter-a4-hidden"><CoverLetterA4 {...a4Props} /></div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, backgroundColor: toast.ok ? '#0D2A1A' : '#2A0D0D', color: toast.ok ? C.success : C.error, border: `1px solid ${toast.ok ? '#2A6B47' : '#6B2A2A'}` }}>
          {toast.msg}
        </div>
      )}

      {/* Validation Modal */}
      {validModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setValidModal(null) }}>
          <div style={{ backgroundColor: C.card, border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 16, padding: 32, maxWidth: 460, width: '100%' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 8 }}>Bitte fülle alle Pflichtfelder aus</div>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 20 }}>Für das Anschreiben werden folgende Profilangaben benötigt:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {validModal.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.error }}>
                  <span style={{ fontSize: 10 }}>✕</span> {item.label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/dashboard/meine-daten" style={{ ...btnPrimary(C.navy), textDecoration: 'none', flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>Felder ausfüllen →</a>
              <button onClick={() => setValidModal(null)} style={{ ...btnSecondary, flex: 1 }}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, padding: mob ? '12px 16px' : '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <a href="/dashboard" style={{ color: C.navy3, textDecoration: 'none', fontSize: 13 }}>{t.dashboard}</a>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700 }}>{t.letterTitle}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {view === 'preview' && (
            <>
              <button onClick={handleSave} disabled={saving}
                style={{ ...btnPrimary('#10b981'), padding: '8px 16px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Wird gespeichert…' : isDirty ? '💾 Speichern *' : '💾 Speichern'}
              </button>
              <button onClick={handleBackToList} style={btnSecondary}>{t.overview}</button>
            </>
          )}
          {view === 'input' && (
            <button onClick={() => { setView('list'); resetForm() }} style={btnSecondary}>{t.overview}</button>
          )}
          {view === 'list' && (
            <button onClick={() => { resetForm(); setView('input') }}
              disabled={atLimit}
              style={{ ...btnPrimary(), opacity: atLimit ? 0.5 : 1, cursor: atLimit ? 'not-allowed' : 'pointer' }}>
              {t.newLetter}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: mob ? '16px' : '32px 24px' }}>

        {/* ══ LIST VIEW ══════════════════════════════════════════════════════ */}
        {view === 'list' && (
          <div>
            {letters.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: C.mid }}>
                  {isPro
                    ? <>{letters.length}/{MAX_PRO_LETTERS} Anschreiben</>
                    : <>{letters.length}/{MAX_FREE_LETTERS} Anschreiben (Free-Plan)</>}
                </div>
              </div>
            )}
            {letters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', border: `1px solid ${C.border}`, borderRadius: 16 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t.letterEmptyTitle}</div>
                <div style={{ fontSize: 14, color: C.mid, marginBottom: 28 }}>{t.letterEmptyDesc}</div>
                <button onClick={() => { resetForm(); setView('input') }} style={{ ...btnPrimary(), padding: '14px 28px', fontSize: 15 }}>
                  ✨ Erstes Anschreiben erstellen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {letters.map(l => {
                  const editLimitReached = !isPro && l.edit_count >= MAX_FREE_EDITS
                  const editWarning      = !isPro && l.edit_count === MAX_FREE_EDITS - 1
                  return (
                    <div key={l.id} style={{ backgroundColor: C.card, border: `1px solid ${editLimitReached ? 'rgba(248,113,113,0.3)' : C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{l.job_title}</div>
                        <div style={{ fontSize: 13, color: C.mid, marginTop: 3, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>{l.company}</span>
                          <span>·</span>
                          <span>{new Date(l.created_at).toLocaleDateString('de-DE')}</span>
                          {!isPro ? (
                            <span style={{ color: editLimitReached ? C.error : editWarning ? C.amber : C.mid }}>
                              · {l.edit_count}/{MAX_FREE_EDITS} Bearb.
                            </span>
                          ) : (
                            <span>· {l.edit_count} Bearb.</span>
                          )}
                        </div>
                        {editLimitReached && (
                          <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>
                            Bearbeitungslimit erreicht — <a href="/dashboard" style={{ color: C.navy3 }}>Upgrade zu Pro</a>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openLetter(l)} disabled={editLimitReached}
                          style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13, opacity: editLimitReached ? 0.5 : 1, cursor: editLimitReached ? 'not-allowed' : 'pointer' }}>
                          Ansehen →
                        </button>
                        <button onClick={() => handleDelete(l.id)} style={{ ...btnDanger, padding: '8px 12px' }}>
                          {t.delete_}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {/* Locked "Pro" slot for free users */}
                {!isPro && letters.length >= MAX_FREE_LETTERS && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px dashed rgba(255,255,255,0.12)`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 100 }}>
                    <div style={{ fontSize: 24 }}>🔒</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid }}>Weiteres Anschreiben erstellen (Pro)</div>
                    <a href="/dashboard" style={{ ...btnPrimary(C.amber), padding: '7px 16px', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#000' }}>⭐ Upgrade zu Pro</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ INPUT VIEW ═════════════════════════════════════════════════════ */}
        {view === 'input' && (
          <div style={{ backgroundColor: C.card, borderRadius: 14, padding: mob ? 16 : 32, border: `1px solid ${C.border}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{t.newLetter}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>{t.letterJob}</label>
                <input value={jobTitle} onChange={e => { setJobTitle(e.target.value); if (errors.job) setErrors(p => ({ ...p, job: '' })) }}
                  style={{ ...inStyle, borderColor: errors.job ? C.error : 'rgba(255,255,255,0.1)' }}
                  placeholder={t.letterJobPlaceholder} />
                {errors.job && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{errors.job}</div>}
              </div>
              <div>
                <label style={labelStyle}>{t.letterCompany}</label>
                <input value={company} onChange={e => { setCompany(e.target.value); if (errors.company) setErrors(p => ({ ...p, company: '' })) }}
                  style={{ ...inStyle, borderColor: errors.company ? C.error : 'rgba(255,255,255,0.1)' }}
                  placeholder={t.letterCompanyPlaceholder} />
                {errors.company && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{errors.company}</div>}
              </div>
            </div>

            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
                <div style={{ width: 44, height: 44, border: `3px solid ${C.navy}`, borderTopColor: C.navy3, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 14, color: C.navy3 }}>{t.letterGenerating}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexDirection: mob ? 'column' : 'row' }}>
                <button onClick={handleGenerate} style={{ ...btnPrimary('#10b981'), fontSize: mob ? 16 : 15, padding: mob ? '14px 20px' : '13px 28px', minHeight: 48 }}>{t.letterGenerate}</button>
                <button onClick={() => { setView('list'); resetForm() }} style={{ ...btnSecondary, minHeight: 44 }}>{t.cancel}</button>
              </div>
            )}
          </div>
        )}

        {/* ══ PREVIEW VIEW ═══════════════════════════════════════════════════ */}
        {view === 'preview' && (
          <div>
            {/* Action bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: mob ? 'flex-start' : 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10, flexDirection: mob ? 'column' : 'row' }}>
              <h2 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, margin: 0 }}>{jobTitle} — {company}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'auto auto auto auto', gap: 8 }}>
                <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnPrimary('#ef4444'), opacity: exporting ? 0.7 : 1 }}>
                  {exporting ? '...' : t.letterPDF}
                </button>
                <button onClick={handleExportWord} style={btnPrimary('#2563eb')}>{t.letterWord}</button>
                <button onClick={() => setShowApplyModal(true)} style={btnPrimary('#10b981')}>
                  {t.letterApply}
                </button>
              </div>
            </div>

            {/* Editor + Design picker */}
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 260px', gap: 20, marginBottom: 24 }}>
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: C.navy3, marginBottom: 10, fontWeight: 500 }}>✏️ {t.letterEditHint}</div>
                <textarea value={editableText} onChange={e => { setEditableText(e.target.value); markDirty() }}
                  rows={16} style={{ ...inStyle, resize: 'vertical', lineHeight: 1.7, backgroundColor: 'rgba(255,255,255,0.02)', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>{t.letterDesignPick}</div>
                {!isPro && <div style={{ fontSize: 11, color: C.amber, marginBottom: 10 }}>{t.freeDesignNote}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DESIGNS.map(d => {
                    const locked = d.proOnly && !isPro
                    const sel    = selectedDesign === d.id
                    const cfg    = DESIGN_CFG[d.id]
                    return (
                      <button key={d.id}
                        onClick={() => { if (locked) { showToast(t.toastProOnly, false); return } setSelectedDesign(d.id); markDirty() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px solid ${sel ? cfg.accent : C.border}`, backgroundColor: sel ? `${cfg.headerBg}22` : 'transparent', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, fontFamily: 'inherit', color: C.white, width: '100%', textAlign: 'left' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: cfg.headerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{d.emoji}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{d.label}</div>
                          <div style={{ fontSize: 10, color: C.mid }}>{locked ? '🔒 PRO' : d.desc}</div>
                        </div>
                        {sel && <div style={{ marginLeft: 'auto', fontSize: 14, color: cfg.accent }}>✓</div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* A4 Preview */}
            <div>
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Vorschau — {DESIGNS.find(d => d.id === selectedDesign)?.label}</div>
              <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center', boxShadow: '0 8px 48px rgba(0,0,0,0.6)', flexShrink: 0 }}>
                  <CoverLetterA4 {...a4Props} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ BEWERBUNG BESTÄTIGEN MODAL ══════════════════════════════════════ */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowApplyModal(false) }}>
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bewerbung bestätigen</h2>
              <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', color: C.mid, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Job info */}
            <div style={{ backgroundColor: 'rgba(27,46,107,0.15)', border: `1px solid rgba(147,175,253,0.2)`, borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{jobTitle}</div>
              <div style={{ fontSize: 13, color: C.mid, marginTop: 2 }}>{company}</div>
            </div>

            {/* Design picker */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Design wählen</div>
              {!isPro && <div style={{ fontSize: 11, color: C.amber, marginBottom: 10 }}>Free-Plan: Nur Nordic Minimal verfügbar. <a href="/dashboard" style={{ color: C.navy3 }}>Upgrade zu Pro →</a></div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {DESIGNS.map(d => {
                  const locked = d.proOnly && !isPro
                  const sel    = selectedDesign === d.id
                  const cfg    = DESIGN_CFG[d.id]
                  return (
                    <button key={d.id}
                      onClick={() => { if (locked) { showToast(t.toastProOnly, false); return } setSelectedDesign(d.id); markDirty() }}
                      style={{ position: 'relative', padding: '12px 10px', borderRadius: 10, border: `2px solid ${sel ? C.navy : 'rgba(255,255,255,0.1)'}`, backgroundColor: sel ? 'rgba(27,46,107,0.25)' : '#0d0d1a', cursor: locked ? 'default' : 'pointer', fontFamily: 'inherit', color: C.white, textAlign: 'center', opacity: locked ? 0.7 : 1 }}>
                      {locked && (
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: C.amber, fontWeight: 700 }}>
                          🔒 PRO
                        </div>
                      )}
                      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: cfg.headerBg, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{d.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{d.label}</div>
                      {sel && <div style={{ fontSize: 10, color: C.navy3, marginTop: 2 }}>✓</div>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* A4 mini preview */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>Vorschau</div>
              <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 }}>
                <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', flexShrink: 0, marginBottom: '-52%' }}>
                  <CoverLetterA4 {...a4Props} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnPrimary('#ef4444'), flex: 1, opacity: exporting ? 0.7 : 1 }}>
                {exporting ? '...' : '⬇ PDF'}
              </button>
              <button onClick={handleExportWord} style={{ ...btnPrimary('#2563eb'), flex: 1 }}>⬇ Word</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary('#6366f1'), flex: 1, opacity: saving ? 0.7 : 1 }}>
                {saving ? t.saving : t.letterSave}
              </button>
              <button onClick={() => { setShowApplyModal(false); handleApply() }} disabled={applying}
                style={{ ...btnPrimary('#10b981'), flex: 2, opacity: applying ? 0.7 : 1, fontWeight: 700, fontSize: 15 }}>
                {applying ? 'Sende...' : '🚀 ' + t.letterApply}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
