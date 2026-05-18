export interface ExpEntry { title: string; company: string; period: string; description: string }
export interface EduEntry { degree: string; institution: string; period: string }

export function parseExp(raw: string): ExpEntry[] {
  if (!raw?.trim()) return []
  return raw.split(/\n\n+/).map(block => {
    const lines = block.trim().split('\n')
    const [title = '', company = ''] = (lines[0] || '').split(' | ').map(s => s.trim())
    const period = lines[1]?.trim() || ''
    const descLines = lines.slice(2).filter(l => {
      const raw = l.trim()
      if (!raw) return false
      // Strip bullet prefix, then check for duplicate patterns
      const t = raw.replace(/^[•\-–*]\s*/, '').trim()
      if (!t) return false
      if (t.includes(' | ')) return false  // "Title | Company" duplicate (with or without bullet)
      if (/^\d{4}\s*[–\-—]\s*(\d{4}|heute|present|aktuell)/i.test(t)) return false  // date duplicate
      return true
    })
    const description = descLines.join('\n').trim()
    return { title, company, period, description }
  }).filter(e => e.title || e.company)
}

export function parseEdu(raw: string): EduEntry[] {
  if (!raw?.trim()) return []
  return raw.split(/\n\n+/).map(block => {
    const lines = block.trim().split('\n')
    const [degree = '', institution = ''] = (lines[0] || '').split(' | ').map(s => s.trim())
    const period = lines[1]?.trim() || ''
    return { degree, institution, period }
  }).filter(e => e.degree || e.institution)
}
