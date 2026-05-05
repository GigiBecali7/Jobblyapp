'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JMark } from '@/components/JLogo'
import type { UserProfile, Application } from '@/lib/types'

interface Props {
  profile: UserProfile
  applications: Application[]
  justUpgraded: boolean
}

const C = {
  bg: '#0A0A0F',
  sidebar: '#0D1117',
  card: '#111827',
  border: 'rgba(255,255,255,0.07)',
  navy: '#1B2E6B',
  navy2: '#253A85',
  navy3: '#93AFFD',
  mid: '#8892A4',
  white: '#fff',
  success: '#4ADE80',
  purple: '#7C3AED',
  purple2: '#6D28D9',
}

const NAV = [
  { id: 'dashboard',    icon: '⊞',  label: 'Dashboard' },
  { id: 'jobs',         icon: '🔍', label: 'Jobs finden' },
  { id: 'applications', icon: '📋', label: 'Bewerbungen' },
  { id: 'cv',           icon: '📄', label: 'Lebenslauf' },
  { id: 'letter',       icon: '✉️', label: 'Anschreiben' },
  { id: 'profile',      icon: '👤', label: 'Meine Daten' },
  { id: 'stats',        icon: '📊', label: 'Statistiken' },
  { id: 'courses',      icon: '🎓', label: 'Karriere Kurse', badge: 'NEU' },
  { id: 'settings',     icon: '⚙️', label: 'Einstellungen' },
]

const COURSES = [
  { platform: 'Coursera', color: '#0056D2', initial: 'C', name: 'Data Analytics für Einsteiger', rating: '4.8', duration: '12 Std.' },
  { platform: 'LinkedIn', color: '#0A66C2', initial: 'in', name: 'Kommunikation im Business', rating: '4.7', duration: '6 Std.' },
  { platform: 'Udemy',    color: '#A435F0', initial: 'U', name: 'Project Management Basics', rating: '4.6', duration: '8 Std.' },
]

function makeMockJobs(position: string, city: string) {
  const pos = position || 'Professional'
  const loc = city || 'Wien'
  const companies = [
    { name: 'TechVision GmbH',      init: 'TV', color: '#6366f1' },
    { name: 'InnovateX',             init: 'IX', color: '#0ea5e9' },
    { name: 'Digital Solutions AG',  init: 'DS', color: '#8b5cf6' },
    { name: 'Smart Media Group',     init: 'SM', color: '#f59e0b' },
    { name: 'Karriere Hub GmbH',     init: 'KH', color: '#10b981' },
  ]
  const salaryBases = [55000, 50000, 48000, 42000, 38000]
  const skillSets = [
    ['Product Management', 'Strategie', 'Kommunikation'],
    ['Analyse', 'Daten', 'Excel'],
    ['Beratung', 'Strategie', 'Präsentation'],
    ['Marketing', 'Social Media', 'Content'],
    ['Koordination', 'Teamführung', 'Reporting'],
  ]
  const times = ['Vor 2 Stunden', 'Vor 5 Stunden', 'Vor 1 Tag', 'Vor 2 Tagen', 'Vor 3 Tagen']
  const matches = [92, 88, 80, 74, 68]
  const types = ['Vollzeit · Remote möglich', 'Vollzeit · Hybrid', 'Vollzeit', 'Teilzeit · Remote', 'Vollzeit · Vor Ort']
  const titles = [
    `Product Manager (m/w/d)`,
    `Business Analyst (m/w/d)`,
    `Consultant (m/w/d)`,
    `Marketing Manager (m/w/d)`,
    `Project Manager (m/w/d)`,
  ]

  return companies.map((c, i) => ({
    id: String(i + 1),
    company: c.name,
    initials: c.init,
    color: c.color,
    title: titles[i],
    location: `${loc}, Deutschland`,
    type: types[i],
    salary: `${salaryBases[i].toLocaleString('de')} € – ${(salaryBases[i] + 15000).toLocaleString('de')} €`,
    match: matches[i],
    skills: skillSets[i],
    posted: times[i],
    description: `Wir suchen einen engagierten ${pos} für unser wachsendes Team bei ${c.name}. Sie bringen Erfahrung in relevanten Bereichen mit und arbeiten gerne in einem dynamischen Umfeld.`,
  }))
}

function Sidebar({ active, onNav, profile, isPro, onUpgrade, onLogout }: {
  active: string; onNav: (id: string) => void
  profile: UserProfile; isPro: boolean
  onUpgrade: () => void; onLogout: () => void
}) {
  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase() || '?'

  return (
    <aside style={{
      width: 240, background: '#111827', borderRight: `0.5px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <JMark size={32} />
        <span style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-.3px' }}>
          Jobbly<span style={{ color: C.navy3, fontWeight: 400 }}>.ai</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(({ id, icon, label, badge }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: isActive ? 'rgba(27,46,107,0.5)' : 'transparent',
              color: isActive ? C.white : C.mid,
              fontFamily: 'inherit', fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              marginBottom: 2, transition: 'all .15s', textAlign: 'left',
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{ fontSize: 9, background: C.navy, color: C.navy3, padding: '2px 6px', borderRadius: 10, fontWeight: 700, letterSpacing: '.04em' }}>
                  {badge}
                </span>
              )}
              {id === 'jobs' && !badge && (
                <span style={{ fontSize: 10, background: 'rgba(27,46,107,0.5)', color: C.navy3, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>23</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Upgrade card */}
      {!isPro && (
        <div style={{ margin: '0 10px 12px', padding: '16px 14px', borderRadius: 12, background: 'rgba(27,46,107,0.3)', border: `0.5px solid rgba(37,58,133,0.5)` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 10 }}>Upgrade auf Premium</div>
          {['Automatisch bewerben', 'Mehr Matches', 'Exklusive Kurse', 'Priority Support'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.success, marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>✓</span>{f}
            </div>
          ))}
          <button onClick={onUpgrade} style={{
            width: '100%', marginTop: 12, padding: '10px',
            borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: C.white, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          }}>
            Jetzt upgraden
          </button>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.first_name} {profile.last_name}
          </div>
          <div style={{ fontSize: 10, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
        </div>
        <button onClick={onLogout} title="Abmelden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid, fontSize: 16, padding: 4, lineHeight: 1 }}>⋯</button>
      </div>
    </aside>
  )
}

function TopBar({ profile, isPro, onUpgrade }: { profile: UserProfile; isPro: boolean; onUpgrade: () => void }) {
  const [search, setSearch] = useState('')
  const initials = ((profile.first_name || '?').charAt(0)).toUpperCase()

  return (
    <header style={{
      height: 60, borderBottom: `0.5px solid ${C.border}`,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px',
      background: C.bg, flexShrink: 0,
    }}>
      <div style={{ flex: 1, position: 'relative', maxWidth: 520 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.mid, fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Suche nach Jobs, Unternehmen oder Keywords..."
          style={{
            width: '100%', padding: '9px 76px 9px 38px',
            borderRadius: 10, border: `0.5px solid ${C.border}`,
            background: 'rgba(255,255,255,0.04)', color: C.white,
            fontFamily: 'inherit', fontSize: 13, outline: 'none',
          }}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          color: C.mid, fontSize: 10, background: 'rgba(255,255,255,0.07)',
          padding: '3px 7px', borderRadius: 5, letterSpacing: '.02em',
        }}>⌘ K</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {isPro ? (
          <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.5)`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            ⭐ Premium
          </span>
        ) : (
          <button onClick={onUpgrade} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            ⭐ Premium
          </button>
        )}
        <button style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.mid }}>🔔</button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, cursor: 'pointer', border: `2px solid rgba(99,102,241,0.5)` }}>
          {initials}
        </div>
      </div>
    </header>
  )
}

function StatCard({ icon, value, label, sub, subColor }: { icon: string; value: string; label: string; sub?: string; subColor?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${C.border}` }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: '-.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.mid, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.success, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

function JobCard({ job, onClick }: { job: ReturnType<typeof makeMockJobs>[0]; onClick: () => void }) {
  const [bookmarked, setBookmarked] = useState(false)
  const matchColor = job.match >= 85 ? '#4ADE80' : job.match >= 70 ? '#f59e0b' : C.mid
  const extraSkills = job.skills.length > 2 ? `+${job.skills.length - 2}` : null

  return (
    <div
      onClick={onClick}
      style={{ padding: '16px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.015)', cursor: 'pointer', marginBottom: 10, transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,46,107,0.6)'; e.currentTarget.style.background = 'rgba(27,46,107,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Company avatar */}
        <div style={{ width: 46, height: 46, borderRadius: 10, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.white, flexShrink: 0 }}>
          {job.initials}
        </div>

        {/* Job info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>{job.company}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>{job.title}</div>
          <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>📍 {job.location} · {job.type}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {job.skills.slice(0, 2).map(s => (
              <span key={s} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(27,46,107,0.25)', color: C.navy3, border: `0.5px solid rgba(37,58,133,0.35)` }}>{s}</span>
            ))}
            {extraSkills && <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: C.mid }}>{extraSkills}</span>}
          </div>
        </div>

        {/* Match + bookmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: matchColor, lineHeight: 1 }}>{job.match}%</div>
          <div style={{ fontSize: 10, color: C.mid }}>Match</div>
          <button
            onClick={e => { e.stopPropagation(); setBookmarked(b => !b) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: bookmarked ? '#f59e0b' : C.mid, padding: 0, marginTop: 2 }}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
        <span style={{ fontSize: 11, color: C.mid }}>Gehalt: {job.salary}</span>
        <span style={{ fontSize: 11, color: C.mid }}>{job.posted}</span>
      </div>
    </div>
  )
}

function MatchRing({ pct }: { pct: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const color = pct >= 85 ? '#4ADE80' : pct >= 70 ? '#f59e0b' : C.navy3
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)}
        strokeLinecap="round" transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x={45} y={50} textAnchor="middle" fill={C.white} fontSize={18} fontWeight={700}>{pct}%</text>
    </svg>
  )
}

function JobDetailModal({ job, profile, onClose }: {
  job: ReturnType<typeof makeMockJobs>[0]; profile: UserProfile; onClose: () => void
}) {
  const [step, setStep] = useState<'detail' | 'letter' | 'review'>('detail')
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function generateLetter() {
    setLoading(true); setStep('letter')
    try {
      const res = await fetch('/api/one-click-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: { fullname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(), city: '', industry: '', experience: '', skills: '', lastjob: '' },
          jobTitle: job.title, jobCompany: job.company, jobDescription: job.description, lang: 'de',
        }),
      })
      const data = await res.json()
      setLetter(data.coverLetter || 'Anschreiben konnte nicht generiert werden.')
    } finally { setLoading(false) }
  }

  async function saveApplication() {
    await supabase.from('applications').insert({
      user_id: profile.id, position: job.title, company: job.company,
      template: 'classic', style: 'balanced',
      cv_data: { profil: '', erfahrung: '', ausbildung: '', skills: [], sprachen: '', anschreiben: letter },
      cover_letter: letter,
    })
    router.refresh(); onClose()
  }

  const analysisPoints = [
    `Dein Profil passt sehr gut zur gesuchten Position als ${job.title}.`,
    `${job.company} sucht Kandidaten mit genau deinem Erfahrungshintergrund.`,
    `Die Skills ${job.skills.join(', ')} decken sich mit deinem Profil.`,
    `Standort ${job.location} entspricht deinen Präferenzen.`,
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#0D1117', borderRadius: 16, border: `0.5px solid rgba(255,255,255,0.1)`, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.white, flexShrink: 0 }}>
            {job.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>{job.title}</div>
            <div style={{ fontSize: 12, color: C.mid }}>{job.company} · {job.location}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: C.mid, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {step === 'detail' && (
            <>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, padding: '20px', background: 'rgba(27,46,107,0.1)', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.3)` }}>
                <MatchRing pct={job.match} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>KI-Analyse: {job.match >= 85 ? 'Sehr gute Übereinstimmung' : job.match >= 70 ? 'Gute Übereinstimmung' : 'Teilweise passend'}</div>
                  <div style={{ fontSize: 12, color: C.mid }}>Basierend auf deinem Profil und der Stellenbeschreibung</div>
                  <div style={{ fontSize: 12, color: C.mid, marginTop: 4 }}>💰 {job.salary} · {job.type}</div>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.navy3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>KI-Analyse</div>
                {analysisPoints.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.success, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', padding: 13, borderRadius: 10, background: 'linear-gradient(135deg, #1B2E6B, #253A85)', color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} onClick={generateLetter}>
                ⚡ Bewerbung erstellen →
              </button>
            </>
          )}

          {step === 'letter' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 12 }}>✍️ KI-Anschreiben</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: C.mid }}>
                  <div style={{ marginBottom: 12, display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {[0, .2, .4].map(d => <span key={d} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.navy2, animation: `p 1.2s ease-in-out ${d}s infinite` }} />)}
                  </div>
                  Anschreiben wird generiert…
                </div>
              ) : (
                <>
                  <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={12} style={{ width: '100%', padding: '12px', borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, resize: 'vertical', outline: 'none' }} />
                  <button style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg, #1B2E6B, #253A85)', color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} onClick={() => setStep('review')}>
                    Bewerbung prüfen & senden →
                  </button>
                </>
              )}
            </>
          )}

          {step === 'review' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 16 }}>✅ Bewerbung bestätigen</div>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(27,46,107,0.1)', border: `0.5px solid rgba(27,46,107,0.3)`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.mid, marginBottom: 6 }}>Bewerbung für</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.white }}>{job.title}</div>
                <div style={{ fontSize: 13, color: C.mid }}>{job.company}</div>
              </div>
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 16, lineHeight: 1.6 }}>
                Dein Anschreiben wird gespeichert und die Bewerbung als &quot;Gesendet&quot; markiert.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setStep('letter')} style={{ padding: 11, borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Bearbeiten</button>
                <button onClick={saveApplication} style={{ padding: 11, borderRadius: 9, background: 'linear-gradient(135deg, #1B2E6B, #253A85)', color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Jetzt bewerben ✓</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RightSidebar({ applications }: { applications: Application[] }) {
  const [salary, setSalary] = useState(60000)

  const activity = useMemo(() => {
    const base = applications.slice(0, 3).map((app, i) => ({
      icon: '📋',
      text: 'Bewerbung angesehen',
      sub: `${app.company || app.position}`,
      time: ['Vor 2 Stunden', 'Vor 5 Stunden', 'Vor 1 Tag'][i] || 'Kürzlich',
    }))
    if (base.length === 0) {
      return [
        { icon: '🎯', text: 'Profil anlegen', sub: 'Starte deinen ersten Lebenslauf', time: 'Jetzt' },
        { icon: '🔔', text: 'Einladung erhalten', sub: 'Digital Solutions AG', time: 'Vor 5 Stunden' },
        { icon: '⭐', text: 'Neuer Job Match', sub: 'Product Manager bei TechCorp', time: 'Vor 1 Tag' },
      ]
    }
    return base
  }, [applications])

  return (
    <aside style={{ width: 288, flexShrink: 0, borderLeft: `0.5px solid ${C.border}`, padding: '24px 20px', overflowY: 'auto', background: C.bg }}>

      {/* Wunschgehalt */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Wunschgehalt</div>
          <span style={{ fontSize: 12, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>Bearbeiten</span>
        </div>
        <div style={{ fontSize: 11, color: C.mid, marginBottom: 10 }}>Deine Gehaltsvorstellung</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: '-.5px', marginBottom: 3 }}>
          {(salary - 5000).toLocaleString('de')} € – {(salary + 5000).toLocaleString('de')} €
        </div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Zielgehalt: {salary.toLocaleString('de')} €</div>
        <input
          type="range" min={45000} max={75000} step={1000} value={salary}
          onChange={e => setSalary(Number(e.target.value))}
          style={{ width: '100%', accentColor: C.purple, cursor: 'pointer', height: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.mid }}>45K €</span>
          <span style={{ fontSize: 11, color: C.mid }}>75K €</span>
        </div>

        {/* Marktvergleich */}
        <div style={{ marginTop: 16, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>Marktvergleich</div>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>Deine Gehaltsvorstellung liegt im Durchschnitt für deine Position.</div>
          <svg width="100%" height={44} viewBox="0 0 220 44" preserveAspectRatio="none">
            <polyline points="0,40 44,32 88,22 132,16 176,20 220,12" fill="none" stroke={C.purple} strokeWidth={2} strokeLinejoin="round" />
            <circle cx={132} cy={16} r={4} fill={C.navy3} />
          </svg>
        </div>
      </section>

      {/* Karriere Kurse */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Karriere Kurse</div>
          <span style={{ fontSize: 12, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>Alle anzeigen</span>
        </div>
        {COURSES.map(course => (
          <div key={course.name} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-.3px' }}>
              {course.initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</div>
              <div style={{ fontSize: 11, color: C.mid }}>
                {course.platform} · {course.rating}★ · {course.duration}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Aktivität */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Aktivität</div>
          <span style={{ fontSize: 12, color: C.mid, cursor: 'pointer' }}>Alle ▾</span>
        </div>
        {activity.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(27,46,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{a.text}</div>
              <div style={{ fontSize: 11, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.sub} · {a.time}</div>
            </div>
          </div>
        ))}
      </section>
    </aside>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function DashboardClient({ profile, applications, justUpgraded }: Props) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [selectedJob, setSelectedJob] = useState<ReturnType<typeof makeMockJobs>[0] | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const isPro = !!profile.is_pro

  const mockJobs = useMemo(() => makeMockJobs('', ''), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleUpgradeClick() {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { /* no-op */ }
  }

  const renderContent = () => {
    if (activeNav === 'applications') {
      return (
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 20 }}>Meine Bewerbungen</h2>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: C.mid, border: `0.5px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14 }}>Noch keine Bewerbungen. <Link href="/" style={{ color: C.navy3 }}>Erstelle jetzt eine →</Link></div>
            </div>
          ) : applications.map(app => (
            <div key={app.id} style={{ padding: '14px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{app.position}</div>
              <div style={{ fontSize: 12, color: C.mid, marginTop: 3 }}>
                {app.company && `${app.company} · `}
                {new Date(app.created_at).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (activeNav === 'settings') {
      return (
        <div style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 20 }}>Einstellungen</h2>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 9, background: 'rgba(27,46,107,0.2)', border: `0.5px solid rgba(27,46,107,0.4)`, color: C.navy3, textDecoration: 'none', fontSize: 13 }}>
            ← Zurück zum CV-Builder
          </Link>
        </div>
      )
    }

    if (activeNav === 'courses') {
      return (
        <div style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Karriere Kurse</h2>
          <p style={{ fontSize: 14, color: C.mid, marginBottom: 24 }}>Lerne die gefragtesten Skills und steigere deine Chancen auf dem Arbeitsmarkt.</p>
          {COURSES.map(course => (
            <div key={course.name} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', marginBottom: 10, cursor: 'pointer' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{course.initial}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 3 }}>{course.name}</div>
                <div style={{ fontSize: 12, color: C.mid }}>{course.platform} · {course.rating}★ · {course.duration}</div>
              </div>
              <span style={{ fontSize: 12, color: C.navy3, fontWeight: 500 }}>Kurs starten →</span>
            </div>
          ))}
        </div>
      )
    }

    // Default: dashboard home
    const firstName = profile.first_name || 'dort'
    return (
      <>
        {/* Header row with illustration placeholder */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            {justUpgraded && (
              <div style={{ fontSize: 12, color: C.success, background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, padding: '8px 14px', marginBottom: 14, display: 'inline-block' }}>
                🎉 Willkommen bei Jobbly Premium! Dein Abo ist jetzt aktiv.
              </div>
            )}
            <h1 style={{ fontSize: 30, fontWeight: 700, color: C.white, marginBottom: 6, letterSpacing: '-.5px' }}>
              Hallo {firstName}! 👋
            </h1>
            <p style={{ fontSize: 15, color: C.mid }}>Bereit für deinen nächsten Karriereschritt?</p>
          </div>
          {/* Decorative placeholder */}
          <div style={{ width: 160, height: 100, flexShrink: 0, background: 'rgba(27,46,107,0.15)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            📄✨
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
          <StatCard icon="💼" value="23" label="Passende Jobs" sub="+5 heute" subColor={C.success} />
          <StatCard icon="📊" value="85%" label="Profil Match" sub="Sehr gut" subColor={C.success} />
          <StatCard icon="📋" value={String(applications.length)} label="Bewerbungen" sub="Insgesamt" subColor={C.mid} />
          <StatCard icon="⭐" value="3" label="Einladungen" sub="Letzte 30 Tage" subColor={C.success} />
        </div>

        {/* Top job matches */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Top Job Matches für dich</div>
            <span style={{ fontSize: 13, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>Alle anzeigen</span>
          </div>
          {mockJobs.slice(0, 3).map(job => (
            <JobCard key={job.id} job={job} onClick={() => {
              if (!isPro) { setShowUpgrade(true); return }
              setSelectedJob(job)
            }} />
          ))}
        </div>

        {/* KI Anschreiben banner */}
        <div style={{ padding: '20px 22px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)', border: `0.5px solid rgba(99,102,241,0.35)`, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 14 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 3 }}>KI Anschreiben erstellen</div>
            <div style={{ fontSize: 12, color: C.mid }}>Erstelle ein individuelles Anschreiben, perfekt auf den Job zugeschnitten.</div>
          </div>
          <Link href="/" style={{ padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: C.white, textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Jetzt erstellen →
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
        <Sidebar
          active={activeNav} onNav={setActiveNav}
          profile={profile} isPro={isPro}
          onUpgrade={() => setShowUpgrade(true)} onLogout={handleLogout}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <TopBar profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {renderContent()}
            </main>
            {activeNav === 'dashboard' && <RightSidebar applications={applications} />}
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobDetailModal job={selectedJob} profile={profile} onClose={() => setSelectedJob(null)} />
      )}

      {showUpgrade && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowUpgrade(false)}
        >
          <div style={{ background: '#0D1117', borderRadius: 16, border: `0.5px solid rgba(255,255,255,0.1)`, width: '100%', maxWidth: 420, padding: 32 }}>
            <button onClick={() => setShowUpgrade(false)} style={{ float: 'right', background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: C.mid, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 4 }}>Jobbly Premium</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.white }}>€9.99<span style={{ fontSize: 15, color: C.mid, fontWeight: 400 }}>/Monat</span></div>
              <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>Jederzeit kündbar · Keine versteckten Kosten</div>
            </div>
            {[
              '⚡ Mit einem Klick bewerben — KI passt dein Anschreiben automatisch an',
              '🔔 Sofort-Benachrichtigung wenn Traumjobs erscheinen',
              '🚀 10 Bewerbungen in 5 Minuten',
              '📋 Unbegrenzte Bewerbungen, alle Premium Designs, PDF & Word Export',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', borderBottom: `0.5px solid ${C.border}` }}>
                <span>{f}</span>
              </div>
            ))}
            <button onClick={handleUpgradeClick} style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700 }}>
              Jetzt upgraden · €9.99/Monat →
            </button>
            <p style={{ fontSize: 11, color: C.mid, textAlign: 'center', marginTop: 10 }}>14-Tage Geld-zurück-Garantie · Gesichert durch Stripe</p>
          </div>
        </div>
      )}
    </>
  )
}
