'use client'

import Link from 'next/link'
import type { Lang } from '@/lib/types'
import type { UserProfile } from '@/lib/types'

interface Props {
  lang: Lang
  onLangChange: (l: Lang) => void
  user: UserProfile | null
  onSignIn: () => void
  onRegister: () => void
  onLogout: () => void
}

export default function Nav({ lang, onLangChange, user, onSignIn, onRegister, onLogout }: Props) {
  return (
    <div className="nav">
      <Link href="/" className="logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="#1B2E6B"/>
          <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".95"/>
          <rect x="15" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
          <rect x="6" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
          <rect x="15" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".15"/>
        </svg>
        <div className="logo-text">jobbly<span className="logo-ai">.ai</span></div>
      </Link>

      <div className="nav-right">
        <select
          className="lang-sel"
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          <option value="en">EN</option>
          <option value="de">DE</option>
          <option value="tr">TR</option>
          <option value="es">ES</option>
          <option value="fr">FR</option>
          <option value="pl">PL</option>
        </select>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--mid)', textDecoration: 'none' }}>
              {user.first_name || user.email}
            </Link>
            {user.is_pro && <span className="pro-pill">PRO</span>}
            <button className="nbtn" onClick={onLogout}>Sign out</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="nbtn" onClick={onSignIn}>Sign in</button>
            <button className="nbtn pri" onClick={onRegister}>Get started</button>
          </div>
        )}
      </div>
    </div>
  )
}
