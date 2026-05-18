'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JMark } from '@/components/JLogo'
import type { UserProfile, Application } from '@/lib/types'
import { getProfileCompleteness } from '@/lib/profileCompleteness'
import { useIsMobile } from '@/lib/useIsMobile'
import { trackEvent } from '@/components/MetaPixel'

interface Props {
  profile: UserProfile
  applications: Application[]
  justUpgraded: boolean
  upgradeStatus?: 'success' | 'cancelled' | null
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

interface DashJob {
  id: string
  company: string
  initials: string
  color: string
  title: string
  location: string
  type: string
  salary: string
  match: number
  skills: string[]
  posted: string
  description: string
  industry: string
  contactEmail: string | null
  url: string
}

// ── Relative date formatter (German, never shows "Invalid Date") ──────────────
function relativeDate(raw: string | number | undefined | null): string {
  if (!raw) return ''
  try {
    const date = typeof raw === 'number' ? new Date(raw * 1000) : new Date(String(raw))
    if (isNaN(date.getTime())) return ''
    const diffMs = Date.now() - date.getTime()
    if (diffMs < 0) return ''
    const mins = Math.floor(diffMs / 60000)
    if (mins < 2) return 'Gerade eben'
    if (mins < 60) return `Vor ${mins} Minuten`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return hours === 1 ? 'Vor 1 Stunde' : `Vor ${hours} Stunden`
    const days = Math.floor(hours / 24)
    if (days < 7) return days === 1 ? 'Vor 1 Tag' : `Vor ${days} Tagen`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return weeks === 1 ? 'Vor 1 Woche' : `Vor ${weeks} Wochen`
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// ── Real job API types & adapter ─────────────────────────────────────────────
interface RealJob {
  id: string; title: string; company: string; location: string; type: string
  salary: string; description: string; url: string; postedAt: string
  source: string; matchScore: number; skills: string[]
  email?: string; contact_email?: string; apply_email?: string
}

const EMAIL_SKIP = /^(noreply|no-reply|support|info|hello|contact|newsletter|marketing|donotreply)@/i

function extractContactEmail(job: RealJob): string | null {
  // Check API fields first
  const direct = job.email || job.contact_email || job.apply_email
  if (direct && !EMAIL_SKIP.test(direct)) return direct
  // Scan description
  const matches = (job.description || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  const found = matches?.find(e => !EMAIL_SKIP.test(e)) || null
  return found
}

function adaptJob(j: RealJob): DashJob {
  const palette = ['#6366f1', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#14b8a6']
  const seed = j.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const color = palette[seed % palette.length]
  const initials = j.company.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??'
  const dateStr = relativeDate(j.postedAt)
  return {
    id: j.id, company: j.company, initials, color, title: j.title,
    location: j.location, type: j.type,
    salary: j.salary || 'Gehalt nicht angegeben',
    match: j.matchScore, skills: j.skills, posted: dateStr,
    description: j.description, industry: '',
    contactEmail: extractContactEmail(j),
    url: j.url || '',
  }
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

// ── Mobile components ─────────────────────────────────────────────────────────
const BOTTOM_NAV: { id: NavId; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'jobs',      icon: '🔍', label: 'Jobs' },
  { id: 'cv',        icon: '📄', label: 'CV' },
  { id: 'letter',    icon: '✉️', label: 'Brief' },
  { id: 'profile',   icon: '👤', label: 'Profil' },
]

function MobileTopBar({ onHamburger, isPro, onUpgrade }: { onHamburger: () => void; isPro: boolean; onUpgrade: () => void }) {
  return (
    <header style={{ height: 56, background: C.bg, borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <JMark size={26} />
        <span style={{ fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: '-.3px' }}>
          Jobbly<span style={{ color: C.navy3, fontWeight: 400 }}>.ai</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {!isPro && (
          <button onClick={onUpgrade} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 20, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ Pro</button>
        )}
        {isPro && (
          <span style={{ fontSize: 11, padding: '5px 11px', borderRadius: 20, background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.5)`, fontWeight: 700 }}>⭐ Premium</span>
        )}
        <button onClick={onHamburger} style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: C.white }}>☰</button>
      </div>
    </header>
  )
}

function MobileDrawer({ active, onNav, profile, isPro, onUpgrade, onLogout, onClose, avatarUrl }: {
  active: NavId; onNav: (id: NavId) => void
  profile: UserProfile; isPro: boolean; onUpgrade: () => void; onLogout: () => void; onClose: () => void; avatarUrl?: string
}) {
  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase()
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 500, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: '#0f1929', borderRight: `0.5px solid ${C.border2}`, zIndex: 501, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <JMark size={26} />
            <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>Jobbly<span style={{ color: C.navy3, fontWeight: 400 }}>.ai</span></span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', color: C.mid, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <nav style={{ flex: 1, padding: 10 }}>
          {NAV.map(({ id, icon, label, badge }) => {
            const isActive = active === id
            return (
              <button key={id} onClick={() => { onNav(id); onClose() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 52, borderRadius: 10, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(27,46,107,0.5)' : 'transparent', color: isActive ? C.white : C.mid, fontFamily: 'inherit', fontSize: 14, fontWeight: isActive ? 600 : 400, marginBottom: 4, textAlign: 'left' }}>
                <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {badge && <span style={{ fontSize: 10, background: C.navy, color: C.navy3, padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{badge}</span>}
              </button>
            )
          })}
        </nav>
        {!isPro && (
          <div style={{ margin: '0 10px 12px', padding: 14, borderRadius: 12, background: 'rgba(27,46,107,0.28)', border: `0.5px solid rgba(37,58,133,0.5)` }}>
            <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>👑</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, textAlign: 'center', marginBottom: 10 }}>Upgrade auf Premium</div>
            <button onClick={() => { onUpgrade(); onClose() }} style={{ width: '100%', padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>Jetzt upgraden</button>
          </div>
        )}
        <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0, overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.first_name} {profile.last_name}</div>
            <div style={{ fontSize: 10, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
          </div>
          <button onClick={onLogout} title="Abmelden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid, fontSize: 18, padding: 6, minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩</button>
        </div>
      </div>
    </>
  )
}

function BottomNav({ active, onNav }: { active: NavId; onNav: (id: NavId) => void }) {
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: C.bg, borderTop: `0.5px solid ${C.border2}`, display: 'flex', alignItems: 'stretch', zIndex: 300, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {BOTTOM_NAV.map(({ id, icon, label }) => {
        const isActive = active === id
        return (
          <button key={id} onClick={() => onNav(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: isActive ? C.navy3 : C.mid, position: 'relative', minHeight: 44 }}>
            {isActive && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, borderRadius: 1, background: C.navy3 }} />}
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: '.02em' }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, profile, isPro, onUpgrade, onLogout, jobCount, avatarUrl }: {
  active: NavId; onNav: (id: NavId) => void
  profile: UserProfile; isPro: boolean; onUpgrade: () => void; onLogout: () => void; jobCount?: number; avatarUrl?: string
}) {
  const [showPopup, setShowPopup] = useState(false)
  const router = useRouter()
  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase()

  return (
    <aside style={{ width: 240, background: C.sidebar, borderRight: `0.5px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
      <div
        onClick={() => router.push('/dashboard')}
        style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
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
              {id === 'jobs' && !badge && jobCount != null && jobCount > 0 && <span style={{ fontSize: 10, background: 'rgba(27,46,107,0.5)', color: C.navy3, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>{jobCount}</span>}
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
          style={{ width: 34, height: 34, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
          onClick={() => { setShowPopup(false); onNav('profile') }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
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
const MOCK_NOTIFS = [
  { id: '1', icon: '💼', title: 'Neuer Job Match', desc: 'Product Manager bei TechVision — 92% Match', time: 'Vor 2 Std.', read: false },
  { id: '2', icon: '👀', title: 'Bewerbung angesehen', desc: 'Digital Solutions AG hat deine Bewerbung geöffnet', time: 'Vor 5 Std.', read: false },
  { id: '3', icon: '⭐', title: 'Einladung erhalten', desc: 'InnovateX lädt dich zu einem Interview ein', time: 'Vor 1 Tag', read: false },
  { id: '4', icon: '🔔', title: 'Jobbly Update', desc: 'Neue KI-Features: Lebenslauf-Builder & mehr', time: 'Vor 3 Tagen', read: true },
]

function TopBar({ profile, isPro, onUpgrade, onNav, onSearch, avatarUrl }: { profile: UserProfile; isPro: boolean; onUpgrade: () => void; onNav: (id: NavId) => void; onSearch: (term: string) => void; avatarUrl?: string }) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const [notifs, setNotifs] = useState(MOCK_NOTIFS)
  const [notifsLoaded, setNotifsLoaded] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const initials = (profile.first_name || '?').charAt(0).toUpperCase()
  const unread = notifs.filter(n => !n.read).length

  // Fetch notifications from Supabase; fall back to mock if table doesn't exist
  useEffect(() => {
    async function fetchNotifs() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!error && data && data.length > 0) {
        setNotifs(data.map(n => ({
          id: String(n.id),
          icon: String(n.icon || '🔔'),
          title: String(n.title || ''),
          desc: String(n.description || n.desc || ''),
          time: new Date(n.created_at).toLocaleDateString('de-AT', { day: 'numeric', month: 'short' }),
          read: Boolean(n.read),
        })))
      }
      setNotifsLoaded(true)
    }
    fetchNotifs()
  }, [profile.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    // Update in Supabase if real notifications were loaded
    if (notifsLoaded) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    }
  }

  async function markRead(id: string) {
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
    if (notifsLoaded) {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    }
  }

  return (
    <header style={{ height: 60, borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', background: C.bg, flexShrink: 0 }}>
      <div style={{ flex: 1, position: 'relative', maxWidth: 520 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.mid, fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && search.trim()) { onSearch(search.trim()); onNav('jobs') } }}
          placeholder="Jobs, Unternehmen oder Keywords suchen… (Enter)"
          style={{ width: '100%', padding: '9px 76px 9px 38px', borderRadius: 10, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.mid, fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 5 }}>↵</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {isPro ? (
          <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.5)`, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>⭐ Premium</span>
        ) : (
          <button onClick={onUpgrade} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: `0.5px solid rgba(124,58,237,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>⭐ Premium</button>
        )}

        {/* Notification bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowBell(b => !b)} style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: showBell ? C.white : C.mid, position: 'relative', transition: 'all .15s' }}>
            🔔
            {unread > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.bg}` }}>{unread}</span>
            )}
          </button>
          {showBell && (
            <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#0D1117', border: `0.5px solid rgba(255,255,255,0.12)`, borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Benachrichtigungen</span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: C.navy3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Alle als gelesen markieren</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)} style={{ display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(27,46,107,0.08)', borderBottom: `0.5px solid ${C.border}`, transition: 'background .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(27,46,107,0.08)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(27,46,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.white }}>{n.title}</span>
                        {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, display: 'inline-block' }} />}
                      </div>
                      <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.4 }}>{n.desc}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: `0.5px solid ${C.border}`, textAlign: 'center' }}>
                <button onClick={() => setShowBell(false)} style={{ fontSize: 12, color: C.navy3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Alle Benachrichtigungen →</button>
              </div>
            </div>
          )}
        </div>

        <div
          style={{ width: 36, height: 36, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: C.white, cursor: 'pointer', border: '2px solid rgba(99,102,241,0.5)', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
          onClick={() => { setShowPopup(false); onNav('profile') }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
          {showPopup && <AvatarPopup profile={profile} isPro={isPro} onNavigate={() => { setShowPopup(false); onNav('profile') }} side="top" />}
        </div>
      </div>
    </header>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, subColor, onClick }: { icon: string; value: string; label: string; sub?: string; subColor?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ flex: 1, minWidth: 0, padding: '18px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${C.border}`, cursor: onClick ? 'pointer' : 'default', transition: 'all .15s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'rgba(27,46,107,0.5)'; e.currentTarget.style.background = 'rgba(27,46,107,0.08)' } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: '-.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.mid, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.success, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

// ── Job card ──────────────────────────────────────────────────────────────────
const BOOKMARKS_KEY = 'jobbly_bookmarks'
function getBookmarks(): string[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') } catch { return [] }
}
function setBookmarkPersisted(id: string, val: boolean) {
  const bm = getBookmarks()
  const next = val ? [...new Set([...bm, id])] : bm.filter(x => x !== id)
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
}

function JobCard({ job, onClick, compact }: { job: DashJob; onClick: () => void; compact?: boolean }) {
  const [bookmarked, setBookmarked] = useState(() => typeof window !== 'undefined' ? getBookmarks().includes(job.id) : false)
  const matchColor = job.match >= 85 ? C.success : job.match >= 70 ? C.amber : C.mid
  const hasDirectEmail = !!job.contactEmail

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
          <button onClick={e => { e.stopPropagation(); const next = !bookmarked; setBookmarked(next); setBookmarkPersisted(job.id, next) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: bookmarked ? C.amber : C.mid, padding: 0, transition: 'color .15s' }} title={bookmarked ? 'Gespeichert' : 'Job speichern'}>
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: C.mid }}>Gehalt: {job.salary}</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: hasDirectEmail ? 'rgba(27,46,107,0.25)' : 'rgba(255,255,255,0.05)', color: hasDirectEmail ? '#93AFFD' : C.mid, border: `0.5px solid ${hasDirectEmail ? 'rgba(27,46,107,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              {hasDirectEmail ? '📧 Direkt' : '🌐 Portal'}
            </span>
          </div>
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

// ── Job detail modal (premium 1-click apply) ──────────────────────────────────
function JobDetailModal({ job, profile, onClose }: { job: DashJob; profile: UserProfile; onClose: () => void }) {
  const [step, setStep] = useState<'detail' | 'letter' | 'apply'>('detail')
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function generateLetter() {
    setLoading(true); setStep('letter')
    try {
      const res = await fetch('/api/one-click-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: {
            fullname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            city: (profile as UserProfile & Record<string, unknown>).city as string || '',
            industry: (profile as UserProfile & Record<string, unknown>).industry as string || '',
            experience: '', skills: '', lastjob: '',
          },
          jobTitle: job.title, jobCompany: job.company, jobDescription: job.description, lang: 'de',
        }),
      })
      const data = await res.json()
      setLetter(data.coverLetter || 'Anschreiben konnte nicht generiert werden.')
    } catch { setLetter('Anschreiben konnte nicht generiert werden.') }
    finally { setLoading(false) }
  }

  function downloadPDF() {
    const firstName = profile.first_name || ''
    const lastName  = profile.last_name  || ''
    const filename  = `Bewerbung_${firstName}_${lastName}_${job.company}`.replace(/\s+/g, '_')
    const content   = encodeURIComponent(letter)
    const a = document.createElement('a')
    a.href = `data:text/plain;charset=utf-8,${content}`
    a.download = `${filename}.txt`
    a.click()
  }

  async function handleApply() {
    setApplying(true)
    try {
      await supabase.from('applications').insert({
        user_id: profile.id, position: job.title, company: job.company,
        status: 'Gesendet', application_method: job.url ? 'portal' : 'email',
        template: 'classic', style: 'balanced',
        cv_data: {}, cover_letter: letter,
        applied_at: new Date().toISOString(),
      })
      // Open portal or mailto
      if (job.url) {
        window.open(job.url, '_blank', 'noopener,noreferrer')
        downloadPDF()
      } else if (job.contactEmail) {
        const subject = encodeURIComponent(`Bewerbung als ${job.title}`)
        const body    = encodeURIComponent(letter)
        window.location.href = `mailto:${job.contactEmail}?subject=${subject}&body=${body}`
      }
      setApplied(true)
      router.refresh()
    } finally { setApplying(false) }
  }

  const isWide = step === 'letter'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0D1117', borderRadius: 16, border: `0.5px solid rgba(255,255,255,0.1)`, width: '100%', maxWidth: isWide ? 900 : 540, maxHeight: '90vh', overflow: 'auto', transition: 'max-width .3s ease' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.white, flexShrink: 0 }}>{job.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>{job.title}</div>
            <div style={{ fontSize: 12, color: C.mid }}>{job.company} · {job.location}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: C.mid, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* STEP 1: Detail */}
          {step === 'detail' && (
            <>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, padding: 20, background: 'rgba(27,46,107,0.1)', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.3)` }}>
                <MatchRing pct={job.match} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>KI-Analyse: {job.match >= 85 ? 'Sehr gute Übereinstimmung' : 'Gute Übereinstimmung'}</div>
                  <div style={{ fontSize: 12, color: C.mid }}>💰 {job.salary} · {job.type}</div>
                </div>
              </div>
              <div style={{ marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>
                {job.description || `Wir suchen einen ${job.title} für ${job.company}.`}
              </div>
              <div style={{ marginBottom: 24 }}>
                {[
                  `Dein Profil passt zur gesuchten Position als ${job.title}.`,
                  `${job.company} sucht Kandidaten mit genau deinem Erfahrungshintergrund.`,
                  job.skills.length > 0 ? `Skills ${job.skills.slice(0,3).join(', ')} decken sich mit deinem Profil.` : null,
                ].filter(Boolean).map((pt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.success, fontSize: 12, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{pt}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: C.navy3, border: `0.5px solid rgba(255,255,255,0.1)`, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' as const }}>
                    🌐 Zum Stellenportal
                  </a>
                )}
                <button style={{ flex: 2, padding: 13, borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }} onClick={generateLetter}>
                  ⚡ Bewerbung erstellen →
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Side-by-side letter + CV summary */}
          {step === 'letter' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 14 }}>✍️ KI-Anschreiben erstellen</div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: C.mid }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                    {[0, .2, .4].map(d => <span key={d} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: C.navy2, animation: `p 1.2s ease-in-out ${d}s infinite` }} />)}
                  </div>
                  Anschreiben wird generiert…
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {/* Left: editable letter */}
                    <div>
                      <div style={{ fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Anschreiben</div>
                      <textarea
                        value={letter}
                        onChange={e => setLetter(e.target.value)}
                        rows={14}
                        style={{ width: '100%', padding: 12, borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', fontSize: 12, lineHeight: 1.7, resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                    {/* Right: CV/profile summary */}
                    <div>
                      <div style={{ fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>Dein Profil</div>
                      <div style={{ padding: 14, borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.02)', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                        <div style={{ fontWeight: 600, color: C.white, marginBottom: 6 }}>{profile.first_name} {profile.last_name}</div>
                        {(profile as UserProfile & Record<string, unknown>).city && <div>📍 {String((profile as UserProfile & Record<string, unknown>).city)}</div>}
                        {(profile as UserProfile & Record<string, unknown>).desired_position && <div style={{ marginTop: 4 }}>🎯 {String((profile as UserProfile & Record<string, unknown>).desired_position)}</div>}
                        {(profile as UserProfile & Record<string, unknown>).industry && <div style={{ marginTop: 4 }}>🏢 {String((profile as UserProfile & Record<string, unknown>).industry)}</div>}
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `0.5px solid rgba(255,255,255,0.07)`, fontSize: 11, color: C.mid }}>
                          💡 Lebenslauf & Anschreiben findest du unter CV und Anschreiben
                        </div>
                      </div>
                      {/* Apply action */}
                      <div style={{ marginTop: 12, padding: 14, borderRadius: 8, border: `0.5px solid rgba(27,46,107,0.3)`, background: 'rgba(27,46,107,0.08)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.white, marginBottom: 4 }}>Bewerbungsweg</div>
                        <div style={{ fontSize: 11, color: C.mid }}>
                          {job.url ? '🌐 Über Stellenportal' : job.contactEmail ? `📧 An ${job.contactEmail}` : '🌐 Direkt beim Unternehmen'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <button onClick={() => setStep('detail')} style={{ padding: 11, borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
                    <button onClick={() => setStep('apply')} disabled={!letter} style={{ padding: 12, borderRadius: 10, background: !letter ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: !letter ? C.mid : C.white, border: 'none', cursor: !letter ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
                      Bewerbung prüfen →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 3: Apply */}
          {step === 'apply' && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 16 }}>✅ Jetzt bewerben</div>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(27,46,107,0.1)', border: `0.5px solid rgba(27,46,107,0.3)`, marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.white }}>{job.title}</div>
                <div style={{ fontSize: 13, color: C.mid }}>{job.company} · {job.location}</div>
              </div>
              {applied ? (
                <div style={{ textAlign: 'center', padding: '20px', color: C.success, fontSize: 14 }}>
                  ✓ Bewerbung erfasst! Viel Erfolg!
                  <button onClick={onClose} style={{ display: 'block', margin: '16px auto 0', padding: '10px 24px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Schließen</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16, fontSize: 13, color: C.mid, lineHeight: 1.6 }}>
                    {job.url
                      ? 'Das Stellenportal wird in einem neuen Tab geöffnet. Dein Anschreiben wird automatisch als Datei heruntergeladen.'
                      : job.contactEmail
                        ? `Dein E-Mail-Programm öffnet sich mit dem fertigen Anschreiben an ${job.contactEmail}.`
                        : 'Deine Bewerbung wird in deinem Konto gespeichert.'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={() => setStep('letter')} style={{ padding: 11, borderRadius: 9, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Bearbeiten</button>
                    <button onClick={handleApply} disabled={applying} style={{ padding: 11, borderRadius: 9, background: applying ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: applying ? C.mid : C.white, border: 'none', cursor: applying ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                      {applying ? '…' : job.url ? '🌐 Zum Portal + Download' : job.contactEmail ? '📧 Per E-Mail bewerben' : '✓ Bewerbung erfassen'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────
function ProfileCompleteness({ profile, onNav }: { profile: UserProfile; onNav: (id: NavId) => void }) {
  const { score: pct, missing: missingFields } = getProfileCompleteness(profile)
  const missing = missingFields.slice(0, 2)

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Profil-Vollständigkeit</div>
        <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 80 ? C.success : C.amber }}>{pct}%</span>
      </div>
      <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 80 ? C.success : pct >= 50 ? C.amber : '#f87171', borderRadius: 4, transition: 'width .5s ease' }} />
      </div>
      {pct < 80 && (
        <>
          {missing.map(m => (
            <div key={m.key} style={{ fontSize: 11, color: C.mid, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color: C.amber, flexShrink: 0 }}>⚠</span>
              <span>Füge dein{m.key === 'photo' ? ' ' : 'e '}
                <span style={{ color: C.navy3 }}>{m.label}</span> hinzu für bessere Job-Matches
              </span>
            </div>
          ))}
          <button onClick={() => onNav('profile')} style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 8, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
            Profil bearbeiten →
          </button>
        </>
      )}
      {pct >= 80 && (
        <div style={{ fontSize: 11, color: C.success, display: 'flex', gap: 5, alignItems: 'center' }}>
          <span>✓</span> Dein Profil ist gut aufgestellt
        </div>
      )}
    </section>
  )
}

function RightSidebar({ applications, profile, onNav, isMobile }: { applications: Application[]; profile: UserProfile; onNav: (id: NavId) => void; isMobile?: boolean }) {
  const supabase = createClient()
  const p = profile as UserProfile & Record<string, unknown>
  const [salary, setSalary] = useState<number>(() => Number(p.salary_target) || 60000)
  const [editingSalary, setEditingSalary] = useState(false)
  const [salarySaving, setSalarySaving] = useState(false)
  const [salarySaved, setSalarySaved] = useState(false)

  async function saveSalary() {
    setSalarySaving(true)
    await supabase.from('profiles').update({ salary_target: salary } as Record<string, unknown>).eq('id', profile.id)
    setSalarySaving(false); setEditingSalary(false)
    setSalarySaved(true); setTimeout(() => setSalarySaved(false), 2500)
  }

  const activity = useMemo(() => {
    if (applications.length === 0) return []
    return applications.slice(0, 5).map(app => ({
      icon: '📋',
      text: app.company || app.position || 'Bewerbung',
      sub: app.position || app.company || '',
      time: app.created_at ? relativeDate(app.created_at) : 'Kürzlich',
      nav: 'applications' as NavId,
    }))
  }, [applications])

  return (
    <aside style={isMobile
      ? { width: '100%', padding: '0', background: C.bg }
      : { width: 288, flexShrink: 0, borderLeft: `0.5px solid ${C.border}`, padding: '24px 20px', overflowY: 'auto', background: C.bg }
    }>
      <ProfileCompleteness profile={profile} onNav={onNav} />
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Wunschgehalt</div>
          {salarySaved ? <span style={{ fontSize: 11, color: C.success }}>✓ Gespeichert</span> : (
            <span onClick={() => setEditingSalary(e => !e)} style={{ fontSize: 12, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>{editingSalary ? 'Schließen' : 'Bearbeiten'}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.mid, marginBottom: 10 }}>Deine Gehaltsvorstellung</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: '-.5px', marginBottom: 3 }}>
          {(salary - 5000).toLocaleString('de')} € – {(salary + 5000).toLocaleString('de')} €
        </div>
        <div style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Zielgehalt: {salary.toLocaleString('de')} €</div>
        {editingSalary && (
          <>
            <input type="range" min={25000} max={150000} step={1000} value={salary} onChange={e => setSalary(Number(e.target.value))}
              style={{ width: '100%', accentColor: C.purple, cursor: 'pointer', height: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: C.mid }}>25K €</span>
              <span style={{ fontSize: 11, color: C.mid }}>150K €</span>
            </div>
            <button onClick={saveSalary} disabled={salarySaving}
              style={{ width: '100%', padding: '7px', borderRadius: 8, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              {salarySaving ? 'Speichern…' : 'Speichern'}
            </button>
          </>
        )}
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
          <span onClick={() => onNav('courses')} style={{ fontSize: 12, color: C.navy3, cursor: 'pointer', fontWeight: 500 }}>Alle anzeigen</span>
        </div>
        {COURSES.slice(0, 3).map(course => (
          <div key={course.name} onClick={() => window.open(course.url === '#' ? `https://www.${course.platform.toLowerCase()}.com` : course.url, '_blank')}
            style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, cursor: 'pointer' }}>
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
        {activity.length === 0 ? (
          <div style={{ fontSize: 12, color: C.mid, padding: '10px 0' }}>Noch keine Aktivität — sende deine erste Bewerbung, um sie hier zu sehen.</div>
        ) : activity.map((a, i) => (
          <div key={i} onClick={() => a.nav && onNav(a.nav)}
            style={{ display: 'flex', gap: 10, marginBottom: 14, cursor: a.nav ? 'pointer' : 'default', borderRadius: 8, padding: '4px 6px', marginLeft: -6, transition: 'background .15s' }}
            onMouseEnter={e => { if (a.nav) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(27,46,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.white }}>{a.text}</div>
              <div style={{ fontSize: 11, color: C.mid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.sub} · {a.time}</div>
            </div>
            {a.nav && <span style={{ fontSize: 10, color: C.mid, alignSelf: 'center', flexShrink: 0 }}>→</span>}
          </div>
        ))}
      </section>
    </aside>
  )
}

// ── Section: Jobs finden (live API) ──────────────────────────────────────────
function JobsSection({ isPro, onSelect, onNeedPro, initialSearch, profile }: { isPro: boolean; onSelect: (j: DashJob) => void; onNeedPro: () => void; initialSearch?: string; profile?: UserProfile }) {
  const [search, setSearch]     = useState(initialSearch || profile?.desired_position || '')
  const [location, setLocation] = useState(profile?.city || '')
  const [workType, setWorkType] = useState('')
  const [jobs, setJobs]         = useState<DashJob[]>([])
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [searched, setSearched] = useState(false)
  const mob = useIsMobile()

  const inSt: React.CSSProperties = { padding: '10px 14px', minHeight: 44, borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: mob ? 16 : 13, outline: 'none', width: '100%' }
  const selSt: React.CSSProperties = { ...inSt, background: '#0D1117', cursor: 'pointer' }

  async function doSearch() {
    setLoading(true); setApiError(''); setSearched(true)
    if (search) trackEvent('Search', { search_string: search })
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (location) params.set('location', location)
      if (workType) params.set('workType', workType)
      const res  = await fetch(`/api/jobs/search?${params}`)
      const data = await res.json()
      if (data.error && !data.jobs?.length) { setApiError(data.error); setJobs([]); return }
      setJobs((data.jobs as RealJob[] || []).map(adaptJob))
    } catch { setApiError('Stellensuche vorübergehend nicht verfügbar') }
    finally { setLoading(false) }
  }

  // Auto-search on first render with initial search term
  useEffect(() => { doSearch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = workType ? jobs.filter(j => j.type.toLowerCase().includes(workType.toLowerCase())) : jobs

  return (
    <div>
      <h2 style={{ fontSize: mob ? 20 : 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>Jobs finden</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 16 }}>{searched && !loading ? `${jobs.length} Jobs gefunden` : 'Echte Jobs aus Europa & DACH'}</p>
      {/* Filters — stack on mobile */}
      {mob ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Jobtitel, Keywords…" style={inSt} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Stadt…" style={inSt} />
            <select value={workType} onChange={e => setWorkType(e.target.value)} style={selSt}>
              <option value="">Alle Modelle</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Vor Ort">Vor Ort</option>
            </select>
          </div>
          <button onClick={doSearch} disabled={loading} style={{ padding: '11px', minHeight: 48, borderRadius: 10, background: C.navy, color: C.white, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700 }}>
            {loading ? '⏳ Suche läuft…' : '🔍 Jobs suchen'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, marginBottom: 20, alignItems: 'end' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Jobtitel, Keywords…" style={inSt} />
          <input value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Stadt, Region…" style={inSt} />
          <select value={workType} onChange={e => setWorkType(e.target.value)} style={selSt}>
            <option value="">Alle Modelle</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Vor Ort">Vor Ort</option>
          </select>
          <button onClick={doSearch} disabled={loading}
            style={{ padding: '9px 20px', borderRadius: 9, background: C.navy, color: C.white, border: 'none', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {loading ? '⏳' : '🔍 Suchen'}
          </button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: C.mid }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Jobs werden geladen…</div>
        </div>
      )}
      {!loading && apiError && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171', border: `0.5px solid rgba(248,113,113,0.2)`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14 }}>{apiError}</div>
        </div>
      )}
      {!loading && !apiError && filtered.length === 0 && searched && (
        <div style={{ textAlign: 'center', padding: '3rem', color: C.mid, border: `0.5px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14 }}>Keine Jobs gefunden. Andere Keywords probieren.</div>
        </div>
      )}
      {!loading && !apiError && filtered.map(job => (
        <JobCard key={job.id} job={job} onClick={() => { if (!isPro) { onNeedPro(); return }; onSelect(job) }} />
      ))}
    </div>
  )
}

// ── Section: Bewerbungen ──────────────────────────────────────────────────────
function ApplicationsSection({ applications, profile }: { applications: Application[]; profile: UserProfile }) {
  const supabase = createClient()
  const router = useRouter()
  // Initialize statuses from the Supabase data (status column may not be in TS type)
  const [appStatuses, setAppStatuses] = useState<Record<string, AppStatus>>(() => {
    const m: Record<string, AppStatus> = {}
    applications.forEach(a => {
      const s = (a as unknown as Record<string, unknown>).status as AppStatus | undefined
      if (s && APP_STATUSES.includes(s)) m[a.id] = s
    })
    return m
  })
  const [showAdd, setShowAdd] = useState(false)
  const [newPos, setNewPos] = useState('')
  const [newComp, setNewComp] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function showMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getStatus(id: string): AppStatus { return appStatuses[id] || 'Gesendet' }

  async function setStatus(id: string, status: AppStatus) {
    setAppStatuses(p => ({ ...p, [id]: status }))
    const { error } = await supabase.from('applications').update({ status } as Record<string, unknown>).eq('id', id)
    if (error) showMsg('Fehler beim Speichern des Status')
  }

  async function addApplication() {
    if (!newPos.trim()) return
    setSaving(true)
    const { error } = await supabase.from('applications').insert({
      user_id: profile.id, position: newPos, company: newComp || null,
      template: 'classic', style: 'balanced',
      cv_data: { profil: '', erfahrung: '', ausbildung: '', skills: [], sprachen: '', anschreiben: '' },
      cover_letter: '',
      ...(newDate ? { applied_at: newDate } : {}),
    })
    setSaving(false)
    if (error) { showMsg('Fehler beim Erstellen der Bewerbung'); return }
    setShowAdd(false); setNewPos(''); setNewComp(''); setNewDate('')
    showMsg('Bewerbung gespeichert ✓')
    router.refresh()
  }

  async function deleteApplication(id: string) {
    await supabase.from('applications').delete().eq('id', id)
    showMsg('Bewerbung gelöscht')
    router.refresh()
  }

  const statusCounts = APP_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => getStatus(a.id) === s).length
    return acc
  }, {} as Record<AppStatus, number>)

  const inStyle: React.CSSProperties = { padding: '9px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%' }

  if (applications.length === 0 && !showAdd) {
    return (
      <div style={{ maxWidth: 560 }}>
        {toast && <div className="profile-save-toast">{toast}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Bewerbungen</h2>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>+ Neue Bewerbung</button>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: `0.5px solid ${C.border}`, borderRadius: 16, background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 8 }}>Noch keine Bewerbungen — finde deinen Traumjob!</div>
          <p style={{ fontSize: 13, color: C.mid, marginBottom: 28, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 28px' }}>
            Durchsuche hunderte Jobs und bewirb dich mit einem Klick. Jobbly erstellt dein Anschreiben automatisch mit KI.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { /* use parent onNav */ setShowAdd(true) }} style={{ padding: '11px 22px', borderRadius: 10, background: `rgba(255,255,255,0.06)`, color: C.white, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>+ Manuell hinzufügen</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {toast && <div className="profile-save-toast">{toast}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>Bewerbungen</h2>
        <button onClick={() => setShowAdd(s => !s)} style={{ padding: '8px 16px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>+ Neue Bewerbung</button>
      </div>

      {showAdd && (
        <div style={{ padding: '18px 20px', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.4)`, background: 'rgba(27,46,107,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 14 }}>Neue Bewerbung</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 5 }}>Position *</label>
              <input value={newPos} onChange={e => setNewPos(e.target.value)} onKeyDown={e => e.key === 'Enter' && addApplication()} placeholder="z.B. Product Manager" style={inStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 5 }}>Unternehmen</label>
              <input value={newComp} onChange={e => setNewComp(e.target.value)} placeholder="z.B. TechVision GmbH" style={inStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 5 }}>Bewerbungsdatum</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inStyle, width: 'auto' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addApplication} disabled={saving || !newPos.trim()}
              style={{ padding: '8px 18px', borderRadius: 9, background: saving || !newPos.trim() ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: saving || !newPos.trim() ? C.mid : C.white, border: 'none', cursor: saving || !newPos.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
              {saving ? 'Speichern…' : 'Bewerbung speichern'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', borderRadius: 9, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['Gesamt', applications.length, C.white], ['Gesendet', statusCounts['Gesendet'] || 0, C.mid], ['Interview', statusCounts['Interview'] || 0, C.amber], ['Angebot', statusCounts['Angebot'] || 0, C.success], ['Abgelehnt', statusCounts['Abgelehnt'] || 0, '#f87171']].map(([l, v, col]) => (
          <div key={String(l)} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, flex: '1 0 auto', textAlign: 'center', minWidth: 70 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: col as string }}>{String(v)}</div>
            <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{String(l)}</div>
          </div>
        ))}
      </div>

      {/* Application list */}
      {applications.map(app => {
        const status = getStatus(app.id)
        const expanded = expandedId === app.id
        const cl = (app as unknown as Record<string, unknown>).cover_letter as string | undefined
        return (
          <div key={app.id} style={{ marginBottom: 8, borderRadius: 12, border: `0.5px solid ${expanded ? 'rgba(27,46,107,0.5)' : C.border}`, background: expanded ? 'rgba(27,46,107,0.06)' : 'rgba(255,255,255,0.02)', overflow: 'hidden', transition: 'all .2s' }}>
            <div onClick={() => setExpandedId(expanded ? null : app.id)}
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${STATUS_COLORS[status]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {status === 'Interview' ? '💬' : status === 'Angebot' ? '🎉' : status === 'Abgelehnt' ? '❌' : status === 'Angesehen' ? '👀' : '📤'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{app.position}</div>
                <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{app.company || '—'} · {new Date(app.created_at).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select value={status} onChange={e => { e.stopPropagation(); setStatus(app.id, e.target.value as AppStatus) }}
                  onClick={e => e.stopPropagation()}
                  style={{ padding: '5px 10px', borderRadius: 20, border: `0.5px solid ${STATUS_COLORS[status]}40`, background: `${STATUS_COLORS[status]}18`, color: STATUS_COLORS[status], fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  {APP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: 12, color: C.mid, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▾</span>
              </div>
            </div>
            {expanded && (
              <div style={{ padding: '0 18px 16px', borderTop: `0.5px solid ${C.border}` }}>
                {cl ? (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>Anschreiben</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxHeight: 120, overflow: 'auto', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: `0.5px solid ${C.border}` }}>{cl}</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 14, fontSize: 12, color: C.mid }}>Kein Anschreiben gespeichert.</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => navigator.clipboard.writeText(cl || '').then(() => showMsg('Kopiert ✓'))} disabled={!cl}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: cl ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 12 }}>📋 Kopieren</button>
                  <button onClick={() => deleteApplication(app.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>🗑 Löschen</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── CV helpers ────────────────────────────────────────────────────────────────
interface CVVersion {
  id: string; name: string; design: 'nordic' | 'mono' | 'split'
  data: { name: string; email: string; phone: string; city: string; position: string; experience: string; education: string; skills: string; languages: string; summary: string }
  createdAt: string; updatedAt: string
}
const CV_DESIGNS = [
  { id: 'nordic' as const, name: 'Nordic Minimal', desc: 'Sauber, Serif, Professionell', accent: '#1B2E6B', sidebar: '' },
  { id: 'mono' as const, name: 'Mono Elegant', desc: 'Bold Header, Hoher Kontrast', accent: '#111111', sidebar: '' },
  { id: 'split' as const, name: 'Split Premium', desc: 'Marine Sidebar, Modern', accent: '#253A85', sidebar: '#1B2E6B' },
]

async function exportCvPDF(data: CVVersion['data'], name: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(data.name || 'Name', 15, 22)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100)
  doc.text(data.position || '', 15, 30)
  doc.text([data.city, data.email, data.phone].filter(Boolean).join('  ·  '), 15, 37)
  doc.setTextColor(0); doc.line(15, 41, 195, 41)
  let y = 50
  const addSection = (title: string, content: string) => {
    if (!content) return
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(title, 15, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const lines = doc.splitTextToSize(content, 180); doc.text(lines, 15, y); y += lines.length * 5 + 6
  }
  addSection('Profil', data.summary); addSection('Berufserfahrung', data.experience)
  addSection('Ausbildung', data.education); addSection('Skills', data.skills); addSection('Sprachen', data.languages)
  doc.save(`${name}.pdf`)
}

async function exportCvWord(data: CVVersion['data'], name: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
  const section = (title: string, content: string) => content ? [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: content }), new Paragraph({ text: '' }),
  ] : []
  const doc = new Document({ sections: [{ properties: {}, children: [
    new Paragraph({ text: data.name, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: data.position, bold: true })] }),
    new Paragraph({ text: [data.city, data.email, data.phone].filter(Boolean).join(' · ') }),
    new Paragraph({ text: '' }),
    ...section('Profil', data.summary), ...section('Berufserfahrung', data.experience),
    ...section('Ausbildung', data.education), ...section('Skills', data.skills),
    ...section('Sprachen', data.languages),
  ]}]})
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${name}.docx`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

function MiniCVPreview({ data, design }: { data: CVVersion['data']; design: string }) {
  const d = CV_DESIGNS.find(x => x.id === design) || CV_DESIGNS[0]
  const isSplit = design === 'split'
  const isMono = design === 'mono'

  if (isSplit) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#fff', borderRadius: 4, overflow: 'hidden', fontSize: 5 }}>
      <div style={{ width: '35%', background: d.accent, color: '#fff', padding: '10px 6px' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700 }}>{(data.name || 'N').charAt(0)}</div>
        <div style={{ fontWeight: 700, fontSize: 5.5, textAlign: 'center', marginBottom: 2 }}>{data.name || 'Dein Name'}</div>
        <div style={{ fontSize: 4.5, textAlign: 'center', opacity: 0.8, marginBottom: 6 }}>{data.position || 'Position'}</div>
        <div style={{ fontSize: 4, opacity: 0.7, marginBottom: 2 }}>📧 {data.email || 'email@mail.com'}</div>
        <div style={{ fontSize: 4, opacity: 0.7, marginBottom: 2 }}>📍 {data.city || 'Stadt'}</div>
        {data.skills && <><div style={{ fontWeight: 700, fontSize: 5, marginTop: 8, marginBottom: 3 }}>SKILLS</div>{data.skills.split(',').slice(0, 3).map((s, i) => <div key={i} style={{ fontSize: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, padding: '1px 3px', marginBottom: 2 }}>{s.trim()}</div>)}</>}
      </div>
      <div style={{ flex: 1, padding: '10px 6px' }}>
        {data.summary && <><div style={{ fontWeight: 700, fontSize: 5, color: d.accent, borderBottom: `0.5px solid ${d.accent}`, marginBottom: 4, paddingBottom: 1 }}>PROFIL</div><div style={{ fontSize: 4, color: '#444', lineHeight: 1.5, marginBottom: 8 }}>{data.summary.slice(0, 100)}</div></>}
        {data.experience && <><div style={{ fontWeight: 700, fontSize: 5, color: d.accent, borderBottom: `0.5px solid ${d.accent}`, marginBottom: 4, paddingBottom: 1 }}>ERFAHRUNG</div><div style={{ fontSize: 4, color: '#444', lineHeight: 1.5 }}>{data.experience.slice(0, 80)}</div></>}
      </div>
    </div>
  )

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: 4, padding: '10px 8px', overflow: 'hidden' }}>
      {isMono ? (
        <div style={{ background: '#111', padding: '8px', margin: '-10px -8px 8px', color: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: 1 }}>{data.name || 'DEIN NAME'}</div>
          <div style={{ fontSize: 5, opacity: 0.7, marginTop: 2 }}>{data.position || 'Position'} · {data.city || 'Stadt'}</div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 8, color: '#111', marginBottom: 1 }}>{data.name || 'Dein Name'}</div>
          <div style={{ fontSize: 5, color: d.accent, fontWeight: 600, marginBottom: 2 }}>{data.position || 'Deine Position'}</div>
          <div style={{ fontSize: 4, color: '#666', marginBottom: 6 }}>{[data.city, data.email].filter(Boolean).join(' · ')}</div>
          <div style={{ height: 0.5, background: d.accent, marginBottom: 6 }} />
        </>
      )}
      {data.summary && <><div style={{ fontSize: 4.5, fontWeight: 700, color: isMono ? '#111' : d.accent, marginBottom: 2 }}>PROFIL</div><div style={{ fontSize: 3.8, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{data.summary.slice(0, 80)}</div></>}
      {data.experience && <><div style={{ fontSize: 4.5, fontWeight: 700, color: isMono ? '#111' : d.accent, marginBottom: 2 }}>ERFAHRUNG</div><div style={{ fontSize: 3.8, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{data.experience.slice(0, 80)}</div></>}
      {data.skills && <><div style={{ fontSize: 4.5, fontWeight: 700, color: isMono ? '#111' : d.accent, marginBottom: 3 }}>SKILLS</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{data.skills.split(',').slice(0, 4).map((s, i) => <span key={i} style={{ fontSize: 3.5, background: `${d.accent}22`, color: d.accent, padding: '1px 3px', borderRadius: 2 }}>{s.trim()}</span>)}</div></>}
    </div>
  )
}

// ── Section: CV ───────────────────────────────────────────────────────────────
function CVSection({ profile, isPro, onNeedPro }: { profile: UserProfile; isPro: boolean; onNeedPro: () => void }) {
  const p = profile as UserProfile & Record<string, unknown>
  const storageKey = `jobbly_cvs_${profile.id}`
  const [cvs, setCvs] = useState<CVVersion[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
  })
  const [building, setBuilding] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState<CVVersion['design']>('nordic')
  const [cvName, setCvName] = useState('Mein Lebenslauf')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const [fd, setFd] = useState({
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    email: profile.email || '',
    phone: String(p.phone || ''),
    city: String(p.city || ''),
    position: String(p.position || ''),
    experience: String(p.experience || ''),
    education: '',
    skills: '',
    languages: '',
    summary: '',
  })

  function upd<K extends keyof typeof fd>(k: K, v: string) { setFd(prev => ({ ...prev, [k]: v })) }

  function saveCvs(updated: CVVersion[]) {
    setCvs(updated); localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  function startNew() {
    setBuilding(true); setEditingId(null); setCvName('Mein Lebenslauf'); setSelectedDesign('nordic')
    setFd({
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      email: profile.email || '', phone: String(p.phone || ''), city: String(p.city || ''),
      position: String(p.position || ''), experience: String(p.experience || ''),
      education: '', skills: '', languages: '', summary: '',
    })
  }

  function openEdit(cv: CVVersion) {
    setBuilding(true); setEditingId(cv.id); setCvName(cv.name); setSelectedDesign(cv.design); setFd(cv.data)
  }

  function saveCv() {
    const now = new Date().toISOString(); const id = editingId || `cv_${Date.now()}`
    const existing = cvs.find(c => c.id === editingId)
    const newCv: CVVersion = { id, name: cvName, design: selectedDesign, data: fd, createdAt: existing?.createdAt || now, updatedAt: now }
    saveCvs(editingId ? cvs.map(c => c.id === editingId ? newCv : c) : [...cvs, newCv])
    setSaved(true); setTimeout(() => setSaved(false), 2500); setBuilding(false); setEditingId(null)
  }

  function duplicateCv(cv: CVVersion) {
    const now = new Date().toISOString()
    saveCvs([...cvs, { ...cv, id: `cv_${Date.now()}`, name: `${cv.name} (Kopie)`, createdAt: now, updatedAt: now }])
  }

  const inp = (label: string, key: keyof typeof fd, placeholder = '', rows?: number) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {rows ? (
        <textarea value={fd[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 12, resize: 'vertical', outline: 'none' }} />
      ) : (
        <input value={fd[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
      )}
    </div>
  )

  if (building) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%' }}>
      {/* Left: form */}
      <div style={{ overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setBuilding(false); setEditingId(null) }} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>← Zurück</button>
          <input value={cvName} onChange={e => setCvName(e.target.value)} style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `0.5px solid rgba(255,255,255,0.15)`, background: 'rgba(255,255,255,0.06)', color: C.white, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, outline: 'none' }} />
        </div>

        {/* Design picker */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Design wählen</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {CV_DESIGNS.map(d => {
              const locked = d.id !== 'nordic' && !isPro
              return (
                <button key={d.id} onClick={() => locked ? onNeedPro() : setSelectedDesign(d.id)}
                  style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${selectedDesign === d.id ? C.navy2 : C.border}`, background: selectedDesign === d.id ? 'rgba(27,46,107,0.3)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all .15s', position: 'relative', opacity: locked ? 0.65 : 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: selectedDesign === d.id ? C.navy3 : C.white, marginBottom: 3 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: C.mid }}>{d.desc}</div>
                  {locked && <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 10, color: C.amber }}>⭐ Pro</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Deine Daten</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>{inp('Vorname & Nachname', 'name', 'Max Mustermann')}</div>
          <div>{inp('E-Mail', 'email', 'max@mail.com')}</div>
          <div>{inp('Telefon', 'phone', '+43 ...')}</div>
          <div>{inp('Stadt', 'city', 'Wien')}</div>
          <div style={{ gridColumn: '1 / -1' }}>{inp('Wunschposition', 'position', 'z.B. Product Manager')}</div>
        </div>
        {inp('Profil / Zusammenfassung', 'summary', 'Kurze professionelle Zusammenfassung…', 3)}
        {inp('Berufserfahrung', 'experience', 'z.B. 2020–2024: Senior PM bei TechCo…', 4)}
        {inp('Ausbildung', 'education', 'z.B. MSc Wirtschaftsinformatik, WU Wien', 2)}
        {inp('Skills (kommagetrennt)', 'skills', 'z.B. Product Management, Agile, Jira')}
        {inp('Sprachen', 'languages', 'z.B. Deutsch (Muttersprache), Englisch (C1)')}

        {/* Export/Save buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={saveCv} style={{ flex: 1, padding: '11px', borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
            {saved ? '✓ Gespeichert!' : '💾 Speichern'}
          </button>
          <button onClick={() => { if (!isPro) { onNeedPro(); return }; setExporting(true); exportCvPDF(fd, cvName).finally(() => setExporting(false)) }} disabled={exporting} style={{ padding: '11px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: C.white, border: `0.5px solid ${C.border2}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }} title={isPro ? undefined : '⭐ Pro'}>
            {exporting ? '…' : `📄 PDF${isPro ? '' : ' ⭐'}`}
          </button>
          <button onClick={() => { if (!isPro) { onNeedPro(); return }; setExporting(true); exportCvWord(fd, cvName).finally(() => setExporting(false)) }} disabled={exporting} style={{ padding: '11px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: C.white, border: `0.5px solid ${C.border2}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }} title={isPro ? undefined : '⭐ Pro'}>
            {exporting ? '…' : `📝 Word${isPro ? '' : ' ⭐'}`}
          </button>
        </div>
      </div>

      {/* Right: live preview */}
      <div style={{ position: 'sticky', top: 0, height: 'fit-content' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Vorschau · {CV_DESIGNS.find(d => d.id === selectedDesign)?.name}</div>
        <div style={{ width: '100%', aspectRatio: '210/297', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: `0.5px solid ${C.border2}` }}>
          <MiniCVPreview data={fd} design={selectedDesign} />
        </div>
        <p style={{ fontSize: 11, color: C.mid, marginTop: 10, textAlign: 'center' }}>Vorschau aktualisiert sich automatisch</p>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 4 }}>Lebenslauf</h2>
          <p style={{ fontSize: 13, color: C.mid }}>Erstelle professionelle Lebensläufe mit KI — in 3 Designs.</p>
        </div>
        <button onClick={startNew} style={{ padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
          + Neuen Lebenslauf erstellen
        </button>
      </div>

      {cvs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: `0.5px dashed ${C.border2}`, borderRadius: 16, background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 8 }}>Noch kein Lebenslauf erstellt</div>
          <p style={{ fontSize: 13, color: C.mid, marginBottom: 24, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>Erstelle deinen ersten Lebenslauf mit KI — wähle ein Design, fülle deine Daten ein und exportiere als PDF oder Word.</p>
          <button onClick={startNew} style={{ padding: '12px 28px', borderRadius: 10, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
            Jetzt erstellen →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {cvs.map(cv => (
            <div key={cv.id} style={{ borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
              {/* Mini preview thumbnail */}
              <div style={{ height: 130, overflow: 'hidden', background: '#fff', cursor: 'pointer' }} onClick={() => openEdit(cv)}>
                <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '263%', height: '263%' }}>
                  <MiniCVPreview data={cv.data} design={cv.design} />
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {renamingId === cv.id ? (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input value={renameVal} onChange={e => setRenameVal(e.target.value)} autoFocus
                      style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: `0.5px solid ${C.border2}`, background: 'rgba(255,255,255,0.08)', color: C.white, fontFamily: 'inherit', fontSize: 12, outline: 'none' }} />
                    <button onClick={() => { saveCvs(cvs.map(c => c.id === cv.id ? { ...c, name: renameVal } : c)); setRenamingId(null) }}
                      style={{ padding: '4px 8px', borderRadius: 6, background: C.navy, color: C.white, border: 'none', cursor: 'pointer', fontSize: 11 }}>✓</button>
                    <button onClick={() => setRenamingId(null)} style={{ padding: '4px 8px', borderRadius: 6, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3, cursor: 'text' }} onClick={() => { setRenamingId(cv.id); setRenameVal(cv.name) }}>{cv.name}</div>
                )}
                <div style={{ fontSize: 11, color: C.mid, marginBottom: 10 }}>{CV_DESIGNS.find(d => d.id === cv.design)?.name} · {new Date(cv.updatedAt).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => openEdit(cv)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: 'rgba(27,46,107,0.3)', color: C.navy3, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>Bearbeiten</button>
                  <button onClick={() => { if (!isPro) { onNeedPro(); return }; setExporting(true); exportCvPDF(cv.data, cv.name).finally(() => setExporting(false)) }} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }} title={isPro ? 'Als PDF exportieren' : '⭐ Pro – PDF Export'}>📄{isPro ? '' : '⭐'}</button>
                  <button onClick={() => duplicateCv(cv)} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }} title="Duplizieren">⧉</button>
                  <button onClick={() => saveCvs(cvs.filter(c => c.id !== cv.id))} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }} title="Löschen">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section: Anschreiben ──────────────────────────────────────────────────────
function LetterSection({ profile, isPro, onNeedPro }: { profile: UserProfile; isPro: boolean; onNeedPro: () => void }) {
  const supabase = createClient()
  const p = profile as UserProfile & Record<string, unknown>
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [letter, setLetter] = useState('')
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [drafts, setDrafts] = useState<Application[]>([])
  const [genCount, setGenCount] = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem('jobbly_gen_count') || '0', 10)
  })

  const FREE_LIMIT = 3

  const fetchDrafts = useCallback(async () => {
    const { data } = await supabase.from('applications').select('*')
      .eq('user_id', profile.id).not('cover_letter', 'is', null).neq('cover_letter', '')
      .order('created_at', { ascending: false }).limit(20)
    if (data) setDrafts(data as Application[])
  }, [supabase, profile.id])

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  async function generate() {
    if (!jobTitle) return
    if (!isPro && genCount >= FREE_LIMIT) { onNeedPro(); return }
    setLoading(true)
    try {
      const res = await fetch('/api/one-click-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: {
            fullname: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            city: String(p.city || ''), industry: String(p.industry || ''),
            experience: String(p.experience || ''), skills: String(p.skills || ''), lastjob: String(p.position || ''),
          },
          jobTitle, jobCompany: company,
          jobDescription: jobDesc || `Position: ${jobTitle}${company ? ' bei ' + company : ''}`,
          lang: 'de',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Fehler beim Generieren. Bitte versuche es erneut.')
        return
      }
      setLetter(data.coverLetter || '')
      const newCount = genCount + 1
      setGenCount(newCount)
      localStorage.setItem('jobbly_gen_count', String(newCount))
    } finally { setLoading(false) }
  }

  async function saveDraft() {
    if (!letter) return
    setSaving(true)
    await supabase.from('applications').insert({
      user_id: profile.id, position: jobTitle, company: company || null,
      template: 'classic', style: 'balanced',
      cv_data: { profil: '', erfahrung: '', ausbildung: '', skills: [], sprachen: '', anschreiben: '' },
      cover_letter: letter,
    })
    setSaving(false); setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2500)
    fetchDrafts()
  }

  async function deleteDraft(id: string) {
    await supabase.from('applications').delete().eq('id', id)
    fetchDrafts()
  }

  async function exportLetterPDF() {
    if (!letter) return; setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
      doc.text(`${jobTitle}${company ? ' · ' + company : ''}`, 15, 20)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5)
      const lines = doc.splitTextToSize(letter, 180); doc.text(lines, 15, 32)
      doc.save(`Anschreiben_${jobTitle || 'Jobbly'}.pdf`)
    } finally { setExporting(false) }
  }

  async function exportLetterWord() {
    if (!letter) return; setExporting(true)
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
      const children = [
        new Paragraph({ text: `${jobTitle}${company ? ' · ' + company : ''}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' }),
        ...letter.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line || ' ' })] })),
      ]
      const doc = new Document({ sections: [{ properties: {}, children }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `Anschreiben_${jobTitle || 'Jobbly'}.docx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  const btnStyle = (color: string, bg: string) => ({
    padding: '9px 14px', borderRadius: 9, background: bg, color, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties)

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white }}>KI Anschreiben erstellen</h2>
        {!isPro && <span style={{ fontSize: 12, color: C.mid, padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${C.border}` }}>{genCount}/{FREE_LIMIT} kostenlos genutzt</span>}
      </div>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Individuelles Anschreiben — perfekt auf den Job zugeschnitten.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Jobtitel *</label>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="z.B. Product Manager"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Unternehmen</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="z.B. TechVision GmbH"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Stellenbeschreibung einfügen (optional — für bessere Personalisierung)</label>
        <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4}
          placeholder="Füge hier die Stellenausschreibung ein…"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: 'rgba(255,255,255,0.04)', color: C.white, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', outline: 'none' }} />
      </div>

      <button onClick={generate} disabled={!jobTitle || loading}
        style={{ padding: '12px 28px', borderRadius: 10, background: jobTitle ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: jobTitle ? C.white : C.mid, border: 'none', cursor: jobTitle ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        {loading ? (
          <><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Wird generiert…</>
        ) : '⚡ Anschreiben generieren'}
      </button>

      {letter && (
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>Dein Anschreiben</label>
          <textarea value={letter} onChange={e => setLetter(e.target.value)} rows={16}
            style={{ width: '100%', padding: 16, borderRadius: 10, border: `0.5px solid rgba(27,46,107,0.35)`, background: 'rgba(27,46,107,0.06)', color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.75, resize: 'vertical', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={exportLetterPDF} disabled={exporting} style={btnStyle(C.white, `linear-gradient(135deg, ${C.navy}, ${C.navy2})`)} >📄 Als PDF exportieren</button>
            <button onClick={exportLetterWord} disabled={exporting} style={btnStyle(C.navy3, 'rgba(27,46,107,0.2)')} >📝 Als Word exportieren</button>
            <button onClick={saveDraft} disabled={saving || draftSaved} style={btnStyle(C.success, 'rgba(74,222,128,0.08)')} >{draftSaved ? '✓ Gespeichert!' : saving ? '…' : '💾 Als Entwurf speichern'}</button>
            <button onClick={() => navigator.clipboard.writeText(letter)} style={btnStyle(C.mid, 'rgba(255,255,255,0.04)')} >📋 Kopieren</button>
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 16 }}>Meine Anschreiben</div>
          {drafts.map(draft => (
            <div key={draft.id} style={{ padding: '14px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', marginBottom: 8, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 2 }}>{draft.position || '—'} {draft.company ? `· ${draft.company}` : ''}</div>
                <div style={{ fontSize: 11, color: C.mid, marginBottom: 6 }}>{new Date(draft.created_at).toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{draft.cover_letter?.slice(0, 120)}…</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setJobTitle(draft.position || ''); setCompany(draft.company || ''); setLetter(draft.cover_letter || '') }}
                  style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(27,46,107,0.3)', color: C.navy3, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>Öffnen</button>
                <button onClick={() => deleteDraft(draft.id)}
                  style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Profile Block wrapper — defined at module level to prevent remount on re-render ──
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, padding: '20px 22px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16, paddingBottom: 12, borderBottom: `0.5px solid ${C.border}` }}>{title}</div>
      {children}
    </div>
  )
}

// ── Section: Meine Daten ──────────────────────────────────────────────────────
function ProfileSection({ profile, onPhotoUpdate }: { profile: UserProfile; onPhotoUpdate?: (url: string) => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSent, setPwSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoToast, setPhotoToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const p = profile as UserProfile & Record<string, string | number | boolean>
  const [existingAvatar, setExistingAvatar] = useState(String(p.photo_url || p.avatar_url || ''))

  const [form, setForm] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: String(p.phone || ''),
    city: String(p.city || ''),
    address: String(p.address || ''),
    zip_code: String(p.zip_code || ''),
    country: String(p.country || 'Österreich'),
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

  function openFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  function showPhotoToast(msg: string, ok = true) {
    setPhotoToast({ msg, ok })
    setTimeout(() => setPhotoToast(null), 3500)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      showPhotoToast('Nur JPG, PNG oder WebP erlaubt', false); return
    }
    if (file.size > 5 * 1024 * 1024) {
      showPhotoToast('Foto zu groß — max. 5 MB', false); return
    }

    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
    setPhotoUploading(true)
    try {
      const path = `${profile.id}/profile.jpg`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) {
        console.error('Photo upload error:', uploadErr.message)
        showPhotoToast(`Upload fehlgeschlagen: ${uploadErr.message}`, false)
        setPhotoPreview(existingAvatar || null)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData!.path)
      const url = `${urlData.publicUrl}?t=${Date.now()}`
      // Use service-role API route to guarantee DB write bypasses RLS
      const saveRes = await fetch('/api/profile/save-photo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: url }),
      })
      if (!saveRes.ok) {
        const saveJson = await saveRes.json().catch(() => ({}))
        console.error('Photo DB save error:', saveJson)
        showPhotoToast(`Foto-Speicherung fehlgeschlagen: ${(saveJson as { details?: string }).details || 'DB-Fehler'}`, false)
        return
      }
      setExistingAvatar(url)
      setPhotoPreview(url)
      if (onPhotoUpdate) onPhotoUpdate(url)
      router.refresh()
      showPhotoToast('Foto gespeichert ✅')
    } catch (err) {
      console.error('Photo upload exception:', err)
      showPhotoToast('Upload fehlgeschlagen', false)
      setPhotoPreview(existingAvatar || null)
    } finally {
      setPhotoUploading(false)
    }
  }

  async function deletePhoto() {
    setPhotoPreview(null)
    setExistingAvatar('')
    await fetch('/api/profile/save-photo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: null }),
    })
    if (onPhotoUpdate) onPhotoUpdate('')
    router.refresh()
  }

  async function save() {
    setSaving(true); setSaved(false)
    try {
      await supabase.from('profiles').update({
        ...form, ...prefs, ...notifications,
        ...(existingAvatar ? { photo_url: existingAvatar, avatar_url: existingAvatar } : {}),
      } as Record<string, unknown>).eq('id', profile.id)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  async function sendPwReset() {
    setPwLoading(true)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${appUrl}/auth/reset-password` })
    setPwLoading(false); setPwSent(true)
  }

  const initials = ((profile.first_name || '?').charAt(0) + (profile.last_name || '').charAt(0)).toUpperCase()
  const currentPhoto = photoPreview || existingAvatar || null

  // Profile completion score — build a merged profile-like object from live form state
  const completionScore = getProfileCompleteness({
    ...profile,
    first_name: form.first_name,
    last_name: form.last_name,
    phone: form.phone,
    city: form.city,
    address: form.address,
    zip_code: form.zip_code,
    photo_url: currentPhoto || profile.photo_url,
    industry: prefs.industry,
    position: prefs.position,
    salary_target: prefs.salary_target,
    work_model: prefs.work_model,
  } as UserProfile).score

  const inStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', minHeight: 44, borderRadius: 9,
    border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const inDisabledStyle: React.CSSProperties = {
    ...inStyle, borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)',
    color: C.mid, cursor: 'not-allowed',
  }

  type FormKey = keyof typeof form
  const field = (label: string, key: FormKey, type = 'text', placeholder = '', disabled = false) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input className="profile-input" type={type} value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder} disabled={disabled}
        style={disabled ? inDisabledStyle : inStyle} />
    </div>
  )

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />

      {/* Toast */}
      {saved && <div className="profile-save-toast">Gespeichert ✓</div>}
      {photoToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, backgroundColor: photoToast.ok ? '#0D2A1A' : '#2A0D0D', color: photoToast.ok ? C.success : '#f87171', border: `1px solid ${photoToast.ok ? '#2A6B47' : '#6B2A2A'}` }}>
          {photoToast.msg}
        </div>
      )}

      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 24 }}>Meine Daten</h2>

      <div className="profile-layout">
        {/* ── Left column: all form blocks ── */}
        <div>
          {/* Photo */}
          <Block title="Profilfoto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Avatar circle — clicking opens picker */}
              <div className="profile-avatar-circle"
                onClick={openFilePicker}
                style={{ background: currentPhoto ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 28, fontWeight: 700, color: C.white }}
                title="Foto ändern">
                {currentPhoto
                  ? <img src={currentPhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span>{initials}</span>}
                <div className="avatar-overlay">
                  <span className="avatar-icon">📷</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <button onClick={openFilePicker}
                    style={{ padding: '8px 16px', minHeight: 38, borderRadius: 9, background: 'rgba(27,46,107,0.3)', color: C.navy3, border: `0.5px solid rgba(27,46,107,0.4)`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                    📷 Foto hochladen
                  </button>
                  {currentPhoto && (
                    <button onClick={deletePhoto}
                      style={{ padding: '8px 14px', minHeight: 38, borderRadius: 9, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.25)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                      Foto löschen
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.mid }}>JPG, PNG oder WebP · max. 5 MB</div>
              </div>
            </div>
          </Block>

          {/* Personal info */}
          <Block title="Persönliche Angaben">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {field('Vorname', 'first_name', 'text', 'Max')}
              {field('Nachname', 'last_name', 'text', 'Mustermann')}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>E-Mail</label>
              <input type="email" value={profile.email} disabled className="profile-input" style={inDisabledStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {field('Telefon', 'phone', 'tel', '+43 ...')}
              {field('Stadt', 'city', 'text', 'Wien')}
            </div>
            {field('Adresse (Straße & Hausnummer)', 'address', 'text', 'Mariahilfer Straße 100')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {field('PLZ', 'zip_code', 'text', '1060')}
              {field('Land', 'country', 'text', 'Österreich')}
            </div>
            {field('LinkedIn', 'linkedin', 'url', 'https://linkedin.com/in/...')}
            {field('Geburtstag', 'birthday', 'date')}
          </Block>

          {/* Job preferences */}
          <Block title="Job-Präferenzen">
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Branche</label>
              <input className="profile-input" value={prefs.industry}
                onChange={e => setPrefs(pr => ({ ...pr, industry: e.target.value }))}
                placeholder="z.B. IT & Technologie" style={inStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 6, fontWeight: 500 }}>Wunschposition</label>
              <input className="profile-input" value={prefs.position}
                onChange={e => setPrefs(pr => ({ ...pr, position: e.target.value }))}
                placeholder="z.B. Product Manager" style={inStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>Arbeitsmodell</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['remote', '🏠 Remote'], ['hybrid', '🔄 Hybrid'], ['office', '🏢 Vor Ort']].map(([v, l]) => (
                  <button key={v} onClick={() => setPrefs(pr => ({ ...pr, work_model: v }))}
                    style={{ flex: 1, minWidth: 90, minHeight: 40, padding: '9px 6px', borderRadius: 9, border: `0.5px solid ${prefs.work_model === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: prefs.work_model === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: prefs.work_model === v ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>Wunschgehalt: <strong style={{ color: C.white }}>{prefs.salary_target.toLocaleString('de')} €</strong></label>
              <input type="range" min={25000} max={150000} step={5000} value={prefs.salary_target}
                onChange={e => setPrefs(pr => ({ ...pr, salary_target: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: C.purple, cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.mid, marginTop: 4 }}>
                <span>25.000 €</span><span>150.000 €</span>
              </div>
            </div>
          </Block>

          {/* Notifications */}
          <Block title="Benachrichtigungen">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>Job-Alerts</div>
                <div style={{ fontSize: 11, color: C.mid }}>Benachrichtigt bei passenden Jobs</div>
              </div>
              <button onClick={() => setNotifications(n => ({ ...n, job_alerts: !n.job_alerts }))}
                style={{ width: 44, height: 24, borderRadius: 12, background: notifications.job_alerts ? C.navy : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: notifications.job_alerts ? 23 : 3, transition: 'left .2s' }} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 8, fontWeight: 500 }}>E-Mail-Häufigkeit</label>
              <select value={notifications.email_frequency}
                onChange={e => setNotifications(n => ({ ...n, email_frequency: e.target.value }))}
                className="profile-input"
                style={{ ...inStyle, cursor: 'pointer' }}>
                <option value="instant">Sofort</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
              </select>
            </div>
          </Block>

          {/* Account */}
          <Block title="Konto">
            {pwSent ? (
              <div style={{ fontSize: 12, color: C.success, padding: '8px 14px', background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, display: 'inline-block' }}>✓ Reset-Link wurde gesendet</div>
            ) : (
              <button onClick={sendPwReset} disabled={pwLoading}
                style={{ padding: '9px 18px', minHeight: 44, borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: C.mid, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                {pwLoading ? 'Wird gesendet…' : '🔑 Passwort ändern'}
              </button>
            )}
          </Block>

          <button onClick={save} disabled={saving}
            style={{ width: '100%', padding: 15, minHeight: 50, borderRadius: 10, background: saving ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: saving ? C.mid : C.white, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {photoUploading ? '📷 Foto hochladen…' : saving ? 'Speichern…' : '💾 Änderungen speichern'}
          </button>
        </div>

        {/* ── Right column: profile summary + tips (desktop only) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Completion card */}
          <div style={{ padding: '20px 22px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 14 }}>Profil-Vollständigkeit</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              {/* Ring */}
              <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                <circle cx={32} cy={32} r={26} fill="none" stroke={completionScore >= 80 ? C.success : C.navy3} strokeWidth={6}
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionScore / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .6s' }} />
                <text x={32} y={36} textAnchor="middle" fill={C.white} fontSize={13} fontWeight={700}>{completionScore}%</text>
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 4 }}>
                  {completionScore === 100 ? 'Perfekt!' : completionScore >= 70 ? 'Fast fertig!' : 'Ausbaufähig'}
                </div>
                <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5 }}>
                  {completionScore < 100 ? 'Fülle alle Felder aus für mehr Job-Matches.' : 'Dein Profil ist vollständig ausgefüllt.'}
                </div>
              </div>
            </div>
            {/* Field checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                [form.first_name && form.last_name, 'Vor- & Nachname'],
                [currentPhoto, 'Profilfoto'],
                [form.phone, 'Telefonnummer'],
                [form.city, 'Stadt'],
                [form.address && form.zip_code, 'Adresse & PLZ'],
                [prefs.industry, 'Branche'],
                [prefs.position, 'Wunschposition'],
              ].map(([done, label]) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: done ? C.success : 'rgba(255,255,255,0.2)', fontSize: 14 }}>{done ? '✓' : '○'}</span>
                  <span style={{ color: done ? 'rgba(255,255,255,0.7)' : C.mid }}>{String(label)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips card */}
          <div style={{ padding: '20px 22px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 12 }}>💡 Tipps</div>
            {[
              ['📷', 'Profilbild erhöht Rückrufe um bis zu 30 %'],
              ['🔗', 'LinkedIn-Link zeigt Recruitern dein Netzwerk'],
              ['💰', 'Wunschgehalt hilft uns, passende Jobs zu filtern'],
              ['🔔', 'Job-Alerts – damit du nichts verpasst'],
            ].map(([icon, tip]) => (
              <div key={String(tip)} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 12, color: C.mid, lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0 }}>{String(icon)}</span>
                <span>{String(tip)}</span>
              </div>
            ))}
          </div>

          {/* Quick info preview */}
          <div style={{ padding: '20px 22px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(27,46,107,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 12 }}>Kurzübersicht</div>
            {[
              ['👤', [form.first_name, form.last_name].filter(Boolean).join(' ') || '—'],
              ['📍', form.city || '—'],
              ['💼', prefs.position || String(p.current_position || '') || '—'],
              ['🏢', prefs.industry || '—'],
              ['💶', prefs.salary_target ? prefs.salary_target.toLocaleString('de') + ' €' : '—'],
              ['🔄', prefs.work_model === 'remote' ? '🏠 Remote' : prefs.work_model === 'office' ? '🏢 Vor Ort' : prefs.work_model === 'hybrid' ? '🔄 Hybrid' : '—'],
            ].map(([icon, val]) => (
              <div key={String(icon)} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{String(icon)}</span>
                <span style={{ fontSize: 12, color: String(val) === '—' ? C.mid : 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section: Statistiken ──────────────────────────────────────────────────────
function StatsSection({ applications }: { applications: Application[] }) {
  // Build real weekly counts from applications.created_at (last 6 weeks)
  const weekData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (5 - i) * 7 - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
      const count = applications.filter(a => {
        const d = new Date(a.created_at)
        return d >= weekStart && d < weekEnd
      }).length
      const kw = (() => {
        const d = new Date(weekStart); d.setHours(12)
        const jan1 = new Date(d.getFullYear(), 0, 1)
        return 'KW ' + Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
      })()
      return { label: kw, count }
    })
  }, [applications])

  const maxCount = Math.max(...weekData.map(w => w.count), 1)
  const statusCounts = APP_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => (((a as unknown as Record<string, unknown>).status as string) || 'Gesendet') === s).length
    return acc
  }, {} as Record<string, number>)
  const interviews = statusCounts['Interview'] || 0
  const offers = statusCounts['Angebot'] || 0

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Statistiken</h2>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>Dein Bewerbungsfortschritt — echte Daten aus deinem Account.</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          ['📤', String(applications.length), 'Bewerbungen', ''],
          ['💬', String(interviews), 'Interviews', interviews > 0 ? `${Math.round(interviews / Math.max(applications.length, 1) * 100)}% Quote` : ''],
          ['🎉', String(offers), 'Angebote', offers > 0 ? 'Glückwunsch!' : ''],
          ['❌', String(statusCounts['Abgelehnt'] || 0), 'Abgelehnt', ''],
        ].map(([icon, val, label, sub]) => (
          <div key={label} style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 3 }}>{val}</div>
            <div style={{ fontSize: 11, color: C.mid }}>{label}</div>
            {sub && <div style={{ fontSize: 10, color: C.success, marginTop: 3 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div style={{ padding: '20px 24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 16 }}>Status-Übersicht</div>
        {APP_STATUSES.map(s => {
          const count = statusCounts[s] || 0
          const pct = applications.length > 0 ? (count / applications.length) * 100 : 0
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: STATUS_COLORS[s], width: 80, flexShrink: 0 }}>{s}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: STATUS_COLORS[s], transition: 'width .6s' }} />
              </div>
              <span style={{ fontSize: 11, color: C.mid, width: 28, textAlign: 'right' }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* Bar chart: real weekly data */}
      <div style={{ padding: '24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 20 }}>Bewerbungen pro Woche</div>
        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: C.mid, fontSize: 13 }}>Noch keine Daten — sende deine erste Bewerbung!</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
            {weekData.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 11, color: C.white, fontWeight: 600, opacity: w.count > 0 ? 1 : 0.3 }}>{w.count || ''}</div>
                <div style={{ width: '100%', height: Math.max((w.count / maxCount) * 76, w.count > 0 ? 4 : 2), borderRadius: '4px 4px 0 0', background: w.count > 0 ? `linear-gradient(180deg, ${C.navy3}, ${C.navy})` : 'rgba(255,255,255,0.06)', transition: 'height .4s' }} />
                <div style={{ fontSize: 10, color: C.mid }}>{w.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {applications.length === 0 && (
        <div style={{ padding: '20px 24px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: C.mid, fontSize: 13 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
          Sobald du Bewerbungen erfasst, erscheinen hier deine echten Statistiken.
        </div>
      )}
    </div>
  )
}

// ── Section: Einstellungen ────────────────────────────────────────────────────
function SettingsSection({ profile, isPro, onUpgrade }: { profile: UserProfile; isPro: boolean; onUpgrade: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const p = profile as UserProfile & Record<string, unknown>

  // ── Theme ──
  const [theme, setThemeState] = useState<string>('dark')
  useEffect(() => {
    const saved = localStorage.getItem('jobbly_theme') || 'dark'
    setThemeState(saved)
    applyThemeToDom(saved)
  }, [])

  function applyThemeToDom(t: string) {
    const html = document.documentElement
    html.classList.remove('theme-light')
    if (t === 'light') html.classList.add('theme-light')
    else if (t === 'system') {
      if (!window.matchMedia('(prefers-color-scheme: dark)').matches) html.classList.add('theme-light')
    }
  }

  function applyTheme(t: string) {
    applyThemeToDom(t)
    localStorage.setItem('jobbly_theme', t)
    setThemeState(t)
    supabase.from('profiles').update({ theme_preference: t } as Record<string, unknown>).eq('id', profile.id).then(() => {})
    showToast('Design gespeichert ✓')
  }

  // ── Language ──
  const detectLang = () => {
    const saved = localStorage.getItem('jobbly_lang')
    if (saved) return saved
    const br = (navigator.language || 'de').toLowerCase()
    if (br.startsWith('tr')) return 'tr'
    if (br.startsWith('es')) return 'es'
    if (br.startsWith('fr')) return 'fr'
    if (br.startsWith('pl')) return 'pl'
    if (br.startsWith('en')) return 'en'
    return 'de'
  }
  const [language, setLanguageState] = useState<string>('de')
  useEffect(() => { setLanguageState(detectLang()) }, [])

  function applyLanguage(l: string) {
    localStorage.setItem('jobbly_lang', l)
    setLanguageState(l)
    supabase.from('profiles').update({ preferred_lang: l } as Record<string, unknown>).eq('id', profile.id).then(() => {
      // Reload so all translated strings re-render from localStorage
      window.location.reload()
    })
  }

  // ── Notifications (init from profile) ──
  const [emailAlerts, setEmailAlerts] = useState<boolean>(Boolean(p.job_alerts ?? true))
  const [matchThreshold, setMatchThreshold] = useState<string>(String(p.match_threshold || '70'))

  async function saveNotifications(alerts: boolean, threshold: string) {
    await supabase.from('profiles').update({ job_alerts: alerts, match_threshold: threshold } as Record<string, unknown>).eq('id', profile.id)
    showToast('Benachrichtigungen gespeichert ✓')
  }

  function toggleEmailAlerts(v: boolean) {
    setEmailAlerts(v)
    saveNotifications(v, matchThreshold)
  }

  function changeThreshold(v: string) {
    setMatchThreshold(v)
    saveNotifications(emailAlerts, v)
  }

  // ── Privacy (init from profile) ──
  const [showToRecruiters, setShowToRecruiters] = useState<boolean>(Boolean(p.visible_to_recruiters ?? false))

  function toggleRecruiters(v: boolean) {
    setShowToRecruiters(v)
    supabase.from('profiles').update({ visible_to_recruiters: v } as Record<string, unknown>).eq('id', profile.id).then(() => {})
    showToast(v ? 'Profil sichtbar für Recruiter ✓' : 'Profil verborgen ✓')
  }

  // ── Toast ──
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }

  // ── Subscription / Stripe ──
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast('Stripe Portal nicht verfügbar')
    } finally { setPortalLoading(false) }
  }

  async function openCheckout() {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast('Checkout nicht verfügbar')
    } finally { setCheckoutLoading(false) }
  }

  // ── Security ──
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSent, setPwSent] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sessionInfo] = useState(() => {
    if (typeof window === 'undefined') return { ua: '', time: '' }
    const ua = navigator.userAgent
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Browser'
    const os = ua.includes('Win') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : 'iOS'
    return { browser, os, time: new Date().toLocaleDateString('de-AT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  })

  async function handlePwReset() {
    setPwLoading(true)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${appUrl}/auth/reset-password` })
    setPwLoading(false); setPwSent(true)
    showToast('Reset-E-Mail gesendet ✓')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await fetch('/api/user/delete', { method: 'DELETE' })
      await supabase.auth.signOut()
      router.push('/')
    } finally { setDeleting(false) }
  }

  // ── Shared sub-components ──
  const Toggle = ({ label, desc, val, onChange }: { label: string; desc?: string; val: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!val)} aria-pressed={val}
        style={{ width: 44, height: 24, borderRadius: 12, background: val ? C.navy2 : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.white, position: 'absolute', top: 3, left: val ? 23 : 3, transition: 'left .2s' }} />
      </button>
    </div>
  )

  const Block = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16, padding: '20px 22px', borderRadius: 14, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{title}</div>
        {badge && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(27,46,107,0.3)', color: C.navy3, fontWeight: 600 }}>{badge}</span>}
      </div>
      {children}
    </div>
  )

  const btnBase: React.CSSProperties = { padding: '9px 16px', minHeight: 38, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, border: 'none' }

  return (
    <div style={{ maxWidth: 580 }}>
      {toast && <div className="profile-save-toast">{toast}</div>}

      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 24 }}>Einstellungen</h2>

      {/* ── Erscheinungsbild ── */}
      <Block title="Erscheinungsbild">
        <p style={{ fontSize: 12, color: C.mid, marginBottom: 14 }}>Ändert sich sofort. Wird auf diesem Gerät gespeichert.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['dark', '🌙 Dark'], ['light', '☀️ Light'], ['system', '💻 System']].map(([v, l]) => (
            <button key={v} onClick={() => applyTheme(v)}
              style={{ flex: 1, ...btnBase, border: `0.5px solid ${theme === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: theme === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: theme === v ? C.navy3 : C.mid }}>{l}</button>
          ))}
        </div>
      </Block>

      {/* ── Sprache ── */}
      <Block title="Sprache">
        <p style={{ fontSize: 12, color: C.mid, marginBottom: 12 }}>Automatisch erkannt aus Browsersprache. Manuelle Auswahl lädt die Seite neu.</p>
        <select value={language} onChange={e => applyLanguage(e.target.value)}
          style={{ padding: '10px 14px', minHeight: 42, borderRadius: 9, border: `0.5px solid rgba(255,255,255,0.1)`, background: '#0D1117', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer', width: '100%' }}>
          {[['de', '🇩🇪 Deutsch'], ['en', '🇬🇧 English'], ['tr', '🇹🇷 Türkçe'], ['es', '🇪🇸 Español'], ['fr', '🇫🇷 Français'], ['pl', '🇵🇱 Polski']].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Block>

      {/* ── Benachrichtigungen ── */}
      <Block title="Benachrichtigungen">
        <Toggle label="E-Mail Alerts" desc="Job-Matches und Updates per E-Mail erhalten" val={emailAlerts} onChange={toggleEmailAlerts} />
        <div style={{ paddingTop: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: C.mid, marginBottom: 10, fontWeight: 500 }}>Mindest-Match-Score für Benachrichtigung</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['50', '50 %+', 'Alle passenden Jobs'], ['70', '70 %+', 'Empfohlen'], ['90', '90 %+', 'Nur Top-Matches']].map(([v, label, sub]) => (
              <button key={v} onClick={() => changeThreshold(v)}
                style={{ flex: 1, padding: '10px 6px', borderRadius: 9, border: `0.5px solid ${matchThreshold === v ? C.navy2 : 'rgba(255,255,255,0.1)'}`, background: matchThreshold === v ? 'rgba(27,46,107,0.3)' : 'transparent', color: matchThreshold === v ? C.navy3 : C.mid, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 10 }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>
      </Block>

      {/* ── Datenschutz ── */}
      <Block title="Datenschutz">
        <Toggle label="Profil für Recruiter sichtbar" desc="Recruiter können dich aktiv kontaktieren" val={showToRecruiters} onChange={toggleRecruiters} />
        <div style={{ paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const a = document.createElement('a')
              a.href = '/api/user/export'
              a.download = `jobbly-daten-${new Date().toISOString().split('T')[0]}.json`
              document.body.appendChild(a); a.click(); document.body.removeChild(a)
            }}
            style={{ ...btnBase, background: 'rgba(255,255,255,0.04)', color: C.mid, border: `0.5px solid ${C.border}` }}>
            📥 Daten exportieren (DSGVO)
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            style={{ ...btnBase, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)' }}>
            🗑 Alle Daten löschen
          </button>
        </div>
        {showDeleteConfirm && (
          <div style={{ marginTop: 16, padding: '18px 18px', borderRadius: 12, background: 'rgba(248,113,113,0.07)', border: '0.5px solid rgba(248,113,113,0.3)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>⚠ Bist du sicher?</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 16, lineHeight: 1.6 }}>Diese Aktion löscht deinen Account und <strong>alle</strong> Daten unwiderruflich. Sie kann nicht rückgängig gemacht werden.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDeleteAccount} disabled={deleting}
                style={{ ...btnBase, background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                {deleting ? 'Wird gelöscht…' : 'Ja, Account löschen'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ ...btnBase, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}` }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </Block>

      {/* ── Abonnement ── */}
      <Block title="Abonnement">
        <div style={{ padding: '16px', borderRadius: 12, background: isPro ? 'rgba(27,46,107,0.12)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${isPro ? 'rgba(27,46,107,0.4)' : C.border}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{isPro ? '⭐' : '🆓'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>{isPro ? 'Jobbly Pro' : 'Free Plan'}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: isPro ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)', color: isPro ? C.success : C.mid, fontWeight: 600 }}>{isPro ? 'AKTIV' : 'KOSTENLOS'}</span>
              </div>
              {isPro ? (
                <>
                  <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>€9.99 / Monat · Jederzeit kündbar</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Abrechnung & Details: Stripe Customer Portal</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.mid, marginBottom: 3 }}>3 kostenlose Anschreiben inklusive</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Kein Abo, keine Kreditkarte nötig</div>
                </>
              )}
            </div>
            {isPro ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button onClick={openPortal} disabled={portalLoading}
                  style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', color: C.mid, border: `0.5px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                  {portalLoading ? '…' : '📋 Abrechnung verwalten'}
                </button>
                <button onClick={openPortal} disabled={portalLoading}
                  style={{ ...btnBase, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)' }}>
                  {portalLoading ? '…' : 'Kündigen'}
                </button>
              </div>
            ) : (
              <button onClick={onUpgrade}
                style={{ ...btnBase, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
                ⚡ Jetzt upgraden
              </button>
            )}
          </div>
        </div>
        {!isPro && (
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
            Mit <strong style={{ color: C.navy3 }}>Jobbly Pro</strong> erhältst du: unbegrenzte KI-Anschreiben, Premium-Lebenslauf-Designs, Priority-Support.
            <button onClick={openCheckout} disabled={checkoutLoading}
              style={{ display: 'block', marginTop: 10, ...btnBase, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, width: '100%', textAlign: 'center' }}>
              {checkoutLoading ? '…' : '🚀 Pro für €9.99/Monat starten'}
            </button>
          </div>
        )}
      </Block>

      {/* ── Sicherheit ── */}
      <Block title="Sicherheit">
        {/* Password reset */}
        <div style={{ paddingBottom: 16, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.white, fontWeight: 500, marginBottom: 4 }}>Passwort</div>
          <div style={{ fontSize: 11, color: C.mid, marginBottom: 10 }}>Sende dir einen sicheren Reset-Link per E-Mail.</div>
          {pwSent ? (
            <div style={{ fontSize: 12, color: C.success, padding: '8px 14px', background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>✓ E-Mail wurde gesendet an {profile.email}</div>
          ) : (
            <button onClick={handlePwReset} disabled={pwLoading}
              style={{ ...btnBase, background: 'rgba(255,255,255,0.05)', color: C.mid, border: `0.5px solid ${C.border}` }}>
              {pwLoading ? 'Wird gesendet…' : '🔑 Passwort ändern'}
            </button>
          )}
        </div>

        {/* Active sessions */}
        <div style={{ paddingBottom: 16, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.white, fontWeight: 500, marginBottom: 10 }}>Aktive Sitzungen</div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.success, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: C.white, fontWeight: 500 }}>
                  {(sessionInfo as { browser?: string; os?: string; time?: string }).browser || 'Browser'} · {(sessionInfo as { browser?: string; os?: string; time?: string }).os || 'Unbekannt'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.mid }}>Aktuelle Sitzung · {(sessionInfo as { browser?: string; os?: string; time?: string }).time || '—'}</div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(74,222,128,0.1)', color: C.success, fontWeight: 600 }}>Aktiv</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut({ scope: 'others' }); showToast('Alle anderen Sitzungen abgemeldet ✓') }}
            style={{ ...btnBase, marginTop: 10, background: 'transparent', color: C.mid, border: `0.5px solid ${C.border}`, fontSize: 11 }}>
            Alle anderen Sitzungen abmelden
          </button>
        </div>

        {/* 2FA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: C.mid, fontWeight: 500 }}>🔐 Zwei-Faktor-Authentifizierung</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Erhöhe die Sicherheit deines Kontos</div>
          </div>
          <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: C.amber, fontWeight: 600, border: '0.5px solid rgba(245,158,11,0.2)' }}>Demnächst</span>
        </div>
      </Block>
    </div>
  )
}

// ── Courses section ───────────────────────────────────────────────────────────
function CoursesSection() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(27,46,107,0.25)', border: `0.5px solid rgba(147,175,253,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>🎓</div>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.navy3, textTransform: 'uppercase', background: 'rgba(27,46,107,0.2)', border: `0.5px solid rgba(147,175,253,0.25)`, borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>Demnächst</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 12, letterSpacing: '-.5px' }}>Karriere Kurse</h2>
      <p style={{ fontSize: 15, color: C.mid, lineHeight: 1.7, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
        Wir arbeiten an kuratierten Karriere-Kursen von Top-Plattformen wie Coursera, LinkedIn Learning und Udemy — direkt in Jobbly integriert.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {[
          { icon: '🎯', label: 'Personalisiert', desc: 'Kurse passend zu deinen Skills und Zielen' },
          { icon: '🏆', label: 'Zertifiziert', desc: 'Anerkannte Zertifikate von Top-Anbietern' },
          { icon: '⚡', label: 'KI-gestützt', desc: 'KI empfiehlt den besten Lernpfad für dich' },
        ].map(f => (
          <div key={f.label} style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '20px 16px' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 6 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(27,46,107,0.12)', border: `0.5px solid rgba(27,46,107,0.3)`, borderRadius: 12, padding: '18px 24px', display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.mid }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <span>Wir benachrichtigen dich, sobald Karriere Kurse verfügbar sind.</span>
      </div>
    </div>
  )
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  const [loading, setLoading] = useState(false)
  async function handleUpgrade() {
    setLoading(true)
    trackEvent('InitiateCheckout', { value: 9.99, currency: 'EUR' })
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

// ── Application Modal (4-step) ────────────────────────────────────────────────
interface SavedCVMeta { id: string; title: string; design: string; edit_count: number }
interface CoverLetterMeta { id: string; job_title: string; company: string; design: string; content: string }

function ApplicationModal({
  job, profile, isPro, applicationsCount, onClose, onSuccess,
}: {
  job: DashJob
  profile: UserProfile
  isPro: boolean
  applicationsCount: number
  onClose: () => void
  onSuccess: () => void
}) {
  const MAX_FREE_APPS = 5
  // Auto-detect email from job data
  const detectedEmail = job.contactEmail || null

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [flowType, setFlowType] = useState<'email' | 'portal'>(detectedEmail ? 'email' : 'portal')
  const [recipientEmail, setRecipientEmail] = useState(detectedEmail || '')
  const [cvs, setCvs] = useState<SavedCVMeta[]>([])
  const [letters, setLetters] = useState<CoverLetterMeta[]>([])
  const [selectedCvId, setSelectedCvId] = useState<string>('')
  const [selectedLetterId, setSelectedLetterId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const supabase = createClient()

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

  useEffect(() => {
    Promise.all([
      fetch('/api/cv/list').then(r => r.json()).then(j => setCvs(j.cvs || [])),
      supabase.from('cover_letters').select('id,job_title,company,design,content').order('created_at', { ascending: false })
        .then(({ data }) => setLetters((data || []) as CoverLetterMeta[])),
    ]).finally(() => setLoadingDocs(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCv = cvs.find(c => c.id === selectedCvId)
  const selectedLetter = letters.find(l => l.id === selectedLetterId)

  function canProceedStep1() {
    if (flowType === 'email' && !recipientEmail.trim()) return false
    return true
  }

  function canProceedStep2() { return !!selectedCvId && !!selectedLetterId }

  async function handleSend() {
    if (!isPro && applicationsCount >= MAX_FREE_APPS) {
      showToast(`Free-Plan: max. ${MAX_FREE_APPS} Bewerbungen. Upgrade zu Pro!`, false); return
    }
    setSending(true)
    try {
      if (flowType === 'email') {
        const res = await fetch('/api/apply/email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail, jobTitle: job.title, company: job.company,
            cvId: selectedCvId, coverLetterId: selectedLetterId,
          }),
        })
        const json = await res.json()
        if (!res.ok) { showToast(json.error || 'Senden fehlgeschlagen', false); return }
      } else {
        // Flow B: record application without sending email
        await supabase.from('applications').insert({
          user_id: profile.id, position: job.title, company: job.company,
          status: 'Gesendet', application_method: 'portal',
          cv_id: selectedCvId || null, cover_letter_id: selectedLetterId || null,
          template: 'classic', style: 'balanced',
          cv_data: {}, cover_letter: selectedLetter?.content || '',
          applied_at: new Date().toISOString(),
        })
      }
      trackEvent('SubmitApplication')
      showToast('Bewerbung erfolgreich! ✓')
      setTimeout(() => { onSuccess(); onClose() }, 1800)
    } catch { showToast('Fehler beim Senden', false) }
    finally { setSending(false) }
  }

  const modalStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(4px)',
  }
  const boxStyle: React.CSSProperties = {
    background: '#0D1117', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.1)',
    width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto',
  }
  const stepBtn = (active: boolean): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: '50%', border: 'none', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
    backgroundColor: active ? C.navy : 'rgba(255,255,255,0.06)', color: active ? C.white : C.mid,
    flexShrink: 0,
  })
  const selCard = (selected: boolean): React.CSSProperties => ({
    padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${selected ? C.navy : 'rgba(255,255,255,0.08)'}`,
    background: selected ? 'rgba(27,46,107,0.2)' : 'rgba(255,255,255,0.02)',
    cursor: 'pointer', transition: 'all .12s',
  })

  return (
    <div style={modalStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={boxStyle}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: job.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.white }}>{job.initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{job.title}</div>
              <div style={{ fontSize: 12, color: C.mid }}>{job.company}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {([1, 2, 3, 4] as const).map(s => (
              <div key={s} style={stepBtn(step >= s)}>{s}</div>
            ))}
            <button onClick={onClose} style={{ marginLeft: 8, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: C.mid, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '22px 22px' }}>
          {toast && (
            <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, background: toast.ok ? '#0D2A1A' : '#2A0D0D', color: toast.ok ? '#4ADE80' : '#f87171', border: `1px solid ${toast.ok ? '#2A6B47' : '#6B2A2A'}` }}>
              {toast.msg}
            </div>
          )}

          {/* Step 1: Method & contact */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6 }}>Bewerbungsart wählen</div>
              {detectedEmail ? (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(27,46,107,0.15)', border: '0.5px solid rgba(27,46,107,0.35)', marginBottom: 16, fontSize: 12, color: '#93AFFD', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📧 <strong>Direkte Bewerbung per E-Mail möglich</strong>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.1)', marginBottom: 16, fontSize: 12, color: C.mid, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🌐 <span>Bewerbung über Portal — keine direkte E-Mail gefunden</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {([
                  ['email', '📧', 'Per E-Mail', 'Jobbly sendet deine Bewerbung direkt'],
                  ['portal', '🌐', 'Bewerbungsportal', 'Du bewirbst dich über die Website'],
                ] as const).map(([type, icon, label, desc]) => (
                  <div key={type} onClick={() => setFlowType(type)} style={selCard(flowType === type)}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>
              {flowType === 'email' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
                    {detectedEmail ? 'Erkannte E-Mail (editierbar)' : 'Empfänger-E-Mail *'}
                  </label>
                  <input
                    value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="bewerbung@unternehmen.de"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: `1px solid ${detectedEmail ? 'rgba(27,46,107,0.5)' : 'rgba(255,255,255,0.1)'}`, background: '#0d0d1a', color: C.white, fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                  {detectedEmail && (
                    <div style={{ fontSize: 11, color: C.mid, marginTop: 4 }}>
                      Bewerbung wird gesendet an: <span style={{ color: '#93AFFD' }}>{recipientEmail || detectedEmail}</span>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => canProceedStep1() && setStep(2)}
                disabled={!canProceedStep1()}
                style={{ width: '100%', padding: 12, borderRadius: 10, background: canProceedStep1() ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: canProceedStep1() ? C.white : C.mid, border: 'none', cursor: canProceedStep1() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
                Weiter →
              </button>
            </div>
          )}

          {/* Step 2: Document picker */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6 }}>Dokumente auswählen</div>
              <div style={{ fontSize: 13, color: C.mid, marginBottom: 20 }}>Wähle Lebenslauf und Anschreiben für diese Bewerbung</div>
              {loadingDocs ? (
                <div style={{ textAlign: 'center', color: C.mid, padding: 32 }}>Lade Dokumente…</div>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Lebenslauf</div>
                    {cvs.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>
                        Kein Lebenslauf gefunden. <a href="/dashboard/lebenslauf" style={{ color: '#93AFFD' }}>Jetzt erstellen →</a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {cvs.map(cv => (
                          <div key={cv.id} onClick={() => setSelectedCvId(cv.id)} style={selCard(selectedCvId === cv.id)}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{cv.title}</div>
                            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{cv.design}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Anschreiben</div>
                    {letters.length === 0 ? (
                      <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>
                        Kein Anschreiben gefunden. <a href="/dashboard/anschreiben" style={{ color: '#93AFFD' }}>Jetzt erstellen →</a>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {letters.map(l => (
                          <div key={l.id} onClick={() => setSelectedLetterId(l.id)} style={selCard(selectedLetterId === l.id)}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{l.job_title} — {l.company}</div>
                            <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{l.design}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'rgba(255,255,255,0.04)', color: C.mid, border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
                <button onClick={() => canProceedStep2() && setStep(3)} disabled={!canProceedStep2()} style={{ flex: 2, padding: 11, borderRadius: 9, background: canProceedStep2() ? `linear-gradient(135deg, ${C.navy}, ${C.navy2})` : 'rgba(255,255,255,0.06)', color: canProceedStep2() ? C.white : C.mid, border: 'none', cursor: canProceedStep2() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Vorschau →</button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 16 }}>Vorschau</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.mid, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>📄 Lebenslauf</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{selectedCv?.title}</div>
                  <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{selectedCv?.design}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.mid, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>✉️ Anschreiben</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{selectedLetter?.job_title}</div>
                  <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{selectedLetter?.company}</div>
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 8 }}>Anschreiben Vorschau</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {selectedLetter?.content?.slice(0, 400)}{(selectedLetter?.content?.length || 0) > 400 ? '…' : ''}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: flowType === 'email' ? 'rgba(27,46,107,0.12)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${flowType === 'email' ? 'rgba(27,46,107,0.3)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 20, fontSize: 13, color: C.mid }}>
                {flowType === 'email' ? `📧 Wird gesendet an: ${recipientEmail}` : '🌐 Bewerbungsportal — Dokumente zum Download bereit'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'rgba(255,255,255,0.04)', color: C.mid, border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
                <button onClick={() => setStep(4)} style={{ flex: 2, padding: 11, borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Senden →</button>
              </div>
            </div>
          )}

          {/* Step 4: Send / Confirm */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6 }}>
                {flowType === 'email' ? 'Bewerbung absenden' : 'Bewerbung abschließen'}
              </div>
              <div style={{ fontSize: 13, color: C.mid, marginBottom: 24 }}>
                {flowType === 'email'
                  ? `Jobbly sendet deine Bewerbung direkt an ${recipientEmail}.`
                  : 'Lade deine Dokumente herunter und bewirb dich über das Unternehmensportal.'}
              </div>
              {flowType === 'portal' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
                  <a href={`/dashboard/lebenslauf`} style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: 'rgba(27,46,107,0.15)', border: '0.5px solid rgba(27,46,107,0.3)', color: '#93AFFD', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
                    📄 Lebenslauf öffnen
                  </a>
                  <a href={`/dashboard/anschreiben`} style={{ flex: 1, padding: '10px 14px', borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '0.5px solid rgba(99,102,241,0.25)', color: '#93AFFD', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'block', textAlign: 'center' as const }}>
                    ✉️ Anschreiben öffnen
                  </a>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(3)} disabled={sending} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'rgba(255,255,255,0.04)', color: C.mid, border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Zurück</button>
                <button onClick={handleSend} disabled={sending} style={{ flex: 2, padding: 12, borderRadius: 9, background: sending ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: sending ? C.mid : C.white, border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700 }}>
                  {sending ? 'Wird gesendet…' : flowType === 'email' ? '📧 Bewerbung senden' : '✅ Bewerbung erfassen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardClient({ profile, applications, justUpgraded, upgradeStatus }: Props) {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard')
  const [selectedJob, setSelectedJob] = useState<DashJob | null>(null)
  const [applyJob, setApplyJob] = useState<DashJob | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalToast, setGlobalToast] = useState<string>('')
  const p0 = profile as UserProfile & Record<string, unknown>
  const [avatarUrl, setAvatarUrl] = useState<string>(String(p0.photo_url || p0.avatar_url || ''))
  const supabase = createClient()
  const router = useRouter()
  const isPro = !!profile.is_pro
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Show upgrade/cancel toast from URL param (once)
  useEffect(() => {
    if (upgradeStatus === 'success') {
      setGlobalToast('Willkommen bei Jobbly Pro! 🎉 Alle Features sind jetzt freigeschaltet.')
      trackEvent('Purchase', { value: 9.99, currency: 'EUR', content_name: 'Jobbly Pro' })
      window.history.replaceState({}, '', '/dashboard')
    } else if (upgradeStatus === 'cancelled') {
      setGlobalToast('Upgrade abgebrochen — du kannst jederzeit upgraden.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [upgradeStatus])

  useEffect(() => {
    if (!globalToast) return
    const t = setTimeout(() => setGlobalToast(''), 5000)
    return () => clearTimeout(t)
  }, [globalToast])

  const [dashJobs, setDashJobs] = useState<DashJob[]>([])
  const [dashJobsLoading, setDashJobsLoading] = useState(true)
  const profileScore = getProfileCompleteness(profile).score

  // Fetch real jobs for dashboard home "Top Job Matches" using profile position
  useEffect(() => {
    const params = new URLSearchParams()
    if (profile.desired_position) params.set('q', profile.desired_position)
    if (profile.city) params.set('location', profile.city)
    setDashJobsLoading(true)
    fetch(`/api/jobs/search?${params}`).then(r => r.json()).then(data => {
      if (data.jobs) setDashJobs((data.jobs as RealJob[]).slice(0, 3).map(adaptJob))
      else setDashJobs([])
    }).catch(() => setDashJobs([])).finally(() => setDashJobsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleNav(id: NavId) {
    if (id === 'cv') { router.push('/dashboard/lebenslauf'); return }
    if (id === 'letter') { router.push('/dashboard/anschreiben'); return }
    setActiveNav(id)
  }

  function renderContent(mob?: boolean) {
    const m = mob ?? isMobile
    switch (activeNav) {
      case 'jobs': return <JobsSection isPro={isPro} onSelect={j => { trackEvent('ViewContent', { content_name: j.title, content_category: 'Job', content_type: 'product' }); setSelectedJob(j) }} onNeedPro={() => setShowUpgrade(true)} initialSearch={globalSearch} profile={profile} />
      case 'applications': return <ApplicationsSection applications={applications} profile={profile} />
      case 'cv': { router.push('/dashboard/lebenslauf'); return null }
      case 'letter': { router.push('/dashboard/anschreiben'); return null }
      case 'profile': return <ProfileSection profile={profile} onPhotoUpdate={url => setAvatarUrl(url)} />
      case 'stats': return <StatsSection applications={applications} />
      case 'courses': return <CoursesSection />
      case 'settings': return <SettingsSection profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
      default: return (
        <>
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: m ? 20 : 28, gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {justUpgraded && (
                <div style={{ fontSize: 12, color: C.success, background: 'rgba(13,43,26,0.8)', border: '0.5px solid #2A6B47', borderRadius: 8, padding: '8px 14px', marginBottom: 14, display: 'inline-block' }}>
                  🎉 Willkommen bei Jobbly Premium! Dein Abo ist jetzt aktiv.
                </div>
              )}
              <h1 style={{ fontSize: m ? 24 : 30, fontWeight: 700, color: C.white, marginBottom: 6, letterSpacing: '-.5px' }}>
                {profile.first_name ? `Hallo ${profile.first_name}! 👋` : 'Hallo! 👋'}
              </h1>
              <p style={{ fontSize: m ? 13 : 15, color: C.mid }}>
                {profile.first_name ? 'Bereit für deinen nächsten Karriereschritt?' : (
                  <span>Vervollständige dein <span style={{ color: C.navy3, cursor: 'pointer' }} onClick={() => setActiveNav('profile')}>Profil →</span> um bessere Job-Matches zu erhalten.</span>
                )}
              </p>
            </div>
            {!m && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => router.push('/dashboard/lebenslauf')} title="Lebenslauf erstellen"
                  style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(27,46,107,0.18)', border: `0.5px solid rgba(27,46,107,0.35)`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,46,107,0.35)'; e.currentTarget.style.borderColor = C.navy2 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(27,46,107,0.18)'; e.currentTarget.style.borderColor = 'rgba(27,46,107,0.35)' }}>
                  <span style={{ fontSize: 22 }}>📄</span>
                  <span style={{ fontSize: 9, color: C.mid, fontWeight: 500, letterSpacing: '.04em' }}>CV</span>
                </button>
                <button onClick={() => router.push('/dashboard/anschreiben')} title="Anschreiben erstellen"
                  style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.12)', border: `0.5px solid rgba(99,102,241,0.25)`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}>
                  <span style={{ fontSize: 22 }}>✨</span>
                  <span style={{ fontSize: 9, color: C.mid, fontWeight: 500, letterSpacing: '.04em' }}>Brief</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Stats: 2×2 on mobile, 4-in-row on desktop ── */}
          <div style={m
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }
            : { display: 'flex', gap: 14, marginBottom: 32 }
          }>
            <StatCard icon="💼" value={String(dashJobs.length || 0)} label="Passende Jobs" sub="Aktuell" subColor={C.success} onClick={() => setActiveNav('jobs')} />
            <StatCard icon="📊" value={`${profileScore}%`} label="Profil Match" sub={profileScore >= 80 ? 'Sehr gut' : profileScore >= 50 ? 'Ausbaufähig' : 'Unvollständig'} subColor={profileScore >= 80 ? C.success : C.amber} onClick={() => setActiveNav('profile')} />
            <StatCard icon="📋" value={String(applications.length)} label="Bewerbungen" sub="Insgesamt" subColor={C.mid} onClick={() => setActiveNav('applications')} />
            <StatCard icon="⭐" value={String(applications.filter(a => ((a as unknown as Record<string, unknown>).status as string) === 'Interview').length)} label="Einladungen" sub="Letzte 30 Tage" subColor={C.mid} onClick={() => setActiveNav('applications')} />
          </div>

          {/* ── Mobile quick actions ── */}
          {m && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button onClick={() => router.push('/dashboard/lebenslauf')} style={{ padding: '14px 10px', borderRadius: 12, background: 'rgba(27,46,107,0.18)', border: `0.5px solid rgba(27,46,107,0.35)`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.white, fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                <span style={{ fontSize: 20 }}>📄</span> Lebenslauf
              </button>
              <button onClick={() => router.push('/dashboard/anschreiben')} style={{ padding: '14px 10px', borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: `0.5px solid rgba(99,102,241,0.25)`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.white, fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
                <span style={{ fontSize: 20 }}>✨</span> Anschreiben
              </button>
            </div>
          )}

          {applications.length === 0 && (
            <div style={{ padding: '16px 18px', borderRadius: 12, border: `0.5px solid rgba(27,46,107,0.3)`, background: 'rgba(27,46,107,0.08)', marginBottom: 20, display: 'flex', alignItems: m ? 'flex-start' : 'center', gap: 14, flexDirection: m ? 'column' : 'row' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>Vervollständige dein Profil für bessere Matches</div>
                <div style={{ fontSize: 12, color: C.mid }}>Mit einem vollständigen Profil findest du bis zu 3× mehr passende Jobs.</div>
              </div>
              <button onClick={() => { const p = profile as UserProfile & Record<string, unknown>; if (p.onboarding_completed === false) router.push('/onboarding'); else setActiveNav('profile') }} style={{ padding: '10px 16px', minHeight: 44, borderRadius: 9, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', width: m ? '100%' : 'auto' }}>Profil vervollständigen</button>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Top Job Matches für dich</div>
              <span style={{ fontSize: 13, color: C.navy3, cursor: 'pointer', fontWeight: 500 }} onClick={() => setActiveNav('jobs')}>Alle →</span>
            </div>
            {dashJobsLoading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.015)', marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 10, width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ height: 13, width: '70%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ height: 10, width: '55%', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))
            ) : dashJobs.length === 0 ? (
              <div style={{ padding: '24px 18px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.01)', textAlign: 'center', color: C.mid, fontSize: 13, lineHeight: 1.6 }}>
                Keine passenden Jobs gefunden.<br />
                <span style={{ color: C.navy3, cursor: 'pointer' }} onClick={() => setActiveNav('profile')}>Ergänze deinen Wunschberuf im Profil →</span>
              </div>
            ) : (
              dashJobs.slice(0, 3).map(job => (
                <div key={job.id} style={{ position: 'relative' }}>
                  <JobCard job={job} onClick={() => {
                    if (!isPro) { setShowUpgrade(true); return }
                    setSelectedJob(job)
                  }} />
                  <button
                    onClick={e => { e.stopPropagation(); setApplyJob(job) }}
                    style={{ position: 'absolute', bottom: 10, right: 12, padding: '5px 12px', borderRadius: 7, background: `linear-gradient(135deg, ${C.navy}, ${C.navy2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, zIndex: 1 }}>
                    Bewerben →
                  </button>
                </div>
              ))
            )}
          </div>

          {/* ── KI banner: stack on mobile ── */}
          <div style={{ padding: m ? '16px' : '20px 22px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)', border: `0.5px solid rgba(99,102,241,0.35)`, display: 'flex', alignItems: m ? 'flex-start' : 'center', gap: 16, flexDirection: m ? 'column' : 'row' }}>
            <div style={{ fontSize: 20 }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 3 }}>KI Anschreiben erstellen</div>
              <div style={{ fontSize: 12, color: C.mid }}>Individuelles Anschreiben, perfekt auf den Job zugeschnitten.</div>
            </div>
            <button onClick={() => router.push('/dashboard/anschreiben')} style={{ padding: '11px 18px', minHeight: 44, borderRadius: 9, background: `linear-gradient(135deg, ${C.purple}, ${C.purple2})`, color: C.white, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', width: m ? '100%' : 'auto' }}>
              Jetzt erstellen →
            </button>
          </div>
        </>
      )
    }
  }

  const modals = (
    <>
      {selectedJob && <JobDetailModal job={selectedJob} profile={profile} onClose={() => setSelectedJob(null)} />}
      {applyJob && <ApplicationModal job={applyJob} profile={profile} isPro={isPro} applicationsCount={applications.length} onClose={() => setApplyJob(null)} onSuccess={() => { setApplyJob(null); router.refresh() }} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgrade={() => setShowUpgrade(false)} />}
      {globalToast && (
        <div className="profile-save-toast" style={{ background: upgradeStatus === 'success' ? '#0D2A1A' : '#1a1a2e', color: upgradeStatus === 'success' ? '#4ade80' : '#8892A4', borderColor: upgradeStatus === 'success' ? '#2A6B47' : 'rgba(255,255,255,0.1)', fontSize: 14, maxWidth: 420, textAlign: 'center' }}>
          {globalToast}
        </div>
      )}
    </>
  )

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, overflow: 'hidden' }}>
          <MobileTopBar onHamburger={() => setDrawerOpen(true)} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} />
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 16px 80px' }}>
            {renderContent(true)}
            {activeNav === 'dashboard' && (
              <div style={{ marginTop: 24, borderTop: `0.5px solid ${C.border}`, paddingTop: 20 }}>
                <RightSidebar applications={applications} profile={profile} onNav={handleNav} isMobile />
              </div>
            )}
          </main>
          <BottomNav active={activeNav} onNav={handleNav} />
        </div>
        {drawerOpen && <MobileDrawer active={activeNav} onNav={handleNav} profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onLogout={handleLogout} onClose={() => setDrawerOpen(false)} avatarUrl={avatarUrl} />}
        {modals}
      </>
    )
  }

  // ── Desktop layout (unchanged) ─────────────────────────────────────────────
  return (
    <>
      <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>
        <Sidebar active={activeNav} onNav={handleNav} profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onLogout={handleLogout} jobCount={dashJobs.length} avatarUrl={avatarUrl} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <TopBar profile={profile} isPro={isPro} onUpgrade={() => setShowUpgrade(true)} onNav={handleNav} onSearch={term => { setGlobalSearch(term); setActiveNav('jobs') }} avatarUrl={avatarUrl} />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {renderContent()}
            </main>
            {activeNav === 'dashboard' && <RightSidebar applications={applications} profile={profile} onNav={handleNav} />}
          </div>
        </div>
      </div>
      {modals}
    </>
  )
}
