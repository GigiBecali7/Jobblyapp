import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LebenslaufClient from './LebenslaufClient'

export default async function LebenslaufPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: cvCount } = await supabase.from('applications').select('id', { count: 'exact' }).eq('user_id', user.id)

  const isPro = profile?.is_pro || user.email === 'drthinkbyte@gmail.com'
  const existingCVCount = cvCount?.length ?? 0

  return <LebenslaufClient isPro={isPro} existingCVCount={existingCVCount} profile={profile} userId={user.id} />
}
