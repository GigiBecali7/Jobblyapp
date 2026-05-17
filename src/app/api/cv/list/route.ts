import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('cvs')
      .select('id, title, design, content, edit_count, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ cvs: data || [] })
  } catch (e) {
    console.error('cv/list error:', e)
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 })
  }
}
