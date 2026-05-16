import type { UserProfile } from '@/lib/types'

export interface CompletenessResult {
  score: number
  missing: Array<{ key: string; label: string; points: number }>
}

export function getProfileCompleteness(profile: UserProfile): CompletenessResult {
  const p = profile as UserProfile & Record<string, unknown>

  const checks: Array<{ key: string; label: string; points: number; satisfied: boolean }> = [
    {
      key: 'name', label: 'Vor- und Nachname', points: 10,
      satisfied: !!(profile.first_name?.trim() && profile.last_name?.trim()),
    },
    {
      key: 'photo', label: 'Profilfoto', points: 10,
      satisfied: !!(p.photo_url || p.avatar_url),
    },
    {
      key: 'current_position', label: 'Aktueller Job-Titel', points: 10,
      satisfied: !!(p.current_position),
    },
    {
      key: 'industry', label: 'Branche', points: 5,
      satisfied: !!(p.industry),
    },
    {
      key: 'experience_level', label: 'Erfahrungslevel', points: 5,
      satisfied: !!(p.experience_level || p.experience),
    },
    {
      key: 'desired_position', label: 'Wunschposition', points: 10,
      satisfied: !!(p.position || p.desired_position),
    },
    {
      key: 'desired_salary', label: 'Wunschgehalt', points: 5,
      satisfied: !!(Number(p.salary_target) > 0 || Number(p.desired_salary) > 0),
    },
    {
      key: 'work_model', label: 'Arbeitsmodell', points: 5,
      satisfied: !!(p.work_model),
    },
    {
      key: 'city', label: 'Wohnort / Stadt', points: 10,
      satisfied: !!(p.city),
    },
    {
      key: 'skills', label: 'Kenntnisse / Skills', points: 15,
      satisfied: Array.isArray(p.skills) ? (p.skills as unknown[]).length > 0 : !!(p.skills),
    },
    {
      key: 'languages', label: 'Sprachkenntnisse', points: 10,
      satisfied: Array.isArray(p.languages) ? (p.languages as unknown[]).length > 0 : !!(p.languages),
    },
    {
      key: 'phone', label: 'Telefonnummer', points: 5,
      satisfied: !!(p.phone),
    },
  ]

  const score = checks.filter(c => c.satisfied).reduce((sum, c) => sum + c.points, 0)
  const missing = checks
    .filter(c => !c.satisfied)
    .map(({ key, label, points }) => ({ key, label, points }))

  return { score, missing }
}
