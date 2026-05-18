import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const MAX_FREE_LETTERS = 1
const MAX_PRO_LETTERS  = 5
const MAX_FREE_EDITS   = 5

type CoverLetterRow = {
  id: string
  user_id: string
  job_title: string
  company: string
  design: string
  content: string
  edit_count: number
  updated_at: string
  created_at: string
}

export async function POST(req: NextRequest) {
  try {
    // Auth via anon client (reads session cookie)
    const authClient = await createClient()
    const { data: { user }, error: authErr } = await authClient.auth.getUser()
    if (authErr || !user) {
      console.error('cover-letter/save auth error:', authErr)
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // All DB operations via service role (bypasses RLS, auth already verified above)
    // @ts-ignore — service client is untyped; cast as needed per field
    const db = createServiceClient() as any

    const { data: profileRow } = await db
      .from('profiles').select('is_pro').eq('id', user.id).single()
    const isPro = (profileRow as { is_pro: boolean } | null)?.is_pro === true
      || user.email === 'drthinkbyte@gmail.com'

    const body = await req.json()
    const { id, jobTitle, company, design, content } = body

    console.log('cover-letter/save attempt:', {
      userId: user.id,
      id: id || null,
      jobTitle,
      company,
      contentLength: content?.length,
      isPro,
    })

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Inhalt darf nicht leer sein.' }, { status: 422 })
    }

    if (id) {
      // Update existing
      const { data: existingRaw, error: fetchErr } = await db
        .from('cover_letters')
        .select('id, edit_count, user_id')
        .eq('id', id).eq('user_id', user.id).single()

      const existing = existingRaw as Pick<CoverLetterRow, 'id' | 'edit_count' | 'user_id'> | null

      if (fetchErr || !existing) {
        console.error('cover-letter/save fetch existing error:', JSON.stringify(fetchErr, null, 2))
        return NextResponse.json({ error: 'Anschreiben nicht gefunden.' }, { status: 404 })
      }

      if (!isPro && existing.edit_count >= MAX_FREE_EDITS) {
        return NextResponse.json({
          error: `Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen. Upgrade zu Pro!`,
          limitReached: true,
        }, { status: 403 })
      }

      const newCount = existing.edit_count + 1
      const { data: updatedRaw, error: updateErr } = await db
        .from('cover_letters')
        .update({
          content, design: design || 'NordicMinimal',
          job_title: jobTitle || '', company: company || '',
          edit_count: newCount, updated_at: new Date().toISOString(),
        })
        .eq('id', id).eq('user_id', user.id)
        .select().single()

      if (updateErr) {
        console.error('cover-letter/save update error:', JSON.stringify(updateErr, null, 2))
        return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
      }

      return NextResponse.json({ letter: updatedRaw as CoverLetterRow, editCount: newCount })
    }

    // Insert new — count existing letters
    const { count } = await db
      .from('cover_letters').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const total = (count as number | null) ?? 0
    const maxLetters = isPro ? MAX_PRO_LETTERS : MAX_FREE_LETTERS
    if (total >= maxLetters) {
      return NextResponse.json({
        error: isPro
          ? `Du hast das Maximum von ${MAX_PRO_LETTERS} Anschreiben erreicht.`
          : `Free-Plan: max. ${MAX_FREE_LETTERS} Anschreiben. Upgrade zu Pro!`,
        limitReached: true,
      }, { status: 403 })
    }

    const { data: insertedRaw, error: insertErr } = await db
      .from('cover_letters')
      .insert({
        user_id: user.id,
        job_title: jobTitle || '',
        company: company || '',
        design: design || 'NordicMinimal',
        content,
        edit_count: 0,
      })
      .select().single()

    if (insertErr) {
      console.error('cover-letter/save insert error:', JSON.stringify(insertErr, null, 2))
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ letter: insertedRaw as CoverLetterRow, editCount: 0 })
  } catch (err) {
    console.error('cover-letter/save route error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
