import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const authClient = await createClient()
    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { photoUrl } = await req.json()
    if (!photoUrl || typeof photoUrl !== 'string') {
      return NextResponse.json({ error: 'photoUrl fehlt' }, { status: 422 })
    }

    // Use service role to bypass RLS for profile update
    // @ts-ignore
    const db = createServiceClient() as any
    const { error: dbErr } = await db
      .from('profiles')
      .update({ photo_url: photoUrl, avatar_url: photoUrl })
      .eq('id', user.id)

    if (dbErr) {
      console.error('profile/save-photo DB error:', JSON.stringify(dbErr, null, 2))
      return NextResponse.json({
        error: 'Foto konnte nicht gespeichert werden.',
        details: (dbErr as { message?: string }).message,
      }, { status: 500 })
    }

    // Verify it was saved
    const { data: verify } = await db
      .from('profiles')
      .select('photo_url')
      .eq('id', user.id)
      .single()
    console.log('profile/save-photo verified:', (verify as { photo_url?: string } | null)?.photo_url?.slice(0, 60))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('profile/save-photo error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
