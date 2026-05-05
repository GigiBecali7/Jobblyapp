'use client'

import Link from 'next/link'
import JLogo from '@/components/JLogo'
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
      <JLogo size={28} />

      <div className="nav-right">
        <select className="lang-sel" value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}>
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
