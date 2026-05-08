'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JMark } from '@/components/JLogo'
import Onboarding from '@/components/Onboarding'
import type { UserProfile, Application } from '@/lib/types'

interface Props {
  profile: UserProfile
  applications: Application[]
  justUpgraded: boolean
}

const C = {
  bg: '#0A0A0F', sidebar: '#111827', card: '#0D1117',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  navy: '#1B2E6B', navy2: '#253A85', navy3: '#93AFFD',
  mid: '#8892A4', white: '#fff', success: '#4ADE80', amber: '#f59e0b',
  purple: '#7C3AED', purple2: '#6D28D9',
}

type NavId = 'dashboard' | 'jobs' | 'applications' | 'cv' | 'letter' | 'profile' | 'stats' | 'courses' | 'settings'

const NAV: { id: NavId; icon: string; label: string; badge?: string }[] = [
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
  { platform: 'Coursera', color: '#0056D2', initial: 'C', name: 'Data Analytics für Einsteiger', rating: '4.8', duration: '12 Std.', url: '#' },
  { platform: 'LinkedIn', color: '#0A66C2', initial: 'in', name: 'Kommunikation im Business', rating: '4.7', duration: '6 Std.', url: '#' },
  { platform: 'Udemy',    color: '#A435F0', initial: 'U', name: 'Project Management Basics', rating: '4.6', duration: '8 Std.', url: '#' },
  { platform: 'Coursera', color: '#0056D2', initial: 'C', name: 'Excel für Fortgeschrittene', rating: '4.7', duration: '10 Std.', url: '#' },
  { platform: 'Udemy',    color: '#A435F0', initial: 'U', name: 'KI & Machine Learning Grundlagen', rating: '4.9', duration: '20 Std.', url: '#' },
  { platform: 'LinkedIn', color: '#0A66C2', initial: 'in', name: 'Leadership & Teamführung', rating: '4.5', duration: '5 Std.', url: '#' },
]

const APP_STATUSES = ['Gesendet', 'Angesehen', 'Interview', 'Angebot', 'Abgelehnt'] as const
type AppStatus = typeof APP_STATUSES[number]
const STATUS_COLORS: Record<AppStatus, string> = {
  Gesendet: '#8892A4', Angesehen: '#93AFFD', Interview: '#f59e0b', Angebot: '#4ADE80', Abgelehnt: '#f87171',
}

function makeMockJobs() {
  const companies = [
    { name: 'TechVision GmbH', init: 'TV', color: '#6366f1' },
    { name: 'InnovateX', init: 'IX', color: '#0ea5e9' },
    { name: 'Digital Solutions AG', init: 'DS', color: '#8b5cf6' },
    { name: 'Smart Media Group', init: 'SM', color: '#f59e0b' },
    { name: 'Karriere Hub GmbH', init: 'KH', color: '#10b981' },
    { name: 'Alpine Software', init: 'AS', color: '#ec4899' },
    { name: 'Vienna Fintech', init: 'VF', color: '#14b8a6' },
  ]
  const titles = ['Product Manager (m/w/d)', 'Business Analyst (m/w/d)', 'Consultant (m/w/d)', 'Marketing Manager (m/w/d)', 'Project Manager (m/w/d)', 'Senior Developer (m/w/d)', 'Data Scientist (m/w/d)']
  const locations = ['Wien', 'München', 'Hamburg', 'Berlin', 'Graz', 'Zürich', 'Frankfurt']
  const types = ['Vollzeit · Remote möglich', 'Vollzeit · Hybrid', 'Vollzeit', 'Teilzeit · Remote', 'Vollzeit · Vor Ort', 'Vollzeit · Remote', 'Vollzeit · Hybrid']
  const salaries = [[55000, 70000], [50000, 65000], [48000, 63000], [45000, 58000], [52000, 67000], [65000, 85000], [60000, 78000]]
  const matches = [92, 88, 80, 74, 68, 85, 77]
  const skillSets = [['Product Management', 'Strategie', 'Kommunikation'], ['Analyse', 'Daten', 'Excel'], ['Beratung', 'Strategie', 'Präsentation'], ['Marketing', 'Social Media', 'Content'], ['Koordination', 'Teamführung', 'Reporting'], ['React', 'TypeScript', 'Node.js'], ['Python', 'ML', 'Statistics']]
  const times = ['Vor 2 Stunden', 'Vor 5 Stunden', 'Vor 1 Tag', 'Vor 2 Tagen', 'Vor 3 Tagen', 'Gerade eben', 'Vor 4 Stunden']
  return companies.map((c, i) => ({
    id: String(i + 1), company: c.name, initials: c.init, color: c.color,
    title: titles[i], location: `${locations[i]}, Deutschland/Österreich`, type: types[i],
    salary: `${salaries[i][0].toLocaleString('de')} € – ${salaries[i][1].toLocaleString('de')} €`,
    match: matches[i], skills: skillSets[i], posted: times[i],
    description: `Wir suchen einen engagierten ${titles[i].replace(' (m/w/d)', '')} für unser wachsendes Team bei ${c.name}. Sie bringen Erfahrung mit und arbeiten gerne im Team.`,
    industry: i < 2 ? 'tech' : i < 4 ? 'marketing' : 'other',
  }))
}

// ── Avatar Popup ──────────────────────────────────────────────────────────────
function AvatarPopup({ profile, isPro, onNavigate, side }: { profile: UserProfile; isPro: boolean; onNavigate: () => void; side: 'top' | 'left' }) {
  return (
    <div style={{
      position: 'absolute', [side === 'top' ? 'right' : 'left']: side === 'top' ? 0 : 50,
      [side === 'top' ? 'top' : 'bottom']: side === 'top' ? 48 : 0,
      background: '#0D1117', border: `0.5px solid ${C.border2}`, borderRadius: 12,
      padding: '14px 16px', minWidth: 200, zIndex: 100,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 2 }}>{profile.first_name} {profile.last_name}</div>
      <div style={{ fontSize: 11, color: C.mid, marginBottom: 10 }}>{profile.email}</div>
      <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, display: 'inline-block', background: isPro ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)', color: isPro ? '#a78bfa' : C.mid, border: `0.5px solid ${isPro ? 'rgba(124,58,237,0.4)' : C.border}`, fontWeight: 600, marginBottom: 10 }}>
        {isPro ? '⭐ Premium' : 'Free Plan'}
      </div>
      <button onClick={onNavigate} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${C.border}`, color: C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'left' }}>
        Meine Daten bearbeiten →
      </button>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, profile, isPro, onUpgrade, onLogout }: {
  active: NavId; onNav: (id: NavId) => void
  profile: UserProfile; isPro: boolean; onUpgrade: () => void; onLogout: () => void
}) {
  const [showPopup, setShowPopup] = useState(false)
  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase()

  return (
    <aside style={{ width: 240, background: C.sidebar, borderRight: `0.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <JMark size={32} />
        <span style={{ fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: '-.3px' }}>
          Jobbly<span style={{ color: C.navy3, fontWeight: 400 }}>.ai</span>
        </span>
      </div>

      <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {NAV.map(({ id, icon, label, badge }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: isActive ? 'rgba(27,46,107,0.5)' : 'transparent',
              color: isActive ? C.white : C.mid,
              fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 600 : 400,
              marginBottom: 2, transition: 'all .15s', textAlign: 'left',
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && <span style={{ fontSize: 9, background: C.navy, color: C.navy3, padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>{badge}</span>}
              {id === 'jobs' && !badge && <span style={{ fontSize: 10, background: 'rgba(27,46,107,0.5)', color: C.navy3, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>23</span>}
            </button>
          )
        })}
      </nav>

      {/* Premium upgrade card */}
      {!isPro && (
        <div style={{ margin: '0 10px 12px', padding: '18px 16px', borderRadius: 14, background: 'rgba(27,46,107,0.28)', border: `0.5px solid rgba(37,58,133,0.5)` }}>
          <div style={{ textAlign: 'center', fontSize: 24, marginBottom: 8 }}>👑</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 12, textAlign: 'center' }}>Upgrade auf Premium</div>
          {[
            '1-Klick Bewerbung — KI bewirbt sich für dich',
            'Sofort-Alarm bei Traumjobs',
            'Eigener KI-Assistent 24/7',
            'Unbegrenzte Bewerbungen',
            'Exklusive CV-Designs mit Foto',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: C.success, marginBottom: 6, lineHeight: 1.4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✦</span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{f}</span>
            </div>
          ))}
          <button onClick={onUpgrade} style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
            Jetzt upgraden
          </button>
        </div>
      )}

      {/* User footer with hover popup */}
      <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div
          style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0, cursor: 'pointer', position: 'relative' }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
          onClick={() => { setShowPopup(false); onNav('profile') }}
        >
          {initials}
          {showPopup && <AvatarPopup profile={profile} isPro={isPro} onNavigate={() => { setShowPopup(false); onNav('profile') }} side="left" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.first_name} {profile.last_name}
          </div>
          <div style={{ fontSize: 10, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
        </div>
        <button onClick={onLogout} title="Abmelden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid, fontSize: 16, padding: 4 }}>↩</button>
      </div>
    </aside>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ profile, isPro, onUpgrade, onNav }: { profile: UserProfile; isPro: boolean; onUpgrade: () => void; onNav: (id: NavId) => void }) {
  const [search, setSearch] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const initials = (profile.first_name || '?').charAt(0).toUpperCase()

  return (
    <header style={{ height: 60, borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', background: C.bg, flexShrink: 0 }}>
      <div style={{ flex: 1, position: 'relative', maxWidth: 520 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.mid, fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Suche nach Jobs, Unternehmen oder Keywords..."
          style={{ width: '100%', padding: '9px 76px 9px 38px', borderRadius: 10, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.mid, fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 5 }}>⌘ K</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {isPro ? (
          <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.5)`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>⭐ Premium</span>
        ) : (
          <button onClick={onUpgrade} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>⭐ Premium</button>
        )}
        <button style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.mid }}>🔔</button>
        <div
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, cursor: 'pointer', border: '2px solid rgba(99,102,241,0.5)', position: 'relative' }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
          onClick={() => { setShowPopup(false); onNav('profile') }}
        >
          {initials}
          {showPopup && <AvatarPopup profile={profile} isPro={isPro} onNavigate={() => { setShowPopup(false); onNav('profile') }} side="top" />}
        </div>
      </div>
    </header>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
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

// ── Job card ──────────────────────────────────────────────────────────────────
function JobCard({ job, onClick, compact }: { job: ReturnType<typeof makeMockJobs>[0]; onClick: () => void; compact?: boolean }) {
  const [bookmarked, setBookmarked] = useState(false)
  const matchColor = job.match >= 85 ? C.success : job.match >= 70 ? C.amber : C.mid

  return (
    <div
      onClick={onClick}
      style={{ padding: compact ? '12px 14px' : '16px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.015)', cursor: 'pointer', marginBottom: compact ? 6 : 10, transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,46,107,0.6)'; e.currentTarget.style.background = 'rgba(27,46,107,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: compact ? 40 : 46, height: compact ? 40 : 46, borderRadius: 10, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0 }}>{job.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 2 }}>{job.company}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>{job.title}</div>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: compact ? 0 : 7 }}>📍 {job.location} · {job.type}</div>
          {!compact && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
              {job.skills.slice(0, 2).map(s => <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(27,46,107,0.25)', color: C.navy3, border: `0.5px solid rgba(37,58,133,0.35)` }}>{s}</span>)}
              {job.skills.length > 2 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: C.mid }}>+{job.skills.length - 2}</span>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: matchColor, lineHeight: 1 }}>{job.match}%</div>
          <div style={{ fontSize: 10, color: C.mid }}>Match</div>
          <button onClick={e => { e.stopPropagation(); setBookmarked(b => !b) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: bookmarked ? C.amber : C.mid, padding: 0 }}>
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `0.5px solid ${C.border}` }}>
          <span style={{ fontSize: 11, color: C.mid }}>Gehalt: {job.salary}</span>
          <span style={{ fontSize: 11, color: C.mid }}>{job.posted}</span>
        </div>
      )}
    </div>
  )
}

// ── Match ring ────────────────────────────────────────────────────────────────
function MatchRing({ pct }: { pct: number }) {
  const r = 36, circ = 2 * Math.PI * r
  const color = pct >= 85 ? C.success : pct >= 70 ? C.amber : C.navy3
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)}
        strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      <text x={45} y={50} textAnchor="middle" fill={C.white} fontSize={18} fontWeight={700}>{pct}%</text>
    </svg>
  )
}

// ── Job detail modal ──────────────────────────────────────────────────────────
function JobDetailModal({ job, profile, onClose }: { job: ReturnType<typeof makeMockJobs>[0]; profile: UserProfile; onClose: () => void }) {
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0D1117', borderRadius: 16, border: `0.5px solid rgba(255,255,255,0.1)`, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.white, flexShrink: 0 }}>{job.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>{job.title}</div>
            <div style={{ fontSize: 12, color: C.mid }}>{job.company} · {job.location}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: C.mid, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          {step === 'detail' && (
            <>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, padding: 20, background: 'rgba(27,46,107,0.1)', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.3)` }}>
                <MatchRing pct={job.match} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>KI-Analyse: {job.match >= 85 ? 'Sehr gute Übereinstimmung' : 'Gute Übereinstimmung'}</div>
                  <div style={{ fontSize: 12, color: C.mid }}>💰 {job.salary} · {job.type}</div>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                {[
                  `Dein Profil passt sehr gut zur gesuchten Position als ${job.title}.`,
                  `${job.company} sucht Kandidaten mit genau deinem Erfahrungshintergrund.`,
                  `Skills ${job.skills.join(', ')} decken sich mit deinem Profil.`,
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.success, fontSize: 12, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', padding: 13, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} onClick={generateLetter}>
                ⚡ Bewerbung erstellen →
              </button>
            </>
          )}
          {step === 'letter' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 12 }}>✍️ KI-Anschreiben</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: C.mid }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                    {[0, .2, .4].map(d => <span key={d} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.navy2, animation: `p 1.2s ease-in-out ${d}s infinite` }} />)}
                  </div>
                  Anschreiben wird generiert…
                </div>
              ) : (
                <>
                  <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={10} style={{ width: '100%', padding: 12, borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, resize: 'vertical', outline: 'none' }} />
                  <button style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} onClick={() => setStep('review')}>
                    Bewerbung prüfen →
                  </button>
                </>
              )}
            </>
          )}
          {step === 'review' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 16 }}>✅ Bewerbung bestätigen</div>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(27,46,107,0.1)', border: `0.5px solid rgba(27,46,107,0.3)`, marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.white }}>{job.title}</div>
                <div style={{ fontSize: 13, color: C.mid }}>{job.company}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setStep('letter')} style={{ padding: 11, borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Bearbeiten</button>
                <button onClick={saveApplication} style={{ padding: 11, borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Jetzt bewerben ✓</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────
function RightSidebar({ applications }: { applications: Application[] }) {
  const [salary, setSalary] = useState(60000)
  const activity = useMemo(() => {
    if (applications.length === 0) return [
      { icon: '🎯', text: 'Profil anlegen', sub: 'Starte deinen ersten Lebenslauf', time: 'Jetzt' },
      { icon: '🔔', text: 'Einladung erhalten', sub: 'Digital Solutions AG', time: 'Vor 5 Stunden' },
      { icon: '⭐', text: 'Neuer Job Match', sub: 'Product Manager bei TechCorp', time: 'Vor 1 Tag' },
    ]
    return applications.slice(0, 3).map((app, i) => ({
      icon: '📋', text: 'Bewerbung angesehen', sub: `${app.company || app.position}`,
      time: ['Vor 2 Stunden', 'Vor 5 Stunden', 'Vor 1 Tag'][i] || 'Kürzlich',
    }))
  }, [applications])

  return (
    <aside style={{ width: 288, flexShrink: 0, borderLeft: `0.5px solid ${C.border}`, padding: '24px 20px', overflowY: 'auto', background: C.bg }}>
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
        <input type="range" min={45000} max={75000} step={1000} value={salary} onChange={e => setSalary(Number(e.target.value))}
          style={{ width: '100%', accentColor: C.purple, cursor: 'pointer', height: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.mid }}>45K €</span>
          <span style={{ fontSize: 11, color: C.mid }}>75K €</span>
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>Marktvergleich</div>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>Deine Gehaltsvorstellung liegt im Durchschnitt für deine Position.</div>
          <svg width="100%" height={44} viewBox="0 0 220 44" preserveAspectRatio="none">
            <polyline points="0,40 44,32 88,22 132,16 176,20 220,12" fill="none" stroke={C.purple} strokeWidth={2} strokeLinejoin="round" />
            <circle cx={132} cy={16} r={4} fill={C.navy3} />
          </svg>
        </div>
      </section>
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Karriere Kurse</div>
          <span style={{ fontSize: 12, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>Alle anzeigen</span>
        </div>
        {COURSES.slice(0, 3).map(course => (
          <div key={course.name} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{course.initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.name}</div>
              <div style={{ fontSize: 11, color: C.mid }}>{course.platform} · {course.rating}★ · {course.duration}</div>
            </div>
          </div>
        ))}
      </section>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Aktivität</div>
          <span style={{ fontSize: 12, color: C.mid, cursor: 'pointer' }}>Alle ▾</span>
        </div>
        {activity.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(27,46,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
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

// ── Section: Jobs finden ──────────────────────────────────────────────────────
function JobsSection({ jobs, isPro, onSelect, onNeedPro }: { jobs: ReturnType<typeof makeMockJobs>; isPro: boolean; onSelect: (j: ReturnType<typeof makeMockJobs>[0]) => void; onNeedPro: () => void }) {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [workType, setWorkType] = useState('')
  const [minMatch, setMinMatch] = useState(0)

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false
    if (location && !j.location.toLowerCase().includes(location.toLowerCase())) return false
    if (workType && !j.type.toLowerCase().includes(workType.toLowerCase())) return false
    if (j.match < minMatch) return false
    return true
  })

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Jobs finden</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 20 }}>{jobs.length} passende Jobs für dein Profil</p>
      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Jobtitel, Unternehmen…" style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Stadt, Region…" style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        <select value={workType} onChange={e => setWorkType(e.target.value)} style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: '#0D1117', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">Alle Modelle</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Vor Ort">Vor Ort</option>
        </select>
        <select value={String(minMatch)} onChange={e => setMinMatch(Number(e.target.value))} style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: '#0D1117', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="0">Alle Matches</option>
          <option value="70">70%+</option>
          <option value="80">80%+</option>
          <option value="90">90%+</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: C.mid, border: `0.5px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14 }}>Keine Jobs gefunden. Ändere deine Filter.</div>
        </div>
      ) : filtered.map(job => (
        <JobCard key={job.id} job={job} onClick={() => { if (!isPro) { onNeedPro(); return }; onSelect(job) }} />
      ))}
    </div>
  )
}

// ── Section: Bewerbungen ──────────────────────────────────────────────────────
function ApplicationsSection({ applications, profile }: { applications: Application[]; profile: UserProfile }) {
  const supabase = createClient()
  const [appStatuses, setAppStatuses] = useState<Record<string, AppStatus>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState('')
  const [newComp, setNewComp] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function getStatus(id: string): AppStatus { return appStatuses[id] || 'Gesendet' }
  function setStatus(id: string, status: AppStatus) { setAppStatuses(p => ({ ...p, [id]: status })) }

  async function addApplication() {
    if (!newPos.trim()) return
    setSaving(true)
    await supabase.from('applications').insert({
      user_id: profile.id, position: newPos, company: newComp,
      template: 'classic', style: 'balanced',
      cv_data: { profil: '', erfahrung: '', ausbildung: '', skills: [], sprachen: '', anschreiben: '' },
      cover_letter: '',
    })
    setSaving(false); setShowAdd(false); setNewPos(''); setNewComp('')
    router.refresh()
  }

  if (applications.length === 0 && !showAdd) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Bewerbungen</h2>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>+ Neue Bewerbung</button>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: `0.5px solid ${C.border}`, borderRadius: 16, background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 8 }}>Noch keine Bewerbungen</div>
          <p style={{ fontSize: 13, color: C.mid, marginBottom: 24, lineHeight: 1.6 }}>Du hast noch keine Bewerbungen gesendet. Finde passende Jobs und bewirb dich mit einem Klick.</p>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>+ Neue Bewerbung hinzufügen</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Bewerbungen</h2>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>+ Neue Bewerbung</button>
      </div>

      {showAdd && (
        <div style={{ padding: '16px 20px', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.4)`, background: 'rgba(27,46,107,0.12)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={newPos} onChange={e => setNewPos(e.target.value)} placeholder="Position *" style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            <input value={newComp} onChange={e => setNewComp(e.target.value)} placeholder="Unternehmen" style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addApplication} disabled={saving || !newPos.trim()} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>{saving ? 'Speichern…' : 'Speichern'}</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', borderRadius: 9, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[['Gesendet', applications.length], ['Interview', applications.filter(a => getStatus(a.id) === 'Interview').length], ['Angebot', applications.filter(a => getStatus(a.id) === 'Angebot').length]].map(([l, v]) => (
          <div key={String(l)} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{String(v)}</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{String(l)}</div>
          </div>
        ))}
      </div>

      {applications.map(app => (
        <div key={app.id} style={{ padding: '14px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{app.position}</div>
            <div style={{ fontSize: 12, color: C.mid, marginTop: 3 }}>{app.company || '—'} · {new Date(app.created_at).toLocaleDateString('de-AT', { day: 'numeric', month: 'short' })}</div>
          </div>
          <select value={getStatus(app.id)} onChange={e => setStatus(app.id, e.target.value as AppStatus)}
            style={{ padding: '5px 10px', borderRadius: 20, border: `0.5px solid ${STATUS_COLORS[getStatus(app.id)]}40`, background: `${STATUS_COLORS[getStatus(app.id)]}18`, color: STATUS_COLORS[getStatus(app.id)], fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
            {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

// ── Section: CV ───────────────────────────────────────────────────────────────
function CVSection() {
  const designs = [
    { id: 'nordic', name: 'Nordic Minimal', emoji: '🇸🇪', desc: 'Clean, Serif, Professional' },
    { id: 'mono', name: 'Mono Elegant', emoji: '⬛', desc: 'Bold Header, High Contrast' },
    { id: 'split', name: 'Split Premium', emoji: '🎨', desc: 'Navy Sidebar, Modern' },
  ]
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Lebenslauf</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Erstelle deinen professionellen Lebenslauf mit KI-Unterstützung.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {designs.map(d => (
          <div key={d.id} style={{ padding: '20px 16px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,46,107,0.5)'; e.currentTarget.style.background = 'rgba(27,46,107,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{d.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 5 }}>{d.name}</div>
            <div style={{ fontSize: 11, color: C.mid }}>{d.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '2rem', border: `0.5px dashed ${C.border2}`, borderRadius: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 8 }}>Noch kein Lebenslauf erstellt</div>
        <p style={{ fontSize: 12, color: C.mid, marginBottom: 20, lineHeight: 1.6 }}>Erstelle deinen ersten Lebenslauf mit KI — in weniger als 5 Minuten.</p>
        <Link href="/" style={{ padding: '10px 24px', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Jetzt erstellen →
        </Link>
      </div>
    </div>
  )
}

// ── Section: Anschreiben ──────────────────────────────────────────────────────
function LetterSection({ profile }: { profile: UserProfile }) {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')

  async function generate() {
    if (!jobTitle) return
    setLoading(true)
    try {
      const res = await fetch('/api/one-click-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: { fullname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(), city: '', industry: '', experience: '', skills: '', lastjob: '' },
          jobTitle, jobCompany: company, jobDescription: `Position: ${jobTitle} bei ${company}`, lang: 'de',
        }),
      })
      const data = await res.json()
      setLetter(data.coverLetter || '')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>KI Anschreiben erstellen</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Individuelles Anschreiben — perfekt auf den Job zugeschnitten.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Jobtitel *</label>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="z.B. Product Manager" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Unternehmen</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="z.B. TechVision GmbH" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
      </div>
      <button onClick={generate} disabled={!jobTitle || loading} style={{ padding: '11px 24px', borderRadius: 10, background: jobTitle ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: jobTitle ? C.white : C.mid, border: 'none', cursor: jobTitle ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
        {loading ? '✍️ Wird generiert…' : '⚡ Anschreiben generieren'}
      </button>
      {letter && (
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>Dein Anschreiben</label>
          <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={14} style={{ width: '100%', padding: 16, borderRadius: 10, border: `0.5px solid rgba(27,46,107,0.35)`, background: 'rgba(27,46,107,0.08)', color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.75, resize: 'vertical', outline: 'none' }} />
          <button onClick={() => navigator.clipboard.writeText(letter)} style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, background: 'transparent', color: C.navy3, border: `0.5px solid rgba(27,46,107,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
            📋 In Zwischenablage kopieren
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section: Meine Daten ──────────────────────────────────────────────────────
function ProfileSection({ profile }: { profile: UserProfile }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSent, setPwSent] = useState(false)

  const p = profile as UserProfile & Record<string, string | number | boolean>

  const [form, setForm] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: String(p.phone || ''),
    city: String(p.city || ''),
    linkedin: String(p.linkedin || ''),
    birthday: String(p.birthday || ''),
  })
  const [prefs, setPrefs] = useState({
    industry: String(p.industry || ''),
    position: String(p.position || ''),
    experience: String(p.experience || ''),
    work_model: String(p.work_model || 'hybrid'),
    salary_target: Number(p.salary_target) || 55000,
  })
  const [notifications, setNotifications] = useState({
    job_alerts: Boolean(p.job_alerts ?? true),
    email_frequency: String(p.email_frequency || 'daily'),
  })

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await supabase.from('profiles').update({
        ...form, ...prefs, ...notifications,
      } as Record<string, unknown>).eq('id', profile.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  async function sendPwReset() {
    setPwLoading(true)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${appUrl}/auth/reset-password` })
    setPwLoading(false); setPwSent(true)
  }

  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase()

  type FormKey = keyof typeof form
  const field = (label: string, key: FormKey, type = 'text', placeholder = '', disabled = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} disabled={disabled}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`, background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', color: disabled ? C.mid : C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: disabled ? 'not-allowed' : 'text' }} />
    </div>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 28, padding: '24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 20, paddingBottom: 12, borderBottom: `0.5px solid ${C.border}` }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Meine Daten</h2>
        {saved && <span style={{ fontSize: 12, color: C.success, background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, padding: '4px 12px' }}>✓ Gespeichert</span>}
      </div>

      {/* Photo */}
      <Section title="Profilfoto">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: C.white, flexShrink: 0 }}>{initials}</div>
          <div>
            <button style={{ padding: '7px 14px', borderRadius: 8, background: `rgba(27,46,107,0.3)`, color: C.navy3, border: `0.5px solid rgba(27,46,107,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, marginRight: 8 }}>📷 Foto hochladen</button>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 8 }}>JPG, PNG bis 5 MB</div>
          </div>
        </div>
      </Section>

      {/* Personal info */}
      <Section title="Persönliche Angaben">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Vorname', 'first_name', 'text', 'Max')}
          {field('Nachname', 'last_name', 'text', 'Mustermann')}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Email</label>
          <input type="email" value={profile.email} disabled style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '0.5px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: C.mid, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'not-allowed' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Telefon', 'phone', 'tel', '+43 ...')}
          {field('Stadt', 'city', 'text', 'Wien')}
        </div>
        {field('LinkedIn', 'linkedin', 'url', 'https://linkedin.com/in/...')}
        {field('Geburtstag', 'birthday', 'date')}
      </Section>

      {/* Job preferences */}
      <Section title="Job-Präferenzen">
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Branche</label>
          <input value={prefs.industry} onChange={e => setPrefs(p => ({ ...p, industry: e.target.value }))} placeholder="z.B. IT & Technologie" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Wunschposition</label>
          <input value={prefs.position} onChange={e => setPrefs(p => ({ ...p, position: e.target.value }))} placeholder="z.B. Product Manager" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>Arbeitsmodell</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['remote', '🏠 Remote'], ['hybrid', '🔄 Hybrid'], ['office', '🏢 Vor Ort']].map(([v, l]) => (
              <button key={v} onClick={() => setPrefs(p => ({ ...p, work_model: v }))} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `0.5px solid ${prefs.work_model === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: prefs.work_model === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: prefs.work_model === v ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>Wunschgehalt: {prefs.salary_target.toLocaleString('de')} €</label>
          <input type="range" min={25000} max={150000} step={5000} value={prefs.salary_target} onChange={e => setPrefs(p => ({ ...p, salary_target: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: C.purple, cursor: 'pointer' }} />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Benachrichtigungen">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Job-Alerts</div>
            <div style={{ fontSize: 11, color: C.mid }}>Sofort benachrichtigt wenn passende Jobs erscheinen</div>
          </div>
          <button onClick={() => setNotifications(n => ({ ...n, job_alerts: !n.job_alerts }))} style={{ width: 44, height: 24, borderRadius: 12, background: notifications.job_alerts ? C.navy : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: notifications.job_alerts ? 23 : 3, transition: 'left .2s' }} />
          </button>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>E-Mail-Häufigkeit</label>
          <select value={notifications.email_frequency} onChange={e => setNotifications(n => ({ ...n, email_frequency: e.target.value }))} style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: '#0D1117', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="instant">Sofort</option>
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
          </select>
        </div>
      </Section>

      {/* Account */}
      <Section title="Konto">
        <div style={{ marginBottom: 14 }}>
          {pwSent ? (
            <div style={{ fontSize: 12, color: C.success, padding: '8px 14px', background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, display: 'inline-block' }}>✓ Reset-Link wurde gesendet</div>
          ) : (
            <button onClick={sendPwReset} disabled={pwLoading} style={{ padding: '9px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{pwLoading ? 'Wird gesendet…' : '🔑 Passwort ändern'}</button>
          )}
        </div>
        <button style={{ padding: '9px 16px', borderRadius: 9, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.25)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>🗑 Konto löschen</button>
      </Section>

      <button onClick={save} disabled={saving} style={{ width: '100%', padding: 13, borderRadius: 10, background: saving ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: saving ? C.mid : C.white, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
        {saving ? 'Wird gespeichert…' : 'Änderungen speichern'}
      </button>
    </div>
  )
}

// ── Section: Statistiken ──────────────────────────────────────────────────────
function StatsSection({ applications }: { applications: Application[] }) {
  const weeks = ['KW 18', 'KW 19', 'KW 20', 'KW 21', 'KW 22', 'KW 23']
  const counts = [2, 5, 3, 8, 4, applications.length > 0 ? applications.length : 6]
  const maxCount = Math.max(...counts, 1)

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Statistiken</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Dein Bewerbungsfortschritt auf einen Blick.</p>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[['📤', String(applications.length), 'Bewerbungen'], ['✉️', '28%', 'Antwortrate'], ['💬', '3', 'Interviews'], ['⭐', '85%', 'Ø Match']].map(([icon, val, label]) => (
          <div key={label} style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 3 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.mid }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ padding: '24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 20 }}>Bewerbungen pro Woche</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {counts.map((c, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: C.white, fontWeight: 600 }}>{c}</div>
              <div style={{ width: '100%', height: (c / maxCount) * 80, borderRadius: '4px 4px 0 0', background: `linear-gradient(180deg, ${C.navy3}, ${C.navy})`, minHeight: 4, transition: 'height .4s' }} />
              <div style={{ fontSize: 10, color: C.mid }}>{weeks[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart: Match score */}
      <div style={{ padding: '24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 16 }}>Profil Match-Score über Zeit</div>
        <svg width="100%" height={80} viewBox="0 0 400 80">
          <polyline points="0,60 66,52 132,45 200,38 266,32 334,28 400,22" fill="none" stroke={C.success} strokeWidth={2.5} strokeLinejoin="round" />
          {[60, 52, 45, 38, 32, 28, 22].map((y, i) => (
            <circle key={i} cx={i * 66.6} cy={y} r={4} fill={C.success} />
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {weeks.concat(['Heute']).map(w => <span key={w} style={{ fontSize: 10, color: C.mid }}>{w}</span>)}
        </div>
      </div>
    </div>
  )
}

// ── Section: Einstellungen ────────────────────────────────────────────────────
function SettingsSection({ profile, isPro, onUpgrade }: { profile: UserProfile; isPro: boolean; onUpgrade: () => void }) {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('de')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [showToRecruiters, setShowToRecruiters] = useState(false)
  const [matchThreshold, setMatchThreshold] = useState('70')
  const [portalLoading, setPortalLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally { setPortalLoading(false) }
  }

  const Toggle = ({ label, desc, val, onChange }: { label: string; desc?: string; val: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `0.5px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!val)} style={{ width: 44, height: 24, borderRadius: 12, background: val ? C.navy : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: val ? 23 : 3, transition: 'left .2s' }} />
      </button>
    </div>
  )

  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20, padding: '20px 24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Einstellungen</h2>
        {saved && <span style={{ fontSize: 12, color: C.success, padding: '4px 12px', background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8 }}>✓ Gespeichert</span>}
      </div>

      <Block title="Erscheinungsbild">
        <div style={{ display: 'flex', gap: 8 }}>
          {[['dark', '🌙 Dark'], ['light', '☀️ Light'], ['system', '💻 System']].map(([v, l]) => (
            <button key={v} onClick={() => setTheme(v)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: `0.5px solid ${theme === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: theme === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: theme === v ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500 }}>{l}</button>
          ))}
        </div>
      </Block>

      <Block title="Sprache">
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: '#0D1117', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          {[['de', '🇩🇪 Deutsch'], ['en', '🇬🇧 English'], ['tr', '🇹🇷 Türkçe'], ['es', '🇪🇸 Español'], ['fr', '🇫🇷 Français'], ['pl', '🇵🇱 Polski']].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Block>

      <Block title="Benachrichtigungen">
        <Toggle label="E-Mail Alerts" desc="Job-Matches und Updates per E-Mail" val={emailAlerts} onChange={setEmailAlerts} />
        <div style={{ paddingTop: 12 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>Mindest-Match für Benachrichtigung</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['50', '50%+'], ['70', '70%+'], ['90', '90%+']].map(([v, l]) => (
              <button key={v} onClick={() => setMatchThreshold(v)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: `0.5px solid ${matchThreshold === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: matchThreshold === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: matchThreshold === v ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{l}</button>
            ))}
          </div>
        </div>
      </Block>

      <Block title="Datenschutz">
        <Toggle label="Profil für Recruiter sichtbar" desc="Recruiter können dich aktiv kontaktieren" val={showToRecruiters} onChange={setShowToRecruiters} />
        <div style={{ paddingTop: 14, display: 'flex', gap: 10 }}>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>📥 Daten exportieren</button>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>🗑 Alle Daten löschen</button>
        </div>
      </Block>

      <Block title="Abonnement">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{isPro ? '⭐ Jobbly Premium' : 'Free Plan'}</div>
            <div style={{ fontSize: 11, color: C.mid, marginTop: 3 }}>{isPro ? 'Aktiv · €9.99/Monat' : 'Kostenlos — 0 von 3 Bewerbungen verbraucht'}</div>
          </div>
          {isPro ? (
            <button onClick={openPortal} disabled={portalLoading} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{portalLoading ? '…' : 'Kündigen'}</button>
          ) : (
            <button onClick={onUpgrade} style={{ padding: '8px 14px', borderRadius: 8, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>Upgraden</button>
          )}
        </div>
      </Block>

      <Block title="Sicherheit">
        <div style={{ fontSize: 13, color: C.mid, marginBottom: 12 }}>Passwort-Reset und aktive Sitzungen verwalten.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>🔑 Passwort ändern</button>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, opacity: 0.5 }}>🔐 2FA — Demnächst</button>
        </div>
      </Block>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }} style={{ width: '100%', padding: 13, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
        Einstellungen speichern
      </button>
    </div>
  )
}

// ── Courses section ───────────────────────────────────────────────────────────
function CoursesSection() {
  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Karriere Kurse</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Lerne die gefragtesten Skills und steigere deine Chancen.</p>
      {COURSES.map(course => (
        <div key={course.name} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.015)', marginBottom: 10, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(27,46,107,0.5)'; e.currentTarget.style.background = 'rgba(27,46,107,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.015)' }}>
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

// ── Upgrade modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  const [loading, setLoading] = useState(false)
  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally { setLoading(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, borderRadius: 16, border: `0.5px solid rgba(255,255,255,0.1)`, width: '100%', maxWidth: 420, padding: 32 }}>
        <button onClick={onClose} style={{ float: 'right', background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: C.mid, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👑</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 4 }}>Jobbly Premium</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.white }}>€9.99<span style={{ fontSize: 15, color: C.mid, fontWeight: 400 }}>/Monat</span></div>
          <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>Jederzeit kündbar · Keine versteckten Kosten</div>
        </div>
        {['⚡ 1-Klick Bewerbung — KI bewirbt sich für dich', '🔔 Sofort-Alarm bei Traumjobs', '🤖 Eigener KI-Assistent 24/7', '📋 Unbegrenzte Bewerbungen', '🎨 Exklusive CV-Designs mit Foto'].map(f => (
          <div key={f} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', borderBottom: `0.5px solid ${C.border}` }}>{f}</div>
        ))}
        <button onClick={handleUpgrade} disabled={loading} style={{ width: '100%', marginTop: 20, padding: 14, borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700 }}>
          {loading ? 'Weiterleitung…' : 'Jetzt upgraden · €9.99/Monat →'}
        </button>
        <p style={{ fontSize: 11, color: C.mid, textAlign: 'center', marginTop: 10 }}>14-Tage Geld-zurück-Garantie · Gesichert durch Stripe</p>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardClient({ profile, applications, justUpgraded }: Props) {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard')
  const [selectedJob, setSelectedJob] = useState<ReturnType<typeof makeMockJobs>[0] | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const isPro = !!profile.is_pro

  const mockJobs = useMemo(() => makeMockJobs(), [])
  const showOnboarding = !profile.first_name

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function renderContent() {
    switch (activeNav) {
      case 'jobs': return <JobsSection jobs={mockJobs} isPro={isPro} onSelect={j => setSelectedJob(j)} onNeedPro={() => setShowUpgrade(true)} />
      case 'applications': return <ApplicationsSection applications={applications} profile={profile} />
      case 'cv': return <CVSection />
      case 'letter': return <LetterSection profile={profile} />
      case 'profile': return <ProfileSection profile={profile} />
      case 'stats': return <StatsSection applications={applications} />
      case 'courses': return <CoursesSection />
      case 'settings': return <SettingsSection profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
      default: return (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              {justUpgraded && (
                <div style={{ fontSize: 12, color: C.success, background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, padding: '8px 14px', marginBottom: 14, display: 'inline-block' }}>
                  🎉 Willkommen bei Jobbly Premium! Dein Abo ist jetzt aktiv.
                </div>
              )}
              <h1 style={{ fontSize: 30, fontWeight: 700, color: C.white, marginBottom: 6, letterSpacing: '-.5px' }}>
                {profile.first_name ? `Hallo ${profile.first_name}! 👋` : 'Hallo! 👋'}
              </h1>
              <p style={{ fontSize: 15, color: C.mid }}>
                {profile.first_name ? 'Bereit für deinen nächsten Karriereschritt?' : (
                  <span>Vervollständige dein <span style={{ color: C.navy3, cursor: 'pointer' }} onClick={() => setActiveNav('profile')}>Profil →</span> um bessere Job-Matches zu erhalten.</span>
                )}
              </p>
            </div>
            <div style={{ width: 140, height: 90, flexShrink: 0, background: 'rgba(27,46,107,0.12)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📄✨</div>
          </div>

          <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
            <StatCard icon="💼" value="23" label="Passende Jobs" sub="+5 heute" subColor={C.success} />
            <StatCard icon="📊" value="85%" label="Profil Match" sub="Sehr gut" subColor={C.success} />
            <StatCard icon="📋" value={String(applications.length)} label="Bewerbungen" sub="Insgesamt" subColor={C.mid} />
            <StatCard icon="⭐" value="3" label="Einladungen" sub="Letzte 30 Tage" subColor={C.success} />
          </div>

          {applications.length === 0 && (
            <div style={{ padding: '20px 24px', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.3)`, background: 'rgba(27,46,107,0.08)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>Vervollständige dein Profil für bessere Matches</div>
                <div style={{ fontSize: 12, color: C.mid }}>Mit einem vollständigen Profil findest du bis zu 3× mehr passende Jobs.</div>
              </div>
              <button onClick={() => setActiveNav('profile')} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Profil vervollständigen</button>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Top Job Matches für dich</div>
              <span style={{ fontSize: 13, color: C.navy3, cursor: 'pointer', fontWeight: 500 }} onClick={() => setActiveNav('jobs')}>Alle anzeigen</span>
            </div>
            {mockJobs.slice(0, 3).map(job => (
              <JobCard key={job.id} job={job} onClick={() => {
                if (!isPro) { setShowUpgrade(true); return }
                setSelectedJob(job)
              }} />
            ))}
          </div>

          <div style={{ padding: '20px 22px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)', border: `0.5px solid rgba(99,102,241,0.35)`, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 14 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 3 }}>KI Anschreiben erstellen</div>
              <div style={{ fontSize: 12, color: C.mid }}>Individuelles Anschreiben, perfekt auf den Job zugeschnitten.</div>
            </div>
            <button onClick={() => setActiveNav('letter')} style={{ padding: '9px 18px', borderRadius: 9, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              Jetzt erstellen →
            </button>
          </div>
        </>
      )
    }
  }

  return (
    <>
      {showOnboarding && <Onboarding profile={profile} onComplete={() => router.refresh()} />}

      <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
        <Sidebar active={activeNav} onNav={setActiveNav} profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onLogout={handleLogout} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <TopBar profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onNav={setActiveNav} />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {renderContent()}
            </main>
            {activeNav === 'dashboard' && <RightSidebar applications={applications} />}
          </div>
        </div>
      </div>

      {selectedJob && <JobDetailModal job={selectedJob} profile={profile} onClose={() => setSelectedJob(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgrade={() => setShowUpgrade(false)} />}
    </>
  )
}
