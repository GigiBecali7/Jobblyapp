import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const category = sanitizeText(body.category, 100)
    const message  = sanitizeText(body.message,  2000)
    const email    = sanitizeText(body.email,     200)
    const pageUrl  = sanitizeText(body.pageUrl,   500)

    if (!message.trim()) {
      return NextResponse.json({ error: 'Nachricht darf nicht leer sein.' }, { status: 422 })
    }

    // Save to DB (anon-allowed via RLS INSERT policy)
    const { error: dbErr } = await supabase.from('feedback').insert({
      user_id:    user?.id ?? null,
      category:   category || null,
      message,
      email:      email || null,
      page_url:   pageUrl || null,
      user_agent: req.headers.get('user-agent') || null,
    })
    if (dbErr) console.error('feedback insert error:', dbErr)

    // Send email via Resend (best-effort — never block on failure)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        const ts = new Date().toLocaleString('de-AT', { timeZone: 'Europe/Vienna' })
        await resend.emails.send({
          from:    'Jobbly Feedback <hello@jobblyapp.com>',
          to:      'hello@jobblyapp.com',
          subject: `Neues Jobbly Feedback: ${category || 'Allgemein'}`,
          html: `
<p><strong>Kategorie:</strong> ${category || '—'}</p>
<p><strong>Nachricht:</strong></p>
<blockquote style="border-left:3px solid #1B2E6B;padding-left:12px;margin:8px 0;">${message.replace(/\n/g, '<br>')}</blockquote>
<p><strong>E-Mail des Nutzers:</strong> ${email || (user?.email ?? '—')}</p>
<p><strong>Seite:</strong> ${pageUrl || '—'}</p>
<p><strong>Zeitpunkt:</strong> ${ts}</p>
<p><strong>User-ID:</strong> ${user?.id ?? 'anonym'}</p>`,
        })
      } catch (emailErr) {
        console.error('feedback email error (non-fatal):', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('feedback route error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
