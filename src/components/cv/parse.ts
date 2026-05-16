export interface ExpEntry { title: string; company: string; period: string; description: string }
export interface EduEntry { degree: string; institution: string; period: string }

export function parseExp(raw: string): ExpEntry[] {
  if (!raw?.trim()) return []
  return raw.split(/\n\n+/).map(block => {
    const lines = block.trim().split('\n')
    const [title = '', company = ''] = (lines[0] || '').split(' | ').map(s => s.trim())
    const period = lines[1]?.trim() || ''
    const description = lines.slice(2).join('\n').trim()
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
