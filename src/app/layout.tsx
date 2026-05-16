import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import MetaPixelWrapper from '@/components/MetaPixelWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jobbly.ai — KI Bewerbung & Lebenslauf erstellen | Österreich',
  description: 'Erstelle deinen perfekten Lebenslauf und dein Bewerbungsschreiben mit KI in 3 Minuten. Jobbly benachrichtigt dich sofort wenn dein Traumjob erscheint.',
  keywords: 'Lebenslauf erstellen, Bewerbung schreiben KI, CV builder Österreich, Bewerbungsschreiben Generator, KI Bewerbung, Jobbly',
  authors: [{ name: 'Jobbly' }],
  creator: 'Jobbly',
  metadataBase: new URL('https://www.jobblyapp.com'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://www.jobblyapp.com',
    siteName: 'Jobbly.ai',
    title: 'Jobbly.ai — KI Bewerbung & Lebenslauf erstellen',
    description: 'Erstelle deinen perfekten Lebenslauf mit KI in 3 Minuten. Automatische Jobbenachrichtigungen für Österreich.',
    locale: 'de_AT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobbly.ai — KI Bewerbung & Lebenslauf',
    description: 'Lebenslauf & Bewerbungsschreiben mit KI in 3 Minuten. Jetzt kostenlos testen.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: 'Gx-pdgpym00MTvB2utXxPh1katSXrtDEm7MyG-wFujc',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Jobbly.ai',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'KI-gestützter Lebenslauf- und Bewerbungsschreiben-Builder für den österreichischen und deutschen Arbeitsmarkt.',
              offers: {
                '@type': 'Offer',
                price: '9.99',
                priceCurrency: 'EUR',
                priceValidUntil: '2026-12-31',
              },
              url: 'https://www.jobblyapp.com',
              inLanguage: ['de', 'en'],
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <MetaPixelWrapper />
      </body>
    </html>
  )
}
