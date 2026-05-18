import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await req.json()
    const { photoUrl } = body
    // photoUrl can be null (delete) or a string (save)
    if (photoUrl !== null && (typeof photoUrl !== 'string' || !photoUrl)) {
      return NextResponse.json({ error: 'photoUrl ungültig' }, { status: 422 })
    }

    // Try service role first (bypasses RLS), fall back to anon client with session
    let dbErr: unknown = null

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // @ts-ignore — service client is untyped
      const db = createServiceClient() as any
      const result = await db
        .from('profiles')
        .update({ photo_url: photoUrl, avatar_url: photoUrl })
        .eq('id', user.id)
      dbErr = result.error
    } else {
      // Fallback: anon client (works when RLS allows user to update own row)
      const { error } = await authClient
        .from('profiles')
        .update({ photo_url: photoUrl, avatar_url: photoUrl } as Record<string, unknown>)
        .eq('id', user.id)
      dbErr = error
    }

    if (dbErr) {
      const e = dbErr as { message?: string; code?: string }
      console.error('profile/save-photo DB error:', JSON.stringify(dbErr, null, 2))
      return NextResponse.json({
        error: 'Foto konnte nicht gespeichert werden.',
        details: e?.message,
        code: e?.code,
      }, { status: 500 })
    }

    console.log(`profile/save-photo ok for user ${user.id}: ${String(photoUrl).slice(0, 60)}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('profile/save-photo error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
