'use client'

interface Props {
  onCta: () => void
  onUpgrade: () => void
}

const USP_ITEMS = [
  { icon: '🎯', title: 'Fully personalized', desc: 'Not a generic template. AI writes in YOUR style, tone, and language — every time.' },
  { icon: '🔔', title: 'Instant job alerts', desc: 'Get notified the moment your dream job is posted on StepStone, LinkedIn, Indeed, Willhaben and 13 more platforms.' },
  { icon: '⚡', title: 'One-click apply', desc: 'AI rewrites your cover letter for each job in seconds — perfectly matched to the posting.' },
  { icon: '🚀', title: '10 applications in 5 minutes', desc: 'Instead of 5 hours. Jobbly automates the tedious parts so you focus on getting hired.' },
  { icon: '📋', title: 'End-to-end process', desc: "We don't just build your CV — we manage your entire application process from start to offer." },
]

const HOW_STEPS = [
  { n: '01', icon: '👤', label: 'Build your profile', desc: 'Enter your details once. Jobbly learns your experience, skills, and style.' },
  { n: '02', icon: '🤖', label: 'AI generates your CV', desc: 'Claude AI writes a tailored CV and cover letter in your chosen language and style.' },
  { n: '03', icon: '🔔', label: 'Get instant job alerts', desc: 'We monitor 20+ European platforms and notify you the moment a match appears.' },
  { n: '04', icon: '✍️', label: 'AI adapts your cover letter', desc: 'One click — AI rewrites your cover letter to perfectly match each job description.' },
  { n: '05', icon: '🎉', label: 'Apply in one click', desc: 'Review, edit if you like, and apply. Done in seconds, not hours.' },
]

const PRO_FEATURES = [
  'Unlimited CV and cover letter generation',
  'Instant job alerts from 20+ European platforms',
  'AI auto-adapts cover letter to each job posting',
  'Edit all CV and cover letter fields before export',
  'PDF and Word (.docx) export',
  '6 premium CV designs with photo support',
  'Priority support',
]

const COMPARISON = [
  { feature: 'AI-personalized CV',         jobbly: true,  makemycv: true,  zety: true,  resume: true  },
  { feature: 'Cover letter generation',    jobbly: true,  makemycv: false, zety: true,  resume: false },
  { feature: 'Job alerts (20+ platforms)', jobbly: true,  makemycv: false, zety: false, resume: false },
  { feature: 'One-click apply (AI)',        jobbly: true,  makemycv: false, zety: false, resume: false },
  { feature: 'AI adapts per job posting',  jobbly: true,  makemycv: false, zety: false, resume: false },
  { feature: 'PDF + Word export',           jobbly: true,  makemycv: true,  zety: true,  resume: true  },
  { feature: 'Price / month',              jobbly: '€9.99', makemycv: '€14.99', zety: '€23.99', resume: '€19.99' },
]

const PLATFORMS = [
  { name: 'StepStone', color: '#E8000D', abbr: 'SS' },
  { name: 'LinkedIn', color: '#0A66C2', abbr: 'in' },
  { name: 'Indeed', color: '#2164F3', abbr: 'id' },
  { name: 'Willhaben', color: '#009E6C', abbr: 'wh' },
  { name: 'Karriere.at', color: '#E30613', abbr: 'K' },
  { name: 'Monster', color: '#6E00C2', abbr: 'M' },
  { name: 'Glassdoor', color: '#0CAA41', abbr: 'GD' },
  { name: 'Xing', color: '#026466', abbr: 'X' },
]

export default function LandingSections({ onCta, onUpgrade }: Props) {
  return (
    <div className="landing-sections">
      {/* ---- USP ---- */}
      <section className="ls-section">
        <div className="ls-pill">Why Jobbly beats the rest</div>
        <h2 className="ls-h2">Everything you need.<br /><span>Nothing you don&apos;t.</span></h2>
        <div className="usp-grid">
          {USP_ITEMS.map(({ icon, title, desc }) => (
            <div key={title} className="usp-card">
              <div className="usp-icon">{icon}</div>
              <div className="usp-title">{title}</div>
              <div className="usp-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- JOB PLATFORMS ---- */}
      <section className="ls-section ls-alt">
        <div className="ls-pill">20+ Plattformen</div>
        <h2 className="ls-h2">Alle großen Jobbörsen.<br /><span>Ein Ort.</span></h2>
        <p style={{ fontSize: 16, color: 'var(--mid)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7, textAlign: 'center' }}>
          Jobbly überwacht automatisch über 20 europäische Jobplattformen — und benachrichtigt dich sofort, wenn dein Traumjob erscheint.
        </p>
        <div className="platforms-grid">
          {PLATFORMS.map(p => (
            <div key={p.name} className="platform-chip">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: .5 }}>
                {p.abbr}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--white)' }}>{p.name}</span>
            </div>
          ))}
          <div className="platform-chip" style={{ background: 'rgba(27,46,107,0.12)', border: '0.5px dashed rgba(147,175,253,0.3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(147,175,253,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--navy3)', flexShrink: 0 }}>+</div>
            <span style={{ fontSize: 14, color: 'var(--navy3)', fontWeight: 500 }}>12 weitere</span>
          </div>
        </div>
        <button className="hbtn" onClick={onCta} style={{ marginTop: '2.5rem' }}>
          Jetzt kostenlos starten →
        </button>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="ls-section">
        <div className="ls-pill">Simple process</div>
        <h2 className="ls-h2">How it works</h2>
        <div className="how-grid">
          {HOW_STEPS.map(({ n, icon, label, desc }) => (
            <div key={n} className="how-step">
              <div className="how-num">{n}</div>
              <div className="how-icon">{icon}</div>
              <div className="how-label">{label}</div>
              <div className="how-desc">{desc}</div>
            </div>
          ))}
        </div>
        <button className="hbtn" onClick={onCta} style={{ marginTop: '2rem' }}>
          Get started — free →
        </button>
      </section>

      {/* ---- PRO PLAN ---- */}
      <section className="ls-section ls-alt">
        <div className="ls-pill">Jobbly Pro</div>
        <h2 className="ls-h2">One plan. Everything included.</h2>
        <div className="pro-card">
          <div className="pro-card-left">
            <div className="pro-price">€9.99<span>/month</span></div>
            <div className="pro-note">Cancel anytime · No hidden fees · VAT included</div>
            <button className="hbtn" onClick={onUpgrade} style={{ marginTop: '1.5rem', width: '100%' }}>
              Start Pro now →
            </button>
          </div>
          <div className="pro-card-right">
            {PRO_FEATURES.map(f => (
              <div key={f} className="pro-feat">
                <span className="pro-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- COMPARISON ---- */}
      <section className="ls-section">
        <div className="ls-pill">Compare</div>
        <h2 className="ls-h2">Jobbly vs the competition</h2>
        <div className="cmp-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="cmp-jobbly">Jobbly</th>
                <th>MakeMyCV</th>
                <th>Zety</th>
                <th>Resume.io</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(row => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  {(['jobbly', 'makemycv', 'zety', 'resume'] as const).map(col => (
                    <td key={col} className={col === 'jobbly' ? 'cmp-jobbly' : ''}>
                      {typeof row[col] === 'boolean'
                        ? <span className={row[col] ? 'cmp-yes' : 'cmp-no'}>{row[col] ? '✓' : '✕'}</span>
                        : <span className={col === 'jobbly' ? 'cmp-price-win' : 'cmp-price'}>{row[col]}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
