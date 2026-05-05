'use client'

import type { Template } from '@/lib/types'
import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  selected: Template
  onSelect: (t: Template) => void
  onNext: () => void
  onBack: () => void
  isPro: boolean
  onNeedPro: () => void
}

type TemplateEntry = { key: Template; name: string; pro?: boolean; preview: React.ReactNode }

const templates: TemplateEntry[] = [
  {
    key: 'classic',
    name: 'Classic Dark',
    preview: (
      <div style={{ background: '#1a1a2a', padding: 8, height: '100%' }}>
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
      <div style={{ display: 'flex', background: '#0D1117', height: '100%' }}>
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
      <div style={{ background: '#f9f9f9', padding: 8, height: '100%' }}>
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
      <div style={{ background: '#1B2E6B', padding: 8, height: '100%' }}>
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
      <div style={{ background: '#f5f5f5', padding: 8, height: '100%' }}>
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
      <div style={{ background: '#0D1117', padding: 8, height: '100%' }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
          <div style={{ height: 4, background: '#1B2E6B', borderRadius: 2, flex: 1 }} />
          <div style={{ height: 4, background: '#253A85', borderRadius: 2, flex: 2 }} />
        </div>
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.1)', marginBottom: 2 }} />
        <div style={{ height: 1.5, background: 'rgba(255,255,255,.07)', width: '70%' }} />
      </div>
    ),
  },
  {
    key: 'nordic',
    name: 'Nordic Minimal',
    pro: true,
    preview: (
      <div style={{ display: 'flex', background: '#FAFAFA', height: '100%' }}>
        <div style={{ width: '35%', background: '#F5F5F5', padding: 6, borderRight: '1px solid #E8E8E8' }}>
          <div style={{ width: 22, height: 22, borderRadius: 3, background: '#E0E4EE', marginBottom: 4 }} />
          <div style={{ height: 3, background: '#1B2E6B', borderRadius: 1, width: '80%', marginBottom: 3 }} />
          <div style={{ height: 1.5, background: '#ccc', width: '65%' }} />
        </div>
        <div style={{ flex: 1, padding: 6 }}>
          <div style={{ height: 3, background: '#1B2E6B', borderRadius: 1, width: '70%', marginBottom: 4 }} />
          <div style={{ height: 1.5, background: '#ddd', marginBottom: 2 }} />
          <div style={{ height: 1.5, background: '#eee', width: '85%' }} />
        </div>
      </div>
    ),
  },
  {
    key: 'mono',
    name: 'Mono Elegant',
    pro: true,
    preview: (
      <div style={{ background: '#fff', height: '100%' }}>
        <div style={{ height: 3, background: '#1B2E6B', marginBottom: 6 }} />
        <div style={{ padding: '0 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ height: 5, background: '#1a1a2a', borderRadius: 1, width: 55, marginBottom: 3 }} />
            <div style={{ height: 1.5, background: '#999', width: 40 }} />
          </div>
          <div style={{ width: 16, height: 16, borderRadius: 2, background: '#E0E4EE' }} />
        </div>
        <div style={{ display: 'flex', gap: 5, padding: '6px 6px 0', marginTop: 4 }}>
          <div style={{ flex: 1.5, borderRight: '1px solid #eee', paddingRight: 4 }}>
            <div style={{ height: 1.5, background: '#ddd', marginBottom: 2 }} />
            <div style={{ height: 1.5, background: '#eee', width: '80%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 1.5, background: '#ddd', marginBottom: 2 }} />
            <div style={{ height: 1.5, background: '#eee', width: '60%' }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'split',
    name: 'Split Premium',
    pro: true,
    preview: (
      <div style={{ display: 'flex', background: '#fff', height: '100%' }}>
        <div style={{ width: '38%', background: '#1B2E6B', padding: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', margin: '0 auto 4px' }} />
          <div style={{ height: 2.5, background: 'rgba(255,255,255,.8)', borderRadius: 1, width: '70%', margin: '0 auto 3px' }} />
          <div style={{ height: 1.5, background: 'rgba(147,175,253,.5)', width: '55%', margin: '0 auto' }} />
        </div>
        <div style={{ flex: 1, padding: 6 }}>
          <div style={{ height: 2.5, background: '#1B2E6B', borderRadius: 1, width: '70%', marginBottom: 4 }} />
          <div style={{ height: 1.5, background: '#ddd', marginBottom: 2 }} />
          <div style={{ height: 1.5, background: '#eee', width: '80%' }} />
        </div>
      </div>
    ),
  },
]

export default function Step3Design({ t, selected, onSelect, onNext, onBack, isPro, onNeedPro }: Props) {
  function handleSelect(key: Template, isPro: boolean, proRequired: boolean) {
    if (proRequired && !isPro) {
      onNeedPro()
      return
    }
    onSelect(key)
  }

  return (
    <div>
      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">🎨</div>
          <span>{t.designT}</span>
        </div>

        <div className="tpl-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {templates.map(({ key, name, preview, pro }) => (
            <div
              key={key}
              className={`tpl${selected === key ? ' sel' : ''}`}
              onClick={() => handleSelect(key, isPro, !!pro)}
              style={{ position: 'relative' }}
            >
              {pro && (
                <div style={{
                  position: 'absolute', top: 6, right: 6, zIndex: 1,
                  fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                  background: 'rgba(27,46,107,0.7)', color: '#93AFFD',
                  border: '0.5px solid rgba(37,58,133,0.6)', lineHeight: 1,
                }}>PRO</div>
              )}
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
