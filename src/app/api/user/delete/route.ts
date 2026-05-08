import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete user data from all tables
    await Promise.all([
      supabase.from('applications').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('id', user.id),
    ])

    // Delete the auth user via service role (requires SUPABASE_SERVICE_ROLE_KEY)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (serviceKey && supabaseUrl) {
      const admin = createServiceClient(supabaseUrl, serviceKey)
      await admin.auth.admin.deleteUser(user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
