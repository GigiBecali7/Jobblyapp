'use client'

import JLogo from '@/components/JLogo'

interface Props {
  onOpenLegal: (section: string) => void
}

export default function Footer({ onOpenLegal }: Props) {
  return (
    <footer style={{ backgroundColor: '#07070C', borderTop: '0.5px solid rgba(255,255,255,0.07)', fontFamily: 'DM Sans, Inter, sans-serif', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 32px' }}>

        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="footer-grid">
          {/* Brand */}
          <div>
            <JLogo size={26} href="/" />
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, marginTop: 14, maxWidth: 200 }}>
              Dein KI-Karriere-Assistent für die deutschsprachige Jobsuche.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {[
                { label: 'LinkedIn', href: 'https://linkedin.com', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { label: 'Instagram', href: 'https://instagram.com', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                { label: 'X / Twitter', href: 'https://twitter.com', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8892A4', textDecoration: 'none', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(27,46,107,0.35)'; (e.currentTarget as HTMLElement).style.color = '#93AFFD' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#8892A4' }}>
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#8892A4', textTransform: 'uppercase', marginBottom: 16 }}>Produkt</div>
            {[
              { label: 'Lebenslauf Builder', href: '/dashboard/lebenslauf' },
              { label: 'KI Anschreiben', href: '/dashboard/anschreiben' },
              { label: 'Jobs finden', href: '/dashboard' },
              { label: 'Jobbly Pro', href: '/dashboard' },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 14, color: '#8892A4', textDecoration: 'none', marginBottom: 10, transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8892A4'}>
                {l.label}
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#8892A4', textTransform: 'uppercase', marginBottom: 16 }}>Rechtliches</div>
            {[
              { label: 'Impressum', section: 'impressum' },
              { label: 'AGB', section: 'agb' },
              { label: 'Cookie-Einstellungen', section: 'cookies' },
            ].map(l => (
              <button key={l.label} onClick={() => onOpenLegal(l.section)}
                style={{ display: 'block', fontSize: 14, color: '#8892A4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10, fontFamily: 'inherit', transition: 'color .2s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8892A4'}>
                {l.label}
              </button>
            ))}
            <a href="/datenschutz"
              style={{ display: 'block', fontSize: 14, color: '#8892A4', textDecoration: 'none', marginBottom: 10, transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8892A4'}>
              Datenschutzerklärung
            </a>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#8892A4', textTransform: 'uppercase', marginBottom: 16 }}>Kontakt</div>
            <a href="mailto:hello@jobblyapp.com" style={{ display: 'block', fontSize: 14, color: '#8892A4', textDecoration: 'none', marginBottom: 10, transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#93AFFD'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8892A4'}>
              hello@jobblyapp.com
            </a>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, marginTop: 16 }}>
              Powered by<br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Claude AI · Supabase · Stripe</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Jobbly.ai — Alle Rechte vorbehalten</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Made with ♥ in Austria</span>
        </div>
      </div>
    </footer>
  )
}
