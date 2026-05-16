import { legalTexts } from '@/lib/translations'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — Jobbly.ai',
  description: 'Datenschutzerklärung und Informationen zur Verarbeitung personenbezogener Daten bei Jobbly.ai.',
  robots: { index: true, follow: true },
}

export default function DatenschutzPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8892A4', textDecoration: 'none', marginBottom: 32 }}>
          ← Zurück zur Startseite
        </Link>
        <div
          className="legal"
          dangerouslySetInnerHTML={{ __html: legalTexts.datenschutz }}
          style={{ lineHeight: 1.7 }}
        />
      </div>
    </div>
  )
}
