'use client'

import type { Template } from '@/lib/types'
import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  selected: Template
  onSelect: (t: Template) => void
  onNext: () => void
  onBack: () => void
}

const templates: { key: Template; name: string; preview: React.ReactNode }[] = [
  {
    key: 'classic',
    name: 'Classic Dark',
    preview: (
      <div style={{ background: '#1a1a2a', padding: 8 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,.8)', borderRadius: 2, width: '55%', marginBottom: 4 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.2)', marginBottom: 3 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.15)', width: '80%' }} />
      </div>
    ),
  },
  {
    key: 'modern',
    name: 'Modern',
    preview: (
      <div style={{ display: 'flex', background: '#0D1117' }}>
        <div style={{ width: '28%', background: '#1B2E6B', padding: 5 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.2)', margin: '0 auto 4px' }} />
        </div>
        <div style={{ flex: 1, padding: 6 }}>
          <div style={{ height: 4, background: '#253A85', borderRadius: 2, marginBottom: 4, width: '65%' }} />
          <div style={{ height: 1.5, background: 'rgba(255,255,255,.1)' }} />
        </div>
      </div>
    ),
  },
  {
    key: 'minimal',
    name: 'Minimal Light',
    preview: (
      <div style={{ background: '#f9f9f9', padding: 8 }}>
        <div style={{ borderLeft: '3px solid #1B2E6B', paddingLeft: 7 }}>
          <div style={{ height: 4, background: '#1B2E6B', borderRadius: 2, marginBottom: 4, width: '55%' }} />
          <div style={{ height: 1.5, background: '#ddd', marginBottom: 2 }} />
          <div style={{ height: 1.5, background: '#eee', width: '85%' }} />
        </div>
      </div>
    ),
  },
  {
    key: 'navy',
    name: 'Navy',
    preview: (
      <div style={{ background: '#1B2E6B', padding: 8 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,.9)', borderRadius: 2, width: '55%', marginBottom: 4 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.3)', marginBottom: 2 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.2)', width: '80%' }} />
      </div>
    ),
  },
  {
    key: 'executive',
    name: 'Executive',
    preview: (
      <div style={{ background: '#f5f5f5', padding: 8 }}>
        <div style={{ height: 4, background: '#0A0A0F', borderRadius: 2, marginBottom: 4, width: '60%' }} />
        <div style={{ height: 1.5, background: '#ccc', marginBottom: 2 }} />
        <div style={{ height: 1.5, background: '#ddd', width: '80%' }} />
      </div>
    ),
  },
  {
    key: 'tech',
    name: 'Tech',
    preview: (
      <div style={{ background: '#0D1117', padding: 8 }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
          <div style={{ height: 4, background: '#1B2E6B', borderRadius: 2, flex: 1 }} />
          <div style={{ height: 4, background: '#253A85', borderRadius: 2, flex: 2 }} />
        </div>
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.1)', marginBottom: 2 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.07)', width: '70%' }} />
      </div>
    ),
  },
]

export default function Step3Design({ t, selected, onSelect, onNext, onBack }: Props) {
  return (
    <div>
      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">🎨</div>
          <span>{t.designT}</span>
        </div>

        <div className="tpl-grid">
          {templates.map(({ key, name, preview }) => (
            <div
              key={key}
              className={`tpl${selected === key ? ' sel' : ''}`}
              onClick={() => onSelect(key)}
            >
              <div className="tpl-p">{preview}</div>
              <div className="tpl-n">{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-out" onClick={onBack}>Back</button>
        <button className="btn" onClick={onNext}>Continue to jobs →</button>
      </div>
    </div>
  )
}
