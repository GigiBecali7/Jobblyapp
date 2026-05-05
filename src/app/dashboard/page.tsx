import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Application, UserProfile } from '@/lib/types'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const params = await searchParams
  const justUpgraded = params.success === '1'

  // Full-screen layout — no .app container
  return (
    <DashboardClient
      profile={profile as UserProfile}
      applications={(applications || []) as Application[]}
      justUpgraded={justUpgraded}
    />
  )
}
