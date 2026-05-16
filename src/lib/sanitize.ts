const HTML_CHARS_RE = /[<>"'`]/g
const JS_PROTO_RE = /javascript:/gi
const DATA_PROTO_RE = /data:/gi

export function sanitizeText(input: unknown, maxLength = 10000): string {
  if (input === null || input === undefined) return ''
  const str = String(input)
  return str
    .replace(HTML_CHARS_RE, '')
    .replace(JS_PROTO_RE, '')
    .replace(DATA_PROTO_RE, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeArray(input: unknown, maxItems = 20, maxLength = 200): string[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, maxItems)
    .map(item => sanitizeText(item, maxLength))
    .filter(Boolean)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePhone(phone: string): boolean {
  if (!phone.trim()) return true // optional
  return /^\+?[\d\s\-()]{7,20}$/.test(phone.trim())
}

export function validateLinkedIn(url: string): boolean {
  if (!url.trim()) return true // optional
  return url.startsWith('https://linkedin.com/in/') || url.startsWith('https://www.linkedin.com/in/')
}

export function validateBirthday(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr.trim()) return { valid: true }
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return { valid: false, error: 'Bitte gib ein gültiges Geburtsdatum ein' }
  const ageMs = Date.now() - date.getTime()
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25)
  if (ageYears < 15) return { valid: false, error: 'Du musst mindestens 15 Jahre alt sein' }
  if (ageYears > 120) return { valid: false, error: 'Bitte gib ein gültiges Geburtsdatum ein' }
  return { valid: true }
}

export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Nur JPG, PNG oder WebP erlaubt' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Das Foto ist zu groß. Maximale Größe: 5 MB' }
  }
  return { valid: true }
}
