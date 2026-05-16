import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAndIncrementAIRate } from '@/lib/rateLimit'
import { sanitizeText } from '@/lib/sanitize'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('is_pro, first_name, last_name, position, current_position')
      .eq('id', user.id)
      .single()

    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await request.json()
    const jobTitle    = sanitizeText(body.jobTitle, 200)
    const company     = sanitizeText(body.company, 200)
    const userProfile = sanitizeText(body.userProfile, 3000)
    const lang        = sanitizeText(body.lang, 5)

    // Server-side validation — block AI call if required fields are missing
    const missing: string[] = []
    if (!jobTitle)  missing.push('Job-Titel')
    if (!company)   missing.push('Unternehmen')
    if (!profileRow?.first_name || !profileRow?.last_name) missing.push('Vor- und Nachname im Profil')
    if (!profileRow?.position && !profileRow?.current_position) missing.push('Wunschposition oder aktueller Job-Titel')

    if (missing.length > 0) {
      return NextResponse.json({
        error: `Für das Anschreiben fehlen noch: ${missing.join(', ')}.`,
        missing,
        action: 'complete_profile',
      }, { status: 422 })
    }

    // Rate limiting
    const rate = await checkAndIncrementAIRate(supabase, user.id, isPro)
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.message, action: 'upgrade' }, { status: 429 })
    }

    const langInstructions: Record<string, string> = {
      de: 'Schreibe auf Deutsch.',
      en: 'Write in English.',
      tr: 'Türkçe yaz.',
      es: 'Escribe en español.',
      fr: 'Écris en français.',
      pl: 'Pisz po polsku.',
    }
    const langNote = langInstructions[lang] || langInstructions.de

    const prompt = `Du bist ein professioneller Bewerbungsschreiber. ${langNote}

Stelle: ${jobTitle}
Unternehmen: ${company}
Bewerber-Profil: ${userProfile}

Schreibe 3-4 professionelle Absätze. Kein Kriechertum, keine Floskeln. Direkt, authentisch, überzeugend.
Antworte NUR mit dem Anschreiben-Text, ohne Betreff, Anrede oder Grußformel.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')

    return NextResponse.json({ coverLetter: text.trim() })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Cover letter generate error:', msg)
    return NextResponse.json({ error: 'Generierung fehlgeschlagen. Bitte versuche es erneut.' }, { status: 500 })
  }
}
