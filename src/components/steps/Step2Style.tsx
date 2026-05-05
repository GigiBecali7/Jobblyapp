'use client'

import type { WritingStyle } from '@/lib/types'
import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  selected: WritingStyle
  onSelect: (s: WritingStyle) => void
  onNext: () => void
  onBack: () => void
}

const styles: { key: WritingStyle; emoji: string }[] = [
  { key: 'balanced', emoji: '⚖️' },
  { key: 'friendly', emoji: '😊' },
  { key: 'confident', emoji: '😎' },
  { key: 'formal', emoji: '🎯' },
]

export default function Step2Style({ t, selected, onSelect, onNext, onBack }: Props) {
  return (
    <div>
      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">✍</div>
          <span>{t.styleT}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--mid)', marginBottom: '1.25rem' }}>{t.styleSub}</p>

        <div className="style-grid">
          {styles.map(({ key, emoji }, i) => (
            <div
              key={key}
              className={`sc-opt${selected === key ? ' sel' : ''}`}
              onClick={() => onSelect(key)}
            >
              <span className="sc-emoji">{emoji}</span>
              <div className="sc-name">{t.sn[i]}</div>
              <div className="sc-desc">{t.sd[i]}</div>
            </div>
          ))}
        </div>

        <div className="preview-pill">
          <span className="plabel">{t.preview}</span>
          <span>{t.previews[selected]}</span>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-out" onClick={onBack}>Back</button>
        <button className="btn" onClick={onNext}>Continue to design →</button>
      </div>
    </div>
  )
}
