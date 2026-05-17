import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LebenslaufClient from './LebenslaufClient'

export default async function LebenslaufPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { count: cvCount } = await supabase.from('cvs').select('id', { count: 'exact', head: true }).eq('user_id', user.id)

  const isPro = profile?.is_pro === true || user.email === 'drthinkbyte@gmail.com'
  const existingCVCount = cvCount ?? 0

  return <LebenslaufClient isPro={isPro} existingCVCount={existingCVCount} profile={profile} userId={user.id} />
}
