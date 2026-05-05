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
          <span>{t.tag}</span>
        </div>
        <h1>
          {t.h1.split('\n').map((line, i) => (
            i === 1 ? <><br key={i} /><span>{line}</span></> : line
          ))}
        </h1>
        <p className="hero-sub">{t.p}</p>
        <div className="hero-btns">
          <button className="hbtn" onClick={onCta}>{t.cta}</button>
          <button className="hbtn out" onClick={onSignIn}>{t.signin}</button>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="stat-n">3 min</div>
            <div className="stat-l">{t.stat1}</div>
          </div>
          <div className="stat">
            <div className="stat-n">6</div>
            <div className="stat-l">{t.stat2}</div>
          </div>
          <div className="stat">
            <div className="stat-n">4</div>
            <div className="stat-l">{t.stat3}</div>
          </div>
        </div>
      </div>
      <div className="accent-line" />
    </>
  )
}
