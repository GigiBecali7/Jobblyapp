'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { trackEvent } from '@/components/MetaPixel'

const C = {
  bg: '#0A0A0F',
  card: '#0D1117',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  navy: '#1B2E6B',
  navy2: '#253A85',
  navy3: '#93AFFD',
  mid: '#8892A4',
  white: '#fff',
  success: '#4ADE80',
  amber: '#f59e0b',
  purple: '#7C3AED',
}

interface Props {
  profile: UserProfile & {
    photo_url?: string
    avatar_url?: string
    current_position?: string
    experience_level?: string
    industry?: string
    position?: string
    salary_target?: number
    work_model?: string
    city?: string
    radius?: string
    skills?: string[]
    languages?: Array<{ name: string; level: string }>
    onboarding_completed?: boolean
  }
}

function getSkillSuggestions(ind: string): string[] {
  const lc = ind.toLowerCase()
  if (lc.includes('it') || lc.includes('tech') || lc.includes('software') || lc.includes('entwickl') || lc.includes('digital'))
    return ['JavaScript', 'Python', 'React', 'TypeScript', 'SQL', 'Git', 'Docker', 'AWS']
  if (lc.includes('finan') || lc.includes('bank') || lc.includes('buchh') || lc.includes('steuer') || lc.includes('recht'))
    return ['Excel', 'SAP', 'SQL', 'PowerPoint', 'IFRS', 'Controlling', 'Bloomberg']
  if (lc.includes('market') || lc.includes('sales') || lc.includes('vertrieb') || lc.includes('werbung'))
    return ['Google Ads', 'SEO', 'Social Media', 'Content Marketing', 'Analytics', 'CRM', 'Copywriting']
  if (lc.includes('gesundh') || lc.includes('medizin') || lc.includes('pflege') || lc.includes('pharma'))
    return ['Patientenbetreuung', 'Erste Hilfe', 'Hygiene', 'Pflege', 'Medizindokumentation', 'SAP IS-H']
  if (lc.includes('ingenieur') || lc.includes('engineer') || lc.includes('maschinenb') || lc.includes('elektro'))
    return ['AutoCAD', 'SolidWorks', 'MATLAB', 'Projektmanagement', 'CAD', 'FEM', 'ISO 9001']
  if (lc.includes('design') || lc.includes('kreativ') || lc.includes('ux') || lc.includes('ui'))
    return ['Figma', 'Photoshop', 'Illustrator', 'After Effects', 'InDesign', 'Sketch', 'UX Research']
  if (lc.includes('bildung') || lc.includes('lehrer') || lc.includes('schule') || lc.includes('pädagog'))
    return ['Unterrichten', 'Präsentation', 'Pädagogik', 'E-Learning', 'Moodle', 'Didaktik']
  if (lc.includes('logistik') || lc.includes('transport') || lc.includes('spedition') || lc.includes('lager'))
    return ['SAP', 'Lagerverwaltung', 'Supply Chain', 'Excel', 'Zollabwicklung', 'ERP']
  return ['Microsoft Office', 'Teamarbeit', 'Kommunikation', 'Projektmanagement', 'Präsentation', 'Deutsch', 'Englisch']
}

const inSt: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 9,
  border: '0.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: 0,
}

export default function OnboardingClient({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [firstName, setFirstName] = useState(profile.first_name ?? '')
  const [lastName, setLastName] = useState(profile.last_name ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(
    profile.photo_url ?? profile.avatar_url ?? ''
  )

  // Step 2
  const [currentPosition, setCurrentPosition] = useState(profile.current_position ?? '')
  const [industry, setIndustry] = useState(profile.industry ?? '')
  const [experienceLevel, setExperienceLevel] = useState(profile.experience_level ?? '')

  // Step 3
  const [desiredPosition, setDesiredPosition] = useState(profile.position ?? '')
  const [desiredSalary, setDesiredSalary] = useState(profile.salary_target ?? 55000)

  // Step 4
  const [workModels, setWorkModels] = useState<string[]>(
    profile.work_model ? profile.work_model.split(',').map((s) => s.trim()).filter(Boolean) : []
  )
  const [city, setCity] = useState(profile.city ?? '')
  const [radius, setRadius] = useState(profile.radius ?? '')

  // Step 5
  const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [languages, setLanguages] = useState<Array<{ name: string; level: string }>>(
    profile.languages ?? []
  )
  const [langName, setLangName] = useState('')
  const [langLevel, setLangLevel] = useState('Fließend')

  function calcScore(): number {
    const checks = [
      !!firstName,
      !!lastName,
      !!(photoFile || photoPreview),
      !!currentPosition,
      !!industry,
      !!experienceLevel,
      !!desiredPosition,
      desiredSalary > 0,
      workModels.length > 0,
      !!city,
      skills.length > 0,
      languages.length > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }

  async function saveStep1() {
    setSaving(true)
    try {
      let finalPhotoUrl: string | null = null
      if (photoFile) {
        try {
          const ext = photoFile.name.split('.').pop() ?? 'jpg'
          const path = `avatars/${profile.id}/avatar.${ext}`
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, photoFile, { upsert: true })
          if (upErr) {
            console.error('Photo upload error:', upErr)
          } else {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
            finalPhotoUrl = urlData.publicUrl + `?t=${Date.now()}`
          }
        } catch (photoErr) {
          console.error('Photo upload exception:', photoErr)
        }
      }
      const updatePayload: Record<string, unknown> = {
        first_name: firstName,
        last_name: lastName,
      }
      if (finalPhotoUrl) {
        updatePayload.photo_url = finalPhotoUrl
        updatePayload.avatar_url = finalPhotoUrl
      }
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('saveStep1 error:', error)
    } catch (err) {
      console.error('saveStep1 exception:', err)
    } finally {
      setSaving(false)
    }
  }

  async function saveStep2() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          current_position: currentPosition,
          industry,
          experience: experienceLevel,
          experience_level: experienceLevel,
        } as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('saveStep2 error:', error)
    } catch (err) {
      console.error('saveStep2 exception:', err)
    } finally {
      setSaving(false)
    }
  }

  async function saveStep3() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          position: desiredPosition,
          salary_target: desiredSalary,
          desired_salary: desiredSalary,
          desired_position: desiredPosition,
        } as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('saveStep3 error:', error)
    } catch (err) {
      console.error('saveStep3 exception:', err)
    } finally {
      setSaving(false)
    }
  }

  async function saveStep4() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          work_model: workModels.join(','),
          city,
          radius,
        } as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('saveStep4 error:', error)
    } catch (err) {
      console.error('saveStep4 exception:', err)
    } finally {
      setSaving(false)
    }
  }

  async function saveStep5() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          skills,
          languages: JSON.stringify(languages),
        } as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('saveStep5 error:', error)
    } catch (err) {
      console.error('saveStep5 exception:', err)
    } finally {
      setSaving(false)
    }
  }

  async function finishOnboarding() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true } as Record<string, unknown>)
        .eq('id', profile.id)
      if (error) console.error('finishOnboarding error:', error)
      trackEvent('CompleteRegistration')
      router.push('/dashboard')
    } catch (err) {
      console.error('finishOnboarding exception:', err)
    } finally {
      setSaving(false)
    }
  }

  function addSkill(val: string) {
    const trimmed = val.trim()
    if (!trimmed || skills.includes(trimmed) || skills.length >= 10) return
    setSkills([...skills, trimmed])
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s))
  }

  function addLanguage() {
    const trimmed = langName.trim()
    if (!trimmed || languages.length >= 5) return
    if (languages.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) return
    setLanguages([...languages, { name: trimmed, level: langLevel }])
    setLangName('')
  }

  function removeLanguage(name: string) {
    setLanguages(languages.filter((l) => l.name !== name))
  }

  function toggleWorkModel(model: string) {
    if (workModels.includes(model)) {
      setWorkModels(workModels.filter((m) => m !== model))
    } else {
      setWorkModels([...workModels, model])
    }
  }

  const progressPct = ((step - 1) / 5) * 100

  const wrapSt: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: 16,
    overflowY: 'auto',
  }

  const cardSt: React.CSSProperties = {
    background: C.card,
    borderRadius: 20,
    border: `0.5px solid ${C.border}`,
    width: '100%',
    maxWidth: 540,
    padding: '36px 40px',
  }

  const labelSt: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: C.mid,
    marginBottom: 6,
    fontWeight: 500,
  }

  const btnPrimary: React.CSSProperties = {
    padding: '11px 22px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`,
    color: C.white,
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: saving ? 0.7 : 1,
  }

  const btnSecondary: React.CSSProperties = {
    padding: '11px 18px',
    borderRadius: 10,
    border: `0.5px solid ${C.border2}`,
    background: 'transparent',
    color: C.mid,
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  }

  const btnSkip: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: C.mid,
    fontFamily: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px 8px',
  }

  const pillBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: `0.5px solid ${C.border2}`,
    background: 'rgba(255,255,255,0.04)',
    color: C.mid,
    fontFamily: 'inherit',
    margin: '3px',
    transition: 'background 0.15s, color 0.15s',
  }

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`,
    color: C.white,
    border: `0.5px solid ${C.navy2}`,
  }

  const tagSt: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    background: 'rgba(147,175,253,0.12)',
    color: C.navy3,
    border: `0.5px solid rgba(147,175,253,0.25)`,
    margin: '3px',
  }

  const removeBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: C.navy3,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    fontFamily: 'inherit',
  }

  function ProgressBar() {
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.mid, fontWeight: 500 }}>Schritt {step} von 6</span>
          <span style={{ fontSize: 12, color: C.navy3, fontWeight: 600 }}>{Math.round(progressPct)}%</span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${C.navy}, ${C.navy3})`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    )
  }

  function StepEmoji({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.white, lineHeight: 1.3 }}>{title}</h2>
        {subtitle && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: C.mid, lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </div>
    )
  }

  function NavRow({
    onBack,
    onSkip,
    onNext,
    nextDisabled,
    nextLabel,
  }: {
    onBack?: () => void
    onSkip?: () => void
    onNext: () => void
    nextDisabled?: boolean
    nextLabel?: string
  }) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 28,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onBack && (
            <button style={btnSecondary} onClick={onBack} disabled={saving}>
              ← Zurück
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onSkip && (
            <button style={btnSkip} onClick={onSkip} disabled={saving}>
              Überspringen
            </button>
          )}
          <button
            style={{ ...btnPrimary, opacity: nextDisabled || saving ? 0.5 : 1 }}
            onClick={onNext}
            disabled={nextDisabled || saving}
          >
            {saving ? 'Wird gespeichert…' : (nextLabel ?? 'Weiter →')}
          </button>
        </div>
      </div>
    )
  }

  function renderStep1() {
    const combined = (firstName?.[0] ?? '') + (lastName?.[0] ?? '')
    const initials = combined || (profile.email?.[0]?.toUpperCase() ?? '?')

    return (
      <div key={1}>
        <ProgressBar />
        <StepEmoji
          emoji="🚀"
          title="Willkommen bei Jobbly! Lass uns dein Profil einrichten"
          subtitle="In wenigen Schritten findest du deinen Traumjob."
        />

        {/* Photo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: photoPreview ? 'transparent' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`,
              border: `2px solid ${C.border2}`,
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: C.white }}>
                {initials.toUpperCase()}
              </span>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <span style={{ fontSize: 20 }}>📷</span>
            </div>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: C.mid, lineHeight: 1.5 }}>
              Klicke auf das Bild um ein Profilfoto hochzuladen.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(136,146,164,0.6)' }}>
              JPG, PNG oder GIF · max. 5 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setPhotoFile(file)
              setPhotoPreview(URL.createObjectURL(file))
            }}
          />
        </div>

        {/* Name fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          <div>
            <label style={labelSt}>
              Vorname <span style={{ color: C.amber }}>*</span>
            </label>
            <input
              style={inSt}
              type="text"
              placeholder="Dein Vorname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={labelSt}>Nachname</label>
            <input
              style={inSt}
              type="text"
              placeholder="Dein Nachname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <NavRow
          onNext={async () => {
            await saveStep1()
            setStep(2)
          }}
          nextDisabled={!firstName.trim()}
        />
      </div>
    )
  }

  function renderStep2() {
    return (
      <div key={2}>
        <ProgressBar />
        <StepEmoji
          emoji="💼"
          title="Erzähl uns von deiner Karriere"
          subtitle="Damit zeigen wir dir die relevantesten Jobs."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSt}>Aktueller Job-Titel</label>
            <input
              style={inSt}
              type="text"
              placeholder="z.B. Software Engineer"
              value={currentPosition}
              onChange={(e) => setCurrentPosition(e.target.value)}
            />
          </div>
          <div>
            <label style={labelSt}>Branche</label>
            <input
              style={inSt}
              type="text"
              placeholder="z.B. IT & Technologie"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div>
            <label style={labelSt}>Erfahrungslevel</label>
            <select
              style={{ ...inSt, appearance: 'none' }}
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="" disabled>
                Bitte wählen…
              </option>
              <option value="Student / Berufseinsteiger">Student / Berufseinsteiger</option>
              <option value="1–3 Jahre Erfahrung">1–3 Jahre Erfahrung</option>
              <option value="3–5 Jahre Erfahrung">3–5 Jahre Erfahrung</option>
              <option value="5–10 Jahre Erfahrung">5–10 Jahre Erfahrung</option>
              <option value="10+ Jahre Erfahrung">10+ Jahre Erfahrung</option>
            </select>
          </div>
        </div>

        <NavRow
          onBack={() => setStep(1)}
          onSkip={async () => {
            await saveStep2()
            setStep(3)
          }}
          onNext={async () => {
            await saveStep2()
            setStep(3)
          }}
        />
      </div>
    )
  }

  function renderStep3() {
    return (
      <div key={3}>
        <ProgressBar />
        <StepEmoji emoji="🎯" title="Was ist dein Traumjob?" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelSt}>Wunschposition</label>
            <input
              style={inSt}
              type="text"
              placeholder="z.B. Product Manager"
              value={desiredPosition}
              onChange={(e) => setDesiredPosition(e.target.value)}
            />
          </div>

          <div>
            <label style={labelSt}>
              Gehaltsvorstellung:{' '}
              <span style={{ color: C.navy3, fontWeight: 700 }}>
                {desiredSalary.toLocaleString('de')} € / Jahr
              </span>
            </label>
            <input
              type="range"
              min={25000}
              max={150000}
              step={5000}
              value={desiredSalary}
              onChange={(e) => setDesiredSalary(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.navy3, cursor: 'pointer' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 11,
                color: C.mid,
              }}
            >
              <span>25k</span>
              <span>150k</span>
            </div>
          </div>
        </div>

        <NavRow
          onBack={() => setStep(2)}
          onSkip={async () => {
            await saveStep3()
            setStep(4)
          }}
          onNext={async () => {
            await saveStep3()
            setStep(4)
          }}
        />
      </div>
    )
  }

  function renderStep4() {
    const modelOptions = [
      { label: '🏠 Remote', value: 'Remote' },
      { label: '🔄 Hybrid', value: 'Hybrid' },
      { label: '🏙️ Vor Ort', value: 'Vor Ort' },
    ]

    return (
      <div key={4}>
        <ProgressBar />
        <StepEmoji emoji="📍" title="Wo möchtest du arbeiten?" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelSt}>Arbeitsmodell</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {modelOptions.map((opt) => (
                <button
                  key={opt.value}
                  style={workModels.includes(opt.value) ? pillActive : pillBase}
                  onClick={() => toggleWorkModel(opt.value)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelSt}>Stadt</label>
            <input
              style={inSt}
              type="text"
              placeholder="z.B. Wien"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div>
            <label style={labelSt}>Umkreis</label>
            <select
              style={{ ...inSt, appearance: 'none' }}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            >
              <option value="">Bitte wählen…</option>
              <option value="Nur diese Stadt">Nur diese Stadt</option>
              <option value="25 km">25 km</option>
              <option value="50 km">50 km</option>
              <option value="100 km">100 km</option>
              <option value="Österreichweit">Österreichweit</option>
              <option value="DACH-Region">DACH-Region</option>
            </select>
          </div>
        </div>

        <NavRow
          onBack={() => setStep(3)}
          onSkip={async () => {
            await saveStep4()
            setStep(5)
          }}
          onNext={async () => {
            await saveStep4()
            setStep(5)
          }}
        />
      </div>
    )
  }

  function renderStep5() {
    const suggestions = getSkillSuggestions(industry)
    const unusedSuggestions = suggestions.filter((s) => !skills.includes(s))

    function handleAddSkill() {
      addSkill(skillInput)
      setSkillInput('')
    }

    return (
      <div key={5}>
        <ProgressBar />
        <StepEmoji emoji="⭐" title="Deine Stärken" />

        {/* Skills */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ ...labelSt, marginBottom: 10 }}>Skills (max. 10)</label>

          {unusedSuggestions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: C.mid, margin: '0 0 6px' }}>Vorschläge:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {unusedSuggestions.map((s) => (
                  <button
                    key={s}
                    style={pillBase}
                    onClick={() => addSkill(s)}
                    disabled={skills.length >= 10}
                    type="button"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              style={{ ...inSt, flex: 1 }}
              type="text"
              placeholder="Skill hinzufügen…"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSkill()
                }
              }}
            />
            <button
              style={{ ...btnPrimary, whiteSpace: 'nowrap', padding: '10px 16px' }}
              onClick={handleAddSkill}
              disabled={!skillInput.trim() || skills.length >= 10}
              type="button"
            >
              Hinzufügen
            </button>
          </div>

          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {skills.map((s) => (
                <span key={s} style={tagSt}>
                  {s}
                  <button style={removeBtn} onClick={() => removeSkill(s)} type="button">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div>
          <label style={{ ...labelSt, marginBottom: 10 }}>Sprachen (max. 5)</label>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              style={{ ...inSt, flex: 1, minWidth: 120 }}
              type="text"
              placeholder="Sprache (z.B. Englisch)"
              value={langName}
              onChange={(e) => setLangName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLanguage()
                }
              }}
            />
            <select
              style={{ ...inSt, flex: '0 0 auto', width: 'auto', appearance: 'none', paddingRight: 32 }}
              value={langLevel}
              onChange={(e) => setLangLevel(e.target.value)}
            >
              <option value="Muttersprache">Muttersprache</option>
              <option value="Fließend">Fließend</option>
              <option value="Fortgeschritten">Fortgeschritten</option>
              <option value="Grundkenntnisse">Grundkenntnisse</option>
            </select>
            <button
              style={{ ...btnPrimary, whiteSpace: 'nowrap', padding: '10px 16px' }}
              onClick={addLanguage}
              disabled={!langName.trim() || languages.length >= 5}
              type="button"
            >
              Hinzufügen
            </button>
          </div>

          {languages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {languages.map((l) => (
                <span key={l.name} style={tagSt}>
                  {l.name} · {l.level}
                  <button style={removeBtn} onClick={() => removeLanguage(l.name)} type="button">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <NavRow
          onBack={() => setStep(4)}
          onSkip={async () => {
            await saveStep5()
            setStep(6)
          }}
          onNext={async () => {
            await saveStep5()
            setStep(6)
          }}
        />
      </div>
    )
  }

  function renderStep6() {
    const score = calcScore()
    const scoreMsg =
      score >= 80
        ? 'Perfekt! Dein Profil ist bereit. Wir suchen jetzt die besten Jobs für dich! 🎉'
        : score >= 50
        ? 'Guter Start! Vervollständige dein Profil für noch bessere Matches. 💪'
        : 'Fast geschafft! Füge mehr Details hinzu für perfekte Job-Matches. 🚀'

    const scoreColor = score >= 80 ? C.success : score >= 50 ? C.amber : C.navy3

    return (
      <div key={6} style={{ textAlign: 'center' }}>
        {/* Celebration header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              background: 'rgba(74,222,128,0.12)',
              border: '0.5px solid rgba(74,222,128,0.3)',
              color: C.success,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            100% abgeschlossen
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.white }}>
            Dein Profil ist fertig!
          </h2>
        </div>

        {/* Score circle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
            }}
          >
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - score / 100)}`}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 800, color: scoreColor }}>{score}%</span>
              <span style={{ fontSize: 11, color: C.mid }}>Profil-Score</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <p
          style={{
            fontSize: 14,
            color: C.mid,
            lineHeight: 1.6,
            maxWidth: 380,
            margin: '0 auto 28px',
          }}
        >
          {scoreMsg}
        </p>

        {/* CTA */}
        <button
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: `linear-gradient(135deg, ${C.purple}, #9F5CFF)`,
            color: C.white,
            fontFamily: 'inherit',
            fontSize: 15,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            marginBottom: 12,
          }}
          onClick={finishOnboarding}
          disabled={saving}
        >
          {saving ? 'Wird gespeichert…' : 'Zu meinen Job-Matches →'}
        </button>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: C.mid,
            fontFamily: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => setStep(5)}
          disabled={saving}
        >
          ← Zurück
        </button>
      </div>
    )
  }

  return (
    <div style={wrapSt}>
      <style>{`
        @media (max-width: 600px) {
          .onboarding-card {
            padding: 24px 20px !important;
          }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${C.navy3};
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(147,175,253,0.2);
        }
        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${C.navy3};
          cursor: pointer;
          border: none;
        }
        input[type=range] {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
          outline: none;
        }
        select option {
          background: #0D1117;
          color: #fff;
        }
      `}</style>
      <div className="onboarding-card" style={cardSt}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>
    </div>
  )
}
