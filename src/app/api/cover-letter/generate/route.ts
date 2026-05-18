import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAndIncrementAIRate } from '@/lib/rateLimit'
import { sanitizeText } from '@/lib/sanitize'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const body = await request.json()
    const jobTitle = sanitizeText(body.jobTitle, 200)
    const company  = sanitizeText(body.company, 200)
    const lang     = sanitizeText(body.lang, 5) || 'de'

    // Only Stelle + Unternehmen are required
    if (!jobTitle || !company) {
      const missing = [
        ...(!jobTitle ? [{ field: 'jobTitle', label: 'Stellenbezeichnung' }] : []),
        ...(!company  ? [{ field: 'company',  label: 'Unternehmen' }] : []),
      ]
      return NextResponse.json({ error: 'Stelle und Unternehmen sind erforderlich.', missing, action: 'fill_form' }, { status: 422 })
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('is_pro, first_name, last_name, city, position, current_position, experience, skills')
      .eq('id', user.id)
      .single()

    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    // Rate limiting
    const rate = await checkAndIncrementAIRate(supabase, user.id, isPro)
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.message, action: 'upgrade' }, { status: 429 })
    }

    const firstName   = sanitizeText(String(profileRow?.first_name || ''), 100)
    const lastName    = sanitizeText(String(profileRow?.last_name || ''), 100)
    const city        = sanitizeText(String(profileRow?.city || ''), 100)
    const currentRole = sanitizeText(String(profileRow?.position || profileRow?.current_position || ''), 200)
    const experience  = sanitizeText(String(profileRow?.experience || ''), 3000)
    const rawSkills   = profileRow?.skills
    const skills      = Array.isArray(rawSkills)
      ? (rawSkills as string[]).slice(0, 10).join(', ')
      : sanitizeText(String(rawSkills || ''), 500)

    const hasName = firstName || lastName
    const bewerberName = hasName ? `${firstName} ${lastName}`.trim() : ''

    const langMap: Record<string, string> = {
      de: 'Deutsch', en: 'Englisch', tr: 'Türkisch', es: 'Spanisch', fr: 'Französisch', pl: 'Polnisch',
    }
    const targetLang = langMap[lang] || 'Deutsch'

    const prompt = `Du bist ein professioneller Bewerbungsschreiber für den österreichischen und deutschen Arbeitsmarkt.
Schreibe auf ${targetLang}.

BEWERBER:
${bewerberName ? `Name: ${bewerberName}` : 'Name: (nicht angegeben — schreibe ohne persönliche Nennung)'}
${city ? `Wohnort: ${city}` : ''}
${currentRole ? `Position / Wunschstelle: ${currentRole}` : ''}
Berufserfahrung: ${experience || '(keine Angabe — schreibe auf Basis der Stellenbezeichnung)'}
Kenntnisse: ${skills || '(keine Angabe)'}

AUSGESCHRIEBENE STELLE:
Stelle: ${jobTitle}
Unternehmen: ${company}

Schreibe ein professionelles Bewerbungsschreiben nach DIN 5008. Halte GENAU diese Struktur:

Absatz 1 (2 Sätze): Direkter Bezug auf die Stelle "${jobTitle}" bei ${company} — konkret, kein Floskeln.
Absatz 2 (3-4 Sätze): Motivation — warum genau ${company}, warum diese Rolle.
Absatz 3 (3-4 Sätze): Qualifikationen — relevante Erfahrung und Kenntnisse, direkt auf "${jobTitle}" bezogen.
Absatz 4 (1-2 Sätze): Einladung zum persönlichen Gespräch.

STRIKTE REGELN:
- KEINE Anrede ("Sehr geehrte...") — wird separat eingefügt
- KEINE Grußformel ("Mit freundlichen Grüßen") — wird separat eingefügt
- NIEMALS Floskeln: "hiermit bewerbe ich mich", "mit großem Interesse", "ich bin überzeugt", "ich bin begeistert"
- Jeder Satz muss sich direkt auf "${jobTitle}" bei "${company}" beziehen
- KRITISCH: Den Unternehmensnamen "${company}" NIEMALS ändern, korrigieren, abkürzen oder ergänzen — verwende ihn buchstabengenau wie angegeben
- Maximal 220 Wörter
- Nur den Fließtext (4 Absätze), keine Formatierung, keine Überschriften, keine Aufzählungen`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map(c => (c.type === 'text' ? c.text : '')).join('').trim()
    if (!text) {
      console.error('cover-letter/generate: empty response from Anthropic')
      return NextResponse.json({ error: 'KI-Generierung vorübergehend nicht verfügbar. Bitte versuche es in ein paar Minuten erneut.' }, { status: 503 })
    }

    return NextResponse.json({ coverLetter: text })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('cover-letter/generate error:', msg)
    if (msg.includes('api_key') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'KI-Generierung vorübergehend nicht verfügbar. Bitte versuche es in ein paar Minuten erneut.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Generierung fehlgeschlagen. Bitte versuche es erneut.' }, { status: 500 })
  }
}
