import type { SupabaseClient } from '@supabase/supabase-js'

export interface AIValidationMissing { field: string; label: string }
export interface AIValidationResult {
  valid: boolean
  missing: AIValidationMissing[]
  profile: Record<string, unknown> | null
}

export async function validateProfileForAI(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string,
): Promise<AIValidationResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, city, address, zip_code, position, current_position, experience, skills')
    .eq('id', userId)
    .single()

  const missing: AIValidationMissing[] = []

  if (!profile?.first_name?.trim()) missing.push({ field: 'first_name', label: 'Vorname' })
  if (!profile?.last_name?.trim())  missing.push({ field: 'last_name',  label: 'Nachname' })
  if (!userEmail?.trim())           missing.push({ field: 'email',      label: 'E-Mail-Adresse' })
  if (!profile?.phone?.trim())      missing.push({ field: 'phone',      label: 'Telefonnummer' })
  if (!profile?.city?.trim())       missing.push({ field: 'city',       label: 'Wohnort / Stadt' })
  if (!profile?.address?.trim())    missing.push({ field: 'address',    label: 'Straße & Hausnummer' })
  if (!profile?.zip_code?.trim())   missing.push({ field: 'zip_code',   label: 'Postleitzahl (PLZ)' })

  const hasPosition = String(profile?.position || profile?.current_position || '').trim()
  if (!hasPosition) missing.push({ field: 'position', label: 'Wunschposition / aktueller Job-Titel' })

  return {
    valid: missing.length === 0,
    missing,
    profile: profile as Record<string, unknown> | null,
  }
}
