'use client'

import { legalTexts } from '@/lib/translations'

type LegalKey = keyof typeof legalTexts

interface Props {
  section: LegalKey
  onClose: () => void
}

export default function LegalModal({ section, onClose }: Props) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="legal-modal">
        <button className="modal-x" onClick={onClose}>✕</button>
        <div className="legal" dangerouslySetInnerHTML={{ __html: legalTexts[section] }} />
      </div>
    </div>
  )
}
