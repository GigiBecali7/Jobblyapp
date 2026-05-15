import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnschreibenClient from './AnschreibenClient'

export default async function AnschreibenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  let letters: unknown[] = []
  try {
    const { data: lettersData } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    letters = lettersData || []
  } catch {
    letters = []
  }
  const { data: lastApp } = await supabase.from('applications').select('template').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)

  const isPro = profile?.is_pro || user.email === 'drthinkbyte@gmail.com'
  const lastDesign = (lastApp?.[0]?.template as string) || 'NordicMinimal'

  return <AnschreibenClient isPro={isPro} letters={letters as Parameters<typeof AnschreibenClient>[0]['letters']} lastDesign={lastDesign} userId={user.id} profile={profile} />
}
