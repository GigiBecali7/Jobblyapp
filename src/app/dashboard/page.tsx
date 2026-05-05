import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  return (
    <div className="app">
      <div className="nav">
        <Link href="/" className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1B2E6B"/>
            <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".95"/>
            <rect x="15" y="6" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
            <rect x="6" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".4"/>
            <rect x="15" y="15" width="6" height="6" rx="1.5" fill="white" opacity=".15"/>
          </svg>
          <div className="logo-text">jobbly<span className="logo-ai">.ai</span></div>
        </Link>
        <div className="nav-right">
          {profile?.is_pro && <span className="pro-pill">PRO</span>}
          <Link href="/">
            <button className="nbtn">← Builder</button>
          </Link>
        </div>
      </div>

      <DashboardClient
        profile={profile as UserProfile}
        applications={(applications || []) as Application[]}
        justUpgraded={justUpgraded}
      />
    </div>
  )
}
