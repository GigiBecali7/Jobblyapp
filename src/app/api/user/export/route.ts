import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: profile }, { data: applications }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('applications').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: profile || {},
      applications: applications || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jobbly-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
