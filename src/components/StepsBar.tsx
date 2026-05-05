'use client'

import type { Translation } from '@/lib/translations'

interface Props {
  step: number
  t: Translation
}

const labels = ['stat1', 'stat2', 'stat3', 'stat4', 'stat5'] as const

export default function StepsBar({ step, t }: Props) {
  const stepLabels = [t.personal, t.styleT, t.designT, t.jobsT, 'Result']

  return (
    <div className="sbar" id="app-top">
      {stepLabels.map((label, i) => {
        const n = i + 1
        const isActive = n === step
        const isDone = n < step
        return (
          <>
            <div
              key={n}
              className={`si${isActive ? ' active' : isDone ? ' done' : ''}`}
            >
              <div className="si-n">{isDone ? '✓' : n}</div>
              <div className="si-l">{label}</div>
            </div>
            {n < 5 && <div key={`sc-${n}`} className="sc" />}
          </>
        )
      })}
    </div>
  )
}
