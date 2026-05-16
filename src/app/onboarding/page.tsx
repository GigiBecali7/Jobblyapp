import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If user has already completed onboarding, send them to dashboard
  if (profile?.onboarding_completed === true) {
    redirect('/dashboard')
  }

  const resolvedProfile = (profile || {
    id: user.id,
    email: user.email || '',
    first_name: '',
    last_name: '',
    is_pro: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: '',
  }) as UserProfile

  // Grant permanent Pro to owner
  if (user.email === 'drthinkbyte@gmail.com') {
    resolvedProfile.is_pro = true
  }

  return <OnboardingClient profile={resolvedProfile} />
}
