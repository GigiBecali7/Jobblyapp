'use client'

interface Props {
  onOpenLegal: (section: string) => void
}

export default function Footer({ onOpenLegal }: Props) {
  return (
    <div className="footer">
      <span className="fl" onClick={() => onOpenLegal('impressum')}>Imprint</span>
      <span className="fl" onClick={() => onOpenLegal('datenschutz')}>Privacy Policy</span>
      <span className="fl" onClick={() => onOpenLegal('agb')}>Terms of Service</span>
      <span className="fl" onClick={() => onOpenLegal('cookies')}>Cookies</span>
      <span className="fl" style={{ color: 'rgba(255,255,255,0.15)' }}>© 2025 Jobbly</span>
    </div>
  )
}
