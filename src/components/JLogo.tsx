import Link from 'next/link'

interface Props {
  size?: number
  href?: string
}

export function JMark({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: '#1B2E6B', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 0 0 1px rgba(37,58,133,0.8)',
    }}>
      <svg width={size * 0.55} height={size * 0.65} viewBox="0 0 18 22" fill="none">
        <path d="M9 1V15C9 17.2 7.5 19 5 19C2.8 19 1 17.3 1 15.1" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="9" cy="1" r="1.5" fill="white"/>
      </svg>
    </div>
  )
}

export default function JLogo({ size = 32, href = '/' }: Props) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <JMark size={size} />
      <span style={{ fontSize: size * 0.56, fontWeight: 600, color: '#fff', letterSpacing: '-.3px', lineHeight: 1 }}>
        jobbly<span style={{ color: '#93AFFD', fontWeight: 300 }}>.ai</span>
      </span>
    </div>
  )
  return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
}
