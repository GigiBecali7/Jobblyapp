'use client'

import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  onCta: () => void
  onSignIn: () => void
}

export default function Hero({ t, onCta, onSignIn }: Props) {
  return (
    <>
      <div className="hero">
        <div className="hero-glow" />
        <div className="hero-pill">
          <div className="pill-dot" />
          <span>AI-powered · Free to start</span>
        </div>
        <h1>
          Your perfect application,<br />
          <span>in minutes.</span>
        </h1>
        <p className="hero-sub">
          Jobbly manages your entire job application process — from CV to one-click apply.
          Available in 6 languages, 4 writing styles.
        </p>
        <div className="hero-btns">
          <button className="hbtn" onClick={onCta}>Build my CV — free →</button>
          <button className="hbtn out" onClick={onSignIn}>Sign in</button>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="stat-n">3 min</div>
            <div className="stat-l">average time</div>
          </div>
          <div className="stat">
            <div className="stat-n">8+</div>
            <div className="stat-l">job platforms</div>
          </div>
          <div className="stat">
            <div className="stat-n">6</div>
            <div className="stat-l">languages</div>
          </div>
        </div>
      </div>
      <div className="accent-line" />
    </>
  )
}
