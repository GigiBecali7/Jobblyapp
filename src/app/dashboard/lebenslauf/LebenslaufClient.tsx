'use client'
import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { CVDesign, FontFamily, FontSize, LineSpacing, CVProps, CVSections } from '@/components/cv/types'
import { DEFAULT_SECTIONS } from '@/components/cv/types'
import { getDashT, getCurrentLang } from '@/lib/dashboard-i18n'
import { useIsMobile } from '@/lib/useIsMobile'

const NordicMinimal  = dynamic(() => import('@/components/cv/NordicMinimal'),  { ssr: false })
const NordicSidebar  = dynamic(() => import('@/components/cv/NordicSidebar'),  { ssr: false })
const ModernSplit    = dynamic(() => import('@/components/cv/ModernSplit'),    { ssr: false })
const DarkPro        = dynamic(() => import('@/components/cv/DarkPro'),        { ssr: false })
const ExecutivePhoto = dynamic(() => import('@/components/cv/ExecutivePhoto'), { ssr: false })
const MonoElegant    = dynamic(() => import('@/components/cv/MonoElegant'),   { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  isPro: boolean
  existingCVCount: number
  profile: Record<string, unknown> | null
  userId: string
}

interface ExpEntry  { title: string; company: string; period: string; description: string }
interface EduEntry  { degree: string; institution: string; period: string }
interface LangEntry { language: string; level: string }

interface SavedCV {
  id: string
  name: string
  design: CVDesign
  data: CVProps
  expEntries: ExpEntry[]
  eduEntries: EduEntry[]
  langEntries: LangEntry[]
  skillTags: string[]
  createdAt: string
  editCount: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0F', card: '#0D1117', border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)', navy: '#1B2E6B', navy2: '#253A85',
  navy3: '#93AFFD', mid: '#8892A4', white: '#fff', success: '#4ADE80',
  amber: '#f59e0b', input: '#0d0d1a', error: '#f87171',
}

const DESIGNS: { id: CVDesign; label: string; desc: string; proOnly: boolean; accent: string; emoji: string }[] = [
  { id: 'NordicMinimal',   label: 'Nordic Minimal',  desc: 'Klar, sauber, zeitlos',         proOnly: false, accent: '#1B2E6B', emoji: '📋' },
  { id: 'NordicSidebar',  label: 'Nordic Sidebar',  desc: 'Beige Sidebar, elegant',        proOnly: true,  accent: '#8B7355', emoji: '🌿' },
  { id: 'ModernSplit',    label: 'Modern Split',    desc: 'Zweispaltig, luftig',            proOnly: true,  accent: '#7B78CC', emoji: '✨' },
  { id: 'DarkPro',        label: 'Dark Pro',        desc: 'Dunkel, professionell',         proOnly: true,  accent: '#C9A84C', emoji: '🌙' },
  { id: 'ExecutivePhoto', label: 'Executive Photo', desc: 'Großes Foto, Führungsebene',    proOnly: true,  accent: '#1B2E6B', emoji: '📸' },
  { id: 'MonoElegant',    label: 'Mono Elegant',    desc: 'Minimalistisch, modern',        proOnly: true,  accent: '#333',    emoji: '⬛' },
]

const FONT_FAMILIES: FontFamily[] = ['Inter', 'Georgia', 'Playfair Display', 'Roboto', 'Lato', 'Montserrat']

// ── Helpers ───────────────────────────────────────────────────────────────────
function serializeExp(entries: ExpEntry[]): string {
  return entries
    .filter(e => e.title || e.company || e.description)
    .map(e => [
      [e.title, e.company].filter(Boolean).join(' | '),
      e.period,
      e.description,
    ].filter(Boolean).join('\n'))
    .join('\n\n')
}

function serializeEdu(entries: EduEntry[]): string {
  return entries
    .filter(e => e.degree || e.institution)
    .map(e => [
      [e.degree, e.institution].filter(Boolean).join(' | '),
      e.period,
    ].filter(Boolean).join('\n'))
    .join('\n\n')
}

function serializeLangs(entries: LangEntry[]): string {
  return entries.filter(e => e.language).map(e => e.level ? `${e.language} (${e.level})` : e.language).join(', ')
}

function emptyExp(): ExpEntry  { return { title: '', company: '', period: '', description: '' } }
function emptyEdu(): EduEntry  { return { degree: '', institution: '', period: '' } }
function emptyLang(): LangEntry { return { language: '', level: '' } }

function initFromProfile(profile: Record<string, unknown> | null): Omit<CVProps, 'experience' | 'education' | 'languages' | 'skills'> {
  const p = profile || {}
  return {
    firstName: String(p.first_name || ''), lastName: String(p.last_name || ''),
    email: String(p.email || ''), phone: String(p.phone || ''),
    city: String(p.city || ''), linkedin: String(p.linkedin || ''),
    photoUrl: String(p.avatar_url || p.photo_url || p.photo || ''), position: String(p.position || ''),
    profile: '', fontFamily: 'Inter', fontSize: 'medium', lineSpacing: 'normal',
  }
}

// ── CV Renderer ───────────────────────────────────────────────────────────────
function CVRenderer({ design, props }: { design: CVDesign; props: CVProps }) {
  switch (design) {
    case 'NordicSidebar':  return <NordicSidebar  {...props} />
    case 'ModernSplit':    return <ModernSplit    {...props} />
    case 'DarkPro':        return <DarkPro        {...props} />
    case 'ExecutivePhoto': return <ExecutivePhoto {...props} />
    case 'MonoElegant':    return <MonoElegant    {...props} />
    default:               return <NordicMinimal  {...props} />
  }
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 9, fontSize: 13, backgroundColor: '#0d0d1a', color: '#fff',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const taStyle: React.CSSProperties = { ...inStyle, resize: 'vertical', lineHeight: 1.6 }
const selStyle: React.CSSProperties = { ...inStyle, cursor: 'pointer' }
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: C.mid,
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8,
}
const btnPrimary = (bg = C.navy): React.CSSProperties => ({
  backgroundColor: bg, color: C.white, border: 'none', borderRadius: 9,
  padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 6,
})
const btnSecondary: React.CSSProperties = {
  backgroundColor: C.input, color: C.mid, border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 9, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}
const btnDanger: React.CSSProperties = {
  backgroundColor: 'transparent', color: '#f87171',
  border: `1px solid rgba(248,113,113,0.3)`, borderRadius: 7,
  padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
}

const MAX_FREE_EDITS = 5

// ── Main Component ────────────────────────────────────────────────────────────
export default function LebenslaufClient({ isPro, existingCVCount, profile, userId }: Props) {
  const lang        = getCurrentLang()
  const t           = getDashT(lang)
  const mob         = useIsMobile()

  // Build localized sections object for CV designs
  const sections: CVSections = {
    profile: t.sectionProfile, experience: t.sectionExperience,
    education: t.sectionEducation, skills: t.sectionSkills,
    languages: t.sectionLanguages, contact: t.sectionContact,
  }

  // ── State ──
  const [view, setView]         = useState<'list' | 'build'>('list')
  const [step, setStep]         = useState<1 | 2 | 3>(1)
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cvName, setCvName]     = useState('Mein Lebenslauf')
  const [design, setDesign]     = useState<CVDesign>('NordicMinimal')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal]   = useState('')

  // Form fields
  const [fields, setFields] = useState(() => initFromProfile(profile))
  const [expEntries, setExpEntries] = useState<ExpEntry[]>([emptyExp()])
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([emptyEdu()])
  const [langEntries, setLangEntries] = useState<LangEntry[]>([emptyLang()])
  const [skillTags, setSkillTags] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [profileText, setProfileText] = useState('')
  const [fontFamily, setFontFamily] = useState<FontFamily>('Inter')
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('normal')

  // UI state
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)
  const [exporting, setExporting]   = useState(false)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const skillInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/cv/list')
      .then(r => r.json())
      .then(json => {
        if (json.cvs) {
          setSavedCVs(json.cvs.map((row: Record<string, unknown>) => {
            const content = (row.content as Record<string, unknown>) || {}
            return {
              id: row.id as string,
              name: (row.title as string) || 'Lebenslauf',
              design: (row.design as CVDesign) || 'NordicMinimal',
              data: (content.data as CVProps) || {},
              expEntries: (content.expEntries as ExpEntry[]) || [],
              eduEntries: (content.eduEntries as EduEntry[]) || [],
              langEntries: (content.langEntries as LangEntry[]) || [],
              skillTags: (content.skillTags as string[]) || [],
              createdAt: (row.created_at as string) || new Date().toISOString(),
              editCount: (row.edit_count as number) || 0,
            } as SavedCV
          }))
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Computed current CVProps ──
  const currentProps: CVProps = {
    ...fields,
    profile: profileText,
    experience: serializeExp(expEntries),
    education: serializeEdu(eduEntries),
    languages: serializeLangs(langEntries),
    skills: skillTags,
    fontFamily, fontSize, lineSpacing, sections,
  }

  // ── List actions ──
  function startNew() {
    setFields(initFromProfile(profile))
    setExpEntries([emptyExp()]); setEduEntries([emptyEdu()])
    setLangEntries([emptyLang()]); setSkillTags([]); setSkillInput('')
    setProfileText(''); setDesign('NordicMinimal'); setCvName('Mein Lebenslauf')
    setEditingId(null); setErrors({}); setStep(1); setView('build')
  }

  function openEdit(cv: SavedCV) {
    if (!isPro && cv.editCount >= MAX_FREE_EDITS) {
      showToast(`Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen. Upgrade zu Pro!`, false)
      return
    }
    setFields({
      firstName: cv.data.firstName || '', lastName: cv.data.lastName || '',
      email: cv.data.email || '', phone: cv.data.phone || '', city: cv.data.city || '',
      linkedin: cv.data.linkedin || '', photoUrl: cv.data.photoUrl || '', position: cv.data.position || '',
      profile: cv.data.profile || '',
      fontFamily: cv.data.fontFamily || 'Inter', fontSize: cv.data.fontSize || 'medium',
      lineSpacing: cv.data.lineSpacing || 'normal',
    })
    setProfileText(cv.data.profile || '')
    setExpEntries(cv.expEntries?.length ? cv.expEntries : [emptyExp()])
    setEduEntries(cv.eduEntries?.length ? cv.eduEntries : [emptyEdu()])
    setLangEntries(cv.langEntries?.length ? cv.langEntries : [emptyLang()])
    setSkillTags(cv.skillTags?.length ? cv.skillTags : cv.data.skills || [])
    setFontFamily(cv.data.fontFamily || 'Inter')
    setFontSize(cv.data.fontSize || 'medium')
    setLineSpacing(cv.data.lineSpacing || 'normal')
    setDesign(cv.design); setCvName(cv.name); setEditingId(cv.id)
    setErrors({}); setStep(1); setView('build')
  }

  async function deleteCv(id: string) {
    const res = await fetch('/api/cv/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { setSavedCVs(prev => prev.filter(c => c.id !== id)); showToast(t.toastDeleted) }
    else { showToast('Fehler beim Löschen', false) }
  }

  async function duplicateCv(cv: SavedCV) {
    const res = await fetch('/api/cv/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${cv.name} (${t.copy})`, design: cv.design,
        content: { data: cv.data, expEntries: cv.expEntries, eduEntries: cv.eduEntries, langEntries: cv.langEntries, skillTags: cv.skillTags },
      }),
    })
    const json = await res.json()
    if (json.cv) {
      const row = json.cv as Record<string, unknown>
      const content = (row.content as Record<string, unknown>) || {}
      setSavedCVs(prev => [{ id: row.id as string, name: (row.title as string) || cv.name, design: (row.design as CVDesign) || cv.design, data: (content.data as CVProps) || cv.data, expEntries: (content.expEntries as ExpEntry[]) || cv.expEntries, eduEntries: (content.eduEntries as EduEntry[]) || cv.eduEntries, langEntries: (content.langEntries as LangEntry[]) || cv.langEntries, skillTags: (content.skillTags as string[]) || cv.skillTags, createdAt: (row.created_at as string) || new Date().toISOString(), editCount: 0 }, ...prev])
      showToast(t.toastDuplicated)
    } else if (json.limitReached) {
      showToast(json.error || t.toastFreeLimit, false)
    } else {
      showToast('Fehler beim Duplizieren', false)
    }
  }

  async function renameCv(id: string, newName: string) {
    const cv = savedCVs.find(c => c.id === id)
    if (!cv || !newName.trim()) return
    const res = await fetch('/api/cv/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, title: newName.trim(), design: cv.design,
        content: { data: cv.data, expEntries: cv.expEntries, eduEntries: cv.eduEntries, langEntries: cv.langEntries, skillTags: cv.skillTags },
      }),
    })
    if (res.ok) { setSavedCVs(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c)) }
  }

  // ── Skills tag input ──
  function addSkill(raw: string) {
    const s = raw.trim()
    if (s && !skillTags.includes(s)) setSkillTags(prev => [...prev, s])
    setSkillInput('')
  }

  function removeSkill(s: string) { setSkillTags(prev => prev.filter(x => x !== s)) }

  // ── Experience / Education helpers ──
  function updExp(i: number, k: keyof ExpEntry, v: string) {
    setExpEntries(prev => prev.map((e, j) => j === i ? { ...e, [k]: v } : e))
  }
  function addExp() { setExpEntries(prev => [...prev, emptyExp()]) }
  function removeExp(i: number) { if (expEntries.length > 1) setExpEntries(prev => prev.filter((_, j) => j !== i)) }

  function updEdu(i: number, k: keyof EduEntry, v: string) {
    setEduEntries(prev => prev.map((e, j) => j === i ? { ...e, [k]: v } : e))
  }
  function addEdu() { setEduEntries(prev => [...prev, emptyEdu()]) }
  function removeEdu(i: number) { if (eduEntries.length > 1) setEduEntries(prev => prev.filter((_, j) => j !== i)) }

  function updLang(i: number, k: keyof LangEntry, v: string) {
    setLangEntries(prev => prev.map((e, j) => j === i ? { ...e, [k]: v } : e))
  }
  function addLang() { setLangEntries(prev => [...prev, emptyLang()]) }
  function isDupLang(name: string, idx: number) {
    const n = name.trim().toLowerCase()
    return n !== '' && langEntries.some((e, i) => i !== idx && e.language.trim().toLowerCase() === n)
  }
  function removeLang(i: number) { if (langEntries.length > 1) setLangEntries(prev => prev.filter((_, j) => j !== i)) }

  // ── Validation ──
  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!fields.firstName.trim()) errs.firstName = t.errorFirstName
    if (!fields.position.trim()) errs.position = t.errorPosition
    const hasExp = expEntries.some(e => e.title.trim() || e.company.trim())
    const hasEdu = eduEntries.some(e => e.degree.trim() || e.institution.trim())
    if (!hasExp && !hasEdu) errs.experience = t.errorExperience
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── AI Generation ──
  async function handleGenerate() {
    if (!validate()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fields.firstName, lastName: fields.lastName,
          email: fields.email, phone: fields.phone, city: fields.city,
          linkedin: fields.linkedin, position: fields.position,
          experienceRaw: serializeExp(expEntries),
          educationRaw: serializeEdu(eduEntries),
          skillsRaw: skillTags.join(', '),
          languagesRaw: serializeLangs(langEntries),
          lang,
        }),
      })
      const json = await res.json()
      if (json.cvData) {
        if (json.cvData.profile) setProfileText(json.cvData.profile)
        if (json.cvData.skills?.length) setSkillTags(json.cvData.skills)
        // If experience/education were enhanced, merge into first entry description
        if (json.cvData.experience && !expEntries.some(e => e.description.length > 20)) {
          setExpEntries(prev => prev.map((e, i) => i === 0 ? { ...e, description: json.cvData.experience } : e))
        }
        showToast('KI-Inhalt generiert! ✓')
      }
    } catch { showToast(t.toastGenerateError, false) }
    finally { setGenerating(false) }
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true)
    try {
      const editingCV = editingId ? savedCVs.find(c => c.id === editingId) : null
      if (!isPro && editingCV && editingCV.editCount >= MAX_FREE_EDITS) {
        showToast(`Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen. Upgrade zu Pro!`, false)
        return
      }
      if (!isPro && editingCV && editingCV.editCount === MAX_FREE_EDITS - 1) {
        showToast(`Letzte Bearbeitung! Free-Plan erlaubt max. ${MAX_FREE_EDITS}. Upgrade für unbegrenzte Bearbeitungen.`, true)
      }
      const res = await fetch('/api/cv/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          title: cvName,
          design,
          content: { data: currentProps, expEntries, eduEntries, langEntries, skillTags },
        }),
      })
      const json = await res.json()
      if (json.limitReached) { showToast(json.error || t.toastFreeLimit, false); return }
      if (!res.ok) { showToast(json.error || 'Speichern fehlgeschlagen', false); return }

      const row = json.cv as Record<string, unknown>
      const content = (row.content as Record<string, unknown>) || {}
      const savedCv: SavedCV = {
        id: row.id as string,
        name: (row.title as string) || cvName,
        design: (row.design as CVDesign) || design,
        data: (content.data as CVProps) || currentProps,
        expEntries: (content.expEntries as ExpEntry[]) || expEntries,
        eduEntries: (content.eduEntries as EduEntry[]) || eduEntries,
        langEntries: (content.langEntries as LangEntry[]) || langEntries,
        skillTags: (content.skillTags as string[]) || skillTags,
        createdAt: (row.created_at as string) || new Date().toISOString(),
        editCount: (row.edit_count as number) || 0,
      }
      if (editingId) {
        setSavedCVs(prev => prev.map(c => c.id === editingId ? savedCv : c))
      } else {
        setSavedCVs(prev => [savedCv, ...prev])
        setEditingId(savedCv.id)
      }
      showToast(t.toastSaved)
    } catch { showToast('Speichern fehlgeschlagen', false) }
    finally { setSaving(false) }
  }

  // ── PDF Export ──
  async function handleExportPDF() {
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF }       = await import('jspdf')
      const el = document.getElementById('cv-pdf-capture')
      if (!el) { showToast(t.toastPdfError, false); return }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
      pdf.save(`lebenslauf-${fields.lastName || 'export'}.pdf`)
    } catch { showToast(t.toastPdfError, false) }
    finally { setExporting(false) }
  }

  // ── Word Export ──
  async function handleExportWord() {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const doc = new Document({ sections: [{ properties: {}, children: [
        new Paragraph({ text: `${fields.firstName} ${fields.lastName}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: fields.position, bold: true })] }),
        new Paragraph({ text: '' }),
        ...[`${fields.email}`, `${fields.phone}`, `${fields.city}`].filter(Boolean).map(s => new Paragraph({ text: s })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: sections.profile, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: profileText }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: sections.experience, heading: HeadingLevel.HEADING_2 }),
        ...serializeExp(expEntries).split('\n').filter(Boolean).map(l => new Paragraph({ text: l })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: sections.education, heading: HeadingLevel.HEADING_2 }),
        ...serializeEdu(eduEntries).split('\n').filter(Boolean).map(l => new Paragraph({ text: l })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: sections.skills, heading: HeadingLevel.HEADING_2 }),
        ...skillTags.map(s => new Paragraph({ text: `• ${s}` })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: sections.languages, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: serializeLangs(langEntries) }),
      ] }] })
      const blob = await Packer.toBlob(doc)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url
      a.download = `lebenslauf-${fields.lastName || 'export'}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast(t.toastWordError, false) }
  }

  const levelOpts = [t.levelNative, t.levelFluent, t.levelAdvanced, t.levelIntermediate, t.levelBasic]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'DM Sans, Inter, sans-serif', color: C.white }}>

      {/* Hidden full-size render for PDF capture */}
      <div style={{ position: 'fixed', left: -9999, top: 0, width: 794, height: 1123, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
        <div id="cv-pdf-capture"><CVRenderer design={design} props={currentProps} /></div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: toast.ok ? '#0D2A1A' : '#2A0D0D', color: toast.ok ? C.success : C.error, border: `1px solid ${toast.ok ? '#2A6B47' : '#6B2A2A'}` }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, padding: mob ? '12px 16px' : '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <a href="/dashboard" style={{ color: C.navy3, textDecoration: 'none', fontSize: 13 }}>{t.dashboard}</a>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: C.white }}>{t.cvTitle}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {view === 'build' && (
            <>
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => step > (s as 1|2|3) && setStep(s as 1|2|3)}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, cursor: step > s ? 'pointer' : 'default', backgroundColor: step >= s ? C.navy : 'rgba(255,255,255,0.06)', color: step >= s ? C.white : C.mid }}>
                  {s}
                </button>
              ))}
              <button onClick={() => setView('list')} style={btnSecondary}>{t.overview}</button>
            </>
          )}
          {view === 'list' && (
            <button onClick={startNew} style={btnPrimary()}>{t.newCV}</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: mob ? '16px' : '32px 24px' }}>

        {/* ══ LIST VIEW ══════════════════════════════════════════════════════ */}
        {view === 'list' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: C.mid }}>Lade Lebensläufe…</div>
          ) : savedCVs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t.cvEmptyTitle}</div>
              <div style={{ fontSize: 14, color: C.mid, marginBottom: 28 }}>{t.cvEmptyDesc}</div>
              <button onClick={startNew} style={{ ...btnPrimary(), padding: '14px 28px', fontSize: 15 }}>{t.cvCreateFirst}</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {savedCVs.map(cv => {
                const editLimitReached = !isPro && cv.editCount >= MAX_FREE_EDITS
                const editWarning      = !isPro && cv.editCount === MAX_FREE_EDITS - 1
                return (
                  <div key={cv.id} style={{ backgroundColor: C.card, border: `1px solid ${editLimitReached ? 'rgba(248,113,113,0.3)' : C.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {renamingId === cv.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={renameVal} onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { renameCv(cv.id, renameVal || cv.name); setRenamingId(null) } }}
                          style={{ ...inStyle, flex: 1 }} autoFocus />
                        <button onClick={() => { renameCv(cv.id, renameVal || cv.name); setRenamingId(null) }} style={btnPrimary()}>✓</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{cv.name}</div>
                    )}
                    <div style={{ fontSize: 12, color: C.mid, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>{DESIGNS.find(d => d.id === cv.design)?.label}</span>
                      <span>·</span>
                      <span>{new Date(cv.createdAt).toLocaleDateString()}</span>
                      {!isPro && (
                        <span style={{ color: editLimitReached ? C.error : editWarning ? C.amber : C.mid }}>
                          · {cv.editCount}/{MAX_FREE_EDITS} Bearb.
                        </span>
                      )}
                    </div>
                    {editLimitReached && (
                      <div style={{ fontSize: 11, color: C.error, background: 'rgba(248,113,113,0.08)', borderRadius: 6, padding: '6px 10px' }}>
                        Bearbeitungslimit erreicht — Upgrade zu Pro für unbegrenzte Bearbeitungen
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(cv)} disabled={editLimitReached} style={{ ...btnPrimary(), padding: '7px 14px', fontSize: 12, opacity: editLimitReached ? 0.5 : 1, cursor: editLimitReached ? 'not-allowed' : 'pointer' }}>{t.edit}</button>
                      <button onClick={() => { setRenamingId(cv.id); setRenameVal(cv.name) }} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12 }}>{t.rename}</button>
                      <button onClick={() => duplicateCv(cv)} style={{ ...btnSecondary, padding: '7px 12px', fontSize: 12 }}>{t.duplicate}</button>
                      <button onClick={() => deleteCv(cv.id)} style={{ ...btnDanger, padding: '7px 12px' }}>{t.delete_}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ══ BUILD VIEW ═════════════════════════════════════════════════════ */}
        {view === 'build' && (
          <>
            {/* ── STEP 1: Design picker ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{t.designStep}</h2>
                <p style={{ color: C.mid, fontSize: 14, marginBottom: 24 }}>{isPro ? t.proDesignNote : t.freeDesignNote}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
                  {DESIGNS.map(d => {
                    const locked = d.proOnly && !isPro
                    const sel    = design === d.id
                    return (
                      <div key={d.id} onClick={() => { if (locked) { showToast(t.toastProOnly, false); return } setDesign(d.id) }}
                        style={{ position: 'relative', backgroundColor: sel ? 'rgba(27,46,107,0.25)' : '#0d0d1a', border: `2px solid ${sel ? '#1B2E6B' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 20, cursor: locked ? 'default' : 'pointer', boxShadow: sel ? '0 0 0 2px rgba(27,46,107,0.4)' : 'none', transition: 'all .15s' }}>
                        {locked && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
                            <span style={{ fontSize: 22 }}>🔒</span>
                            <span style={{ backgroundColor: C.amber, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>PRO</span>
                          </div>
                        )}
                        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: d.accent, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{d.emoji}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{d.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{d.desc}</div>
                        {sel && !locked && <div style={{ marginTop: 8, fontSize: 12, color: '#93AFFD', fontWeight: 600 }}>✓ Ausgewählt</div>}
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => setStep(2)} style={{ ...btnPrimary(), padding: '12px 32px', fontSize: 15 }}>{t.next}</button>
              </div>
            )}

            {/* ── STEP 2: Form ── */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t.formStep}</h2>
                  <div style={{ fontSize: 12, color: C.mid, background: C.card, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}` }}>
                    {t.designStep}: <span style={{ color: C.navy3 }}>{DESIGNS.find(d => d.id === design)?.label}</span>
                  </div>
                </div>

                {/* ── Contact info ── */}
                <Section title="Kontaktdaten">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                    {([
                      ['firstName', t.firstName], ['lastName', t.lastName],
                      ['email', t.email], ['phone', t.phone],
                      ['city', t.city], ['linkedinUrl', t.linkedinUrl],
                      ['position', t.position], ['photoUrl', t.photoUrl],
                    ] as [keyof typeof fields, string][]).map(([k, label]) => (
                      <div key={k}>
                        <label style={labelStyle}>{label}</label>
                        <input value={(fields[k] as string) || ''}
                          onChange={e => { setFields(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }}
                          style={{ ...inStyle, borderColor: errors[k] ? C.error : 'rgba(255,255,255,0.1)' }} />
                        {errors[k] && <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>{errors[k]}</div>}
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ── Profile / Summary ── */}
                <Section title={t.profileSummary}>
                  <label style={labelStyle}>{t.profileSummary}</label>
                  <textarea value={profileText} onChange={e => setProfileText(e.target.value)}
                    rows={3} placeholder={t.profilePlaceholder} style={taStyle} />
                  <div style={{ fontSize: 11, color: C.mid, textAlign: 'right', marginTop: 4 }}>{profileText.length} {t.charCount}</div>
                </Section>

                {/* ── Berufserfahrung ── */}
                <Section title={t.experience} error={errors.experience}>
                  {expEntries.map((e, i) => (
                    <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy3 }}>Eintrag {i + 1}</div>
                        {expEntries.length > 1 && (
                          <button onClick={() => removeExp(i)} style={btnDanger}>{t.removeEntry}</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>{t.jobTitle}</label>
                          <input value={e.title} onChange={ev => updExp(i, 'title', ev.target.value)} style={inStyle} placeholder="z.B. Senior Developer" />
                        </div>
                        <div>
                          <label style={labelStyle}>{t.company}</label>
                          <input value={e.company} onChange={ev => updExp(i, 'company', ev.target.value)} style={inStyle} placeholder="z.B. Siemens AG" />
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>{t.period}</label>
                        <input value={e.period} onChange={ev => updExp(i, 'period', ev.target.value)} style={inStyle} placeholder="z.B. 2021 – 2024" />
                      </div>
                      <div>
                        <label style={labelStyle}>{t.description}</label>
                        <textarea value={e.description} onChange={ev => updExp(i, 'description', ev.target.value)} rows={3} style={taStyle} placeholder="Aufgaben, Verantwortlichkeiten, Erfolge..." />
                      </div>
                    </div>
                  ))}
                  <button onClick={addExp} style={{ ...btnSecondary, fontSize: 13, width: '100%', padding: '10px', textAlign: 'center' }}>{t.addExperience}</button>
                  {errors.experience && <div style={{ fontSize: 11, color: C.error, marginTop: 6 }}>{errors.experience}</div>}
                </Section>

                {/* ── Ausbildung ── */}
                <Section title={t.education}>
                  {eduEntries.map((e, i) => (
                    <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy3 }}>Eintrag {i + 1}</div>
                        {eduEntries.length > 1 && (
                          <button onClick={() => removeEdu(i)} style={btnDanger}>{t.removeEntry}</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>{t.degree}</label>
                          <input value={e.degree} onChange={ev => updEdu(i, 'degree', ev.target.value)} style={inStyle} placeholder="z.B. B.Sc. Informatik" />
                        </div>
                        <div>
                          <label style={labelStyle}>{t.institution}</label>
                          <input value={e.institution} onChange={ev => updEdu(i, 'institution', ev.target.value)} style={inStyle} placeholder="z.B. TU Wien" />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>{t.period}</label>
                        <input value={e.period} onChange={ev => updEdu(i, 'period', ev.target.value)} style={inStyle} placeholder="z.B. 2016 – 2020" />
                      </div>
                    </div>
                  ))}
                  <button onClick={addEdu} style={{ ...btnSecondary, fontSize: 13, width: '100%', padding: '10px', textAlign: 'center' }}>{t.addEducation}</button>
                </Section>

                {/* ── Skills Tags ── */}
                <Section title={t.skills}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {skillTags.map(s => (
                      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(27,46,107,0.3)', border: `1px solid rgba(147,175,253,0.3)`, color: C.navy3, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>
                        {s}
                        <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: C.navy3, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input ref={skillInputRef} value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                      placeholder={t.skillsPlaceholder} style={{ ...inStyle, flex: 1 }} />
                    <button onClick={() => addSkill(skillInput)} style={{ ...btnPrimary(), padding: '10px 16px' }}>+</button>
                  </div>
                </Section>

                {/* ── Languages ── */}
                <Section title={t.languages}>
                  {langEntries.map((e, i) => {
                    const dup = isDupLang(e.language, i)
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                        <div>
                          {i === 0 && <label style={labelStyle}>{t.language}</label>}
                          <input
                            type="text"
                            value={e.language}
                            onChange={ev => updLang(i, 'language', ev.target.value)}
                            placeholder="z.B. Deutsch"
                            style={{ ...inStyle, borderColor: dup ? C.error : 'rgba(255,255,255,0.1)' }}
                          />
                          {dup && <div style={{ fontSize: 11, color: C.error, marginTop: 3 }}>Sprache bereits vorhanden</div>}
                        </div>
                        <div>
                          {i === 0 && <label style={labelStyle}>{t.level}</label>}
                          <select value={e.level} onChange={ev => updLang(i, 'level', ev.target.value)} style={selStyle}>
                            <option value="">—</option>
                            {levelOpts.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <button onClick={() => removeLang(i)} style={{ ...btnDanger, height: 40, alignSelf: 'flex-end' }} disabled={langEntries.length === 1}>×</button>
                      </div>
                    )
                  })}
                  <button onClick={addLang} style={{ ...btnSecondary, fontSize: 13 }}>{t.addLanguage}</button>
                </Section>

                {/* ── CV name ── */}
                <Section title={t.cvName}>
                  <input value={cvName} onChange={e => setCvName(e.target.value)} style={inStyle} placeholder="z.B. Bewerbung 2025" />
                </Section>

                {/* ── Action row ── */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  <button onClick={() => setStep(1)} style={btnSecondary}>{t.back}</button>
                  <button onClick={handleGenerate} disabled={generating}
                    style={{ ...btnPrimary('#10b981'), opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer' }}>
                    {generating ? t.generating : t.generateAI}
                  </button>
                  <button onClick={() => { if (validate()) setStep(3) }} style={btnPrimary()}>{t.preview}</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Preview & Export ── */}
            {step === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{t.previewStep}</h2>
                    <p style={{ color: C.mid, fontSize: 13, margin: 0 }}>Typografie anpassen, speichern und exportieren</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setStep(2)} style={btnSecondary}>{t.back}</button>
                    <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary('#6366f1'), opacity: saving ? 0.7 : 1 }}>
                      {saving ? t.saving : t.save}
                    </button>
                    <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnPrimary('#ef4444'), opacity: exporting ? 0.7 : 1 }}>
                      {exporting ? '...' : t.exportPDF}
                    </button>
                    <button onClick={handleExportWord} style={btnPrimary('#2563eb')}>{t.exportWord}</button>
                  </div>
                </div>

                {/* Typography toolbar */}
                <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {[
                    { label: t.font, key: 'fontFamily' as const, opts: FONT_FAMILIES.map(f => ({ v: f, l: f })) },
                    { label: t.fontSize, key: 'fontSize' as const, opts: [{ v: 'small', l: t.sizeSmall }, { v: 'medium', l: t.sizeMedium }, { v: 'large', l: t.sizeLarge }] },
                    { label: t.lineSpacing, key: 'lineSpacing' as const, opts: [{ v: 'compact', l: t.spacingCompact }, { v: 'normal', l: t.spacingNormal }, { v: 'relaxed', l: t.spacingRelaxed }] },
                  ].map(({ label, key, opts }) => (
                    <div key={key}>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>{label}</div>
                      <select
                        value={key === 'fontFamily' ? fontFamily : key === 'fontSize' ? fontSize : lineSpacing}
                        onChange={e => {
                          if (key === 'fontFamily') setFontFamily(e.target.value as FontFamily)
                          else if (key === 'fontSize') setFontSize(e.target.value as FontSize)
                          else setLineSpacing(e.target.value as LineSpacing)
                        }}
                        style={{ ...selStyle, width: 'auto', minWidth: 120 }}>
                        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* A4 scaled preview */}
                <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                  <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', boxShadow: '0 8px 48px rgba(0,0,0,0.6)', borderRadius: 2, flexShrink: 0 }}>
                    <CVRenderer design={design} props={currentProps} />
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

// ── Section wrapper component ─────────────────────────────────────────────────
function Section({ title, children, error }: { title: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ backgroundColor: '#0D1117', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 12, padding: '20px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#93AFFD', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        {error && <span style={{ fontSize: 11, color: '#f87171', fontWeight: 400 }}>{error}</span>}
      </div>
      {children}
    </div>
  )
}
