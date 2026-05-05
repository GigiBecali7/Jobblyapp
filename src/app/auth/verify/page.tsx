import Link from 'next/link'

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="app">
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
      </div>

      <div className="verify-box">
        <div style={{ fontSize: 48, marginBottom: '1rem' }}>📧</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: '.5rem' }}>
          Check your inbox
        </div>
        <p style={{ fontSize: 14, color: 'var(--mid)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 1.5rem' }}>
          We&apos;ve sent you a verification email. Click the link in the email to activate your account.
          The link expires in 24 hours.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: '1.5rem' }}>
          Didn&apos;t receive it? Check your spam folder or{' '}
          <Link href="/" style={{ color: 'var(--navy3)' }}>try again</Link>.
        </p>
        <Link href="/">
          <button className="btn" style={{ maxWidth: 200, margin: '0 auto', display: 'block' }}>
            Back to home
          </button>
        </Link>
      </div>
    </div>
  )
}
