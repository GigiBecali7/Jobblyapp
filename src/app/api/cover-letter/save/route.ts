import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FREE_LETTERS = 1
const MAX_PRO_LETTERS  = 5
const MAX_FREE_EDITS   = 5

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { data: profileRow } = await supabase
      .from('profiles').select('is_pro').eq('id', user.id).single()
    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await req.json()
    const { id, jobTitle, company, design, content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Inhalt darf nicht leer sein.' }, { status: 422 })
    }

    if (id) {
      // Update existing
      const { data: existing, error: fetchErr } = await supabase
        .from('cover_letters')
        .select('id, edit_count, user_id')
        .eq('id', id).eq('user_id', user.id).single()

      if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Anschreiben nicht gefunden.' }, { status: 404 })
      }

      if (!isPro && existing.edit_count >= MAX_FREE_EDITS) {
        return NextResponse.json({
          error: `Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen. Upgrade zu Pro!`,
          limitReached: true,
        }, { status: 403 })
      }

      const newCount = existing.edit_count + 1
      const { data: updated, error: updateErr } = await supabase
        .from('cover_letters')
        .update({
          content, design: design || 'NordicMinimal',
          job_title: jobTitle || '', company: company || '',
          edit_count: newCount, updated_at: new Date().toISOString(),
        })
        .eq('id', id).eq('user_id', user.id)
        .select().single()

      if (updateErr) {
        console.error('cover_letters update error:', updateErr)
        return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
      }

      return NextResponse.json({ letter: updated, editCount: newCount })
    }

    // Insert new
    const { count } = await supabase
      .from('cover_letters').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const total = count ?? 0
    const maxLetters = isPro ? MAX_PRO_LETTERS : MAX_FREE_LETTERS
    if (total >= maxLetters) {
      return NextResponse.json({
        error: isPro
          ? `Du hast das Maximum von ${MAX_PRO_LETTERS} Anschreiben erreicht.`
          : `Free-Plan: max. ${MAX_FREE_LETTERS} Anschreiben. Upgrade zu Pro!`,
        limitReached: true,
      }, { status: 403 })
    }

    const { data: inserted, error: insertErr } = await supabase
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
      console.error('cover_letters insert error:', insertErr)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ letter: inserted, editCount: 0 })
  } catch (err) {
    console.error('cover-letter/save route error:', err)
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 })
  }
}
