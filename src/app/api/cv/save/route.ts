import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FREE_CVS = 1
const MAX_PRO_CVS = 5
const MAX_FREE_EDITS = 5

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profileRow } = await supabase
      .from('profiles').select('is_pro').eq('id', user.id).single()
    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await req.json()
    const { id, title, design, content } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titel erforderlich' }, { status: 422 })
    if (!design) return NextResponse.json({ error: 'Design erforderlich' }, { status: 422 })
    if (!content) return NextResponse.json({ error: 'Inhalt erforderlich' }, { status: 422 })

    if (id) {
      // Update existing CV — check edit limit (free only)
      const { data: existing, error: fetchErr } = await supabase
        .from('cvs').select('id, edit_count, user_id').eq('id', id).eq('user_id', user.id).single()
      if (fetchErr || !existing) return NextResponse.json({ error: 'CV nicht gefunden' }, { status: 404 })

      if (!isPro && existing.edit_count >= MAX_FREE_EDITS) {
        return NextResponse.json({
          error: `Free-Plan: max. ${MAX_FREE_EDITS} Bearbeitungen pro CV. Upgrade zu Pro!`,
          limitReached: true,
          editCount: existing.edit_count,
          maxEdits: MAX_FREE_EDITS,
        }, { status: 403 })
      }

      const { data: updated, error: updateErr } = await supabase
        .from('cvs').update({
          title: title.trim(), design, content,
          edit_count: existing.edit_count + 1,
          updated_at: new Date().toISOString(),
        }).eq('id', id).eq('user_id', user.id).select().single()

      if (updateErr) throw updateErr
      return NextResponse.json({ cv: updated })
    } else {
      // Create new CV — check count limit
      const { count } = await supabase
        .from('cvs').select('id', { count: 'exact', head: true }).eq('user_id', user.id)

      const maxCvs = isPro ? MAX_PRO_CVS : MAX_FREE_CVS
      if ((count ?? 0) >= maxCvs) {
        const msg = isPro
          ? `Du hast das Maximum von ${MAX_PRO_CVS} Lebensläufen erreicht. Lösche einen um einen neuen zu erstellen.`
          : `Free-Plan: max. ${MAX_FREE_CVS} Lebenslauf. Upgrade zu Pro!`
        return NextResponse.json({ error: msg, limitReached: true }, { status: 403 })
      }

      const { data: created, error: insertErr } = await supabase
        .from('cvs').insert({
          user_id: user.id, title: title.trim(), design, content, edit_count: 0,
        }).select().single()

      if (insertErr) throw insertErr
      return NextResponse.json({ cv: created })
    }
  } catch (e) {
    console.error('cv/save error:', e)
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 })
  }
}
