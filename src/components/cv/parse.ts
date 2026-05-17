export interface ExpEntry { title: string; company: string; period: string; description: string }
export interface EduEntry { degree: string; institution: string; period: string }

export function parseExp(raw: string): ExpEntry[] {
  if (!raw?.trim()) return []
  return raw.split(/\n\n+/).map(block => {
    const lines = block.trim().split('\n')
    const [title = '', company = ''] = (lines[0] || '').split(' | ').map(s => s.trim())
    const period = lines[1]?.trim() || ''
    const descLines = lines.slice(2).filter(l => {
      const t = l.trim()
      if (!t) return false
      // Skip lines that look like "Title | Company" duplicates
      if (t.includes(' | ') && !t.startsWith('•') && !t.startsWith('-')) return false
      // Skip lines that look like date ranges (e.g. "2015 – 2020", "2015–2020")
      if (/^\d{4}\s*[–\-—]\s*(\d{4}|heute|present|aktuell)/i.test(t)) return false
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
