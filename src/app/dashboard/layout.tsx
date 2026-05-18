import { createClient } from '@/lib/supabase/server'
import FeedbackButton from '@/components/FeedbackButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''

  return (
    <>
      {children}
      <FeedbackButton userEmail={email} />
    </>
  )
}
