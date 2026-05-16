import type { SupabaseClient } from '@supabase/supabase-js'

const DAILY_LIMIT_FREE = 3
const DAILY_LIMIT_PRO = 50

export interface RateLimitResult {
  allowed: boolean
  message?: string
  remaining?: number
}

export async function checkAndIncrementAIRate(
  supabase: SupabaseClient,
  userId: string,
  isPro: boolean,
): Promise<RateLimitResult> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_requests_today, ai_requests_reset_at')
      .eq('id', userId)
      .single()

    const now = new Date()
    const resetAt = profile?.ai_requests_reset_at ? new Date(profile.ai_requests_reset_at) : null
    const msPerDay = 24 * 60 * 60 * 1000
    const needsReset = !resetAt || (now.getTime() - resetAt.getTime()) >= msPerDay

    const currentCount = needsReset ? 0 : (Number(profile?.ai_requests_today) || 0)
    const limit = isPro ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        message: isPro
          ? `Du hast dein tägliches Limit von ${limit} Anfragen erreicht. Bitte versuche es morgen wieder.`
          : 'Du hast dein tägliches Limit erreicht. Upgrade auf Pro für unbegrenzte Anfragen.',
      }
    }

    await supabase.from('profiles').update({
      ai_requests_today: currentCount + 1,
      ai_requests_reset_at: needsReset ? now.toISOString() : (profile?.ai_requests_reset_at ?? now.toISOString()),
    } as Record<string, unknown>).eq('id', userId)

    return { allowed: true, remaining: limit - currentCount - 1 }
  } catch {
    // If columns don't exist yet, allow the request (graceful degradation)
    return { allowed: true, remaining: 99 }
  }
}
