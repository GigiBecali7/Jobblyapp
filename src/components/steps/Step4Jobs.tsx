'use client'

import { useMemo } from 'react'
import type { Translation } from '@/lib/translations'
import type { UserData } from '@/lib/types'

export interface Job {
  t: string
  c: string
  l: string
  m: string
}

interface Props {
  t: Translation
  userData: UserData
  selectedJob: Job | null
  onSelect: (job: Job | null) => void
  onGenerate: () => void
  onBack: () => void
}

export default function Step4Jobs({ t, userData, selectedJob, onSelect, onGenerate, onBack }: Props) {
  const jobs = useMemo<Job[]>(() => {
    const pos = userData.position || 'Professional'
    const city = userData.city || 'Vienna'
    return [
      { t: `${pos} (Senior)`, c: 'TechVision GmbH', l: city, m: '97%' },
      { t: pos, c: 'Innovate AG', l: `${city} / Remote`, m: '94%' },
      { t: `${pos} – Career change`, c: 'StartUp Hub', l: city, m: '88%' },
      { t: `${pos} Part-time`, c: 'Pro Solutions', l: city, m: '81%' },
    ]
  }, [userData.position, userData.city])

  return (
    <div>
      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">🔍</div>
          <span>{t.jobsT}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--mid)', marginBottom: '1rem' }}>{t.jobsSub}</p>

        <div>
          {jobs.map((job) => {
            const isSel = selectedJob?.t === job.t && selectedJob?.c === job.c
            return (
              <div
                key={job.t + job.c}
                className={`job-item${isSel ? ' sel' : ''}`}
                onClick={() => onSelect(isSel ? null : job)}
              >
                <div>
                  <div className="jt">{job.t}</div>
                  <div className="jm">{job.c} · {job.l}</div>
                </div>
                <span className="match">{job.m}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-out" onClick={onBack}>Back</button>
        <button className="btn" onClick={onGenerate}>Generate application →</button>
      </div>
    </div>
  )
}
