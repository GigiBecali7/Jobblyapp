import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.jobblyapp.com'

  if (!code) {
    return NextResponse.redirect(`${appUrl}/auth/verify?error=invalid_link`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(`${appUrl}/auth/verify?error=invalid_link`)
  }

  // Always get user from the server-verified session — never trust client state
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('Auth callback: could not verify user after code exchange', userError?.message)
    return NextResponse.redirect(`${appUrl}/auth/verify?error=invalid_link`)
  }

  const isOAuth = user.app_metadata?.provider && user.app_metadata.provider !== 'email'
  const meta = user.user_metadata || {}

  // Seed profile for new users; ignoreDuplicates=true preserves existing user-edited data
  const { data: upsertResult } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    first_name: meta.full_name?.split(' ')[0] || meta.given_name || meta.first_name || '',
    last_name: meta.full_name?.split(' ').slice(1).join(' ') || meta.family_name || meta.last_name || '',
    // Capture Google/OAuth avatar for new users (ignored on conflict by ignoreDuplicates)
    avatar_url: meta.avatar_url || meta.picture || null,
    is_pro: false,
  }, { onConflict: 'id', ignoreDuplicates: true }).select('id').single()

  // Send welcome email only for new users (upsert returned data = new row created)
  if (upsertResult && user.email) {
    const firstName = meta.full_name?.split(' ')[0] || meta.given_name || meta.first_name || ''
    sendWelcomeEmail(user.id, user.email, firstName).catch(e => console.error('Welcome email failed:', e))
  }

  // Check if user has completed onboarding
  const { data: profileData } = await supabase
    .from('profiles')
    .select('onboarding_completed, first_name')
    .eq('id', user.id)
    .single()

  // Check if user needs onboarding
  // Redirect when: onboarding_completed is false (new user after migration)
  //             OR column doesn't exist yet AND first_name is empty (new user before migration)
  const needsOnboarding =
    profileData?.onboarding_completed === false ||
    (profileData?.onboarding_completed == null && !profileData?.first_name)

  if (needsOnboarding) {
    return NextResponse.redirect(`${appUrl}/onboarding`)
  }

  if (isOAuth) {
    return NextResponse.redirect(`${appUrl}/dashboard`)
  }

  return NextResponse.redirect(`${appUrl}${next}`)
}
