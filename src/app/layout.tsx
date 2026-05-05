import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jobbly — Apply smarter.',
  description: 'Jobbly — AI-powered CV and cover letter builder. Create your perfect job application in minutes. Available in 6 languages.',
  keywords: 'CV builder, resume builder, cover letter, AI, job application, Lebenslauf, Bewerbung, KI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
