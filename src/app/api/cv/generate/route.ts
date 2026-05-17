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
      .from('profiles').select('is_pro').eq('id', user.id).single()
    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await request.json()
    const firstName     = sanitizeText(body.firstName, 100)
    const lastName      = sanitizeText(body.lastName, 100)
    const email         = sanitizeText(body.email, 200)
    const phone         = sanitizeText(body.phone, 50)
    const city          = sanitizeText(body.city, 100)
    const linkedin      = sanitizeText(body.linkedin, 300)
    const position      = sanitizeText(body.position, 200)
    const experienceRaw = sanitizeText(body.experienceRaw, 5000)
    const educationRaw  = sanitizeText(body.educationRaw, 3000)
    const skillsRaw     = sanitizeText(body.skillsRaw, 2000)
    const languagesRaw  = sanitizeText(body.languagesRaw, 500)

    // Server-side validation
    const missing: string[] = []
    if (!firstName || !lastName)              missing.push('Vor- und Nachname')
    if (!email)                               missing.push('E-Mail-Adresse')
    if (!phone)                               missing.push('Telefonnummer')
    if (!city)                               missing.push('Wohnort / Stadt')
    if (!position)                            missing.push('Wunschposition')
    if (!experienceRaw && !educationRaw)      missing.push('mindestens eine Berufserfahrung oder Ausbildung')

    if (missing.length > 0) {
      console.warn('cv/generate: validation failed for user', user.id, missing)
      return NextResponse.json({
        error: `Dein Profil ist noch unvollständig. Für einen professionellen Lebenslauf benötigst du: ${missing.join(', ')}.`,
        missing,
        action: 'complete_profile',
      }, { status: 422 })
    }

    // Rate limiting
    const rate = await checkAndIncrementAIRate(supabase, user.id, isPro)
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.message, action: 'upgrade' }, { status: 429 })
    }

    const prompt = `Du bist ein professioneller Karriereberater und CV-Experte für den österreichischen und deutschen Arbeitsmarkt.

KANDIDAT:
Name: ${firstName} ${lastName}
E-Mail: ${email}
Telefon: ${phone}
Ort: ${city}
LinkedIn: ${linkedin || '–'}
Angestrebte Stelle: ${position}

BERUFSERFAHRUNG (Rohdaten vom Nutzer):
${experienceRaw || '–'}

AUSBILDUNG (Rohdaten):
${educationRaw || '–'}

KENNTNISSE (Rohdaten):
${skillsRaw || '–'}

SPRACHEN:
${languagesRaw || '–'}

Erstelle professionellen Lebenslauf-Inhalt. STRENGE REGELN für die Beschreibungen:
- Jede Beschreibung besteht aus 3-5 Bulletpoints
- Jeder Bulletpoint startet mit einem starken deutschen Aktionsverb: Entwickelte, Leitete, Optimierte, Implementierte, Koordinierte, Steigerte, Reduzierte, Konzipierte, Etablierte, Verantwortete
- NIEMALS Firmenname, Job-Titel oder Zeitraum in der Beschreibung wiederholen — diese sind bereits als separate Felder vorhanden
- Quantifiziere wo möglich: "Steigerte Effizienz um 30%", "Leitete Team von 5 Personen"
- Kein Passiv, keine Floskeln, keine generischen Phrasen
- Profile/Zusammenfassung: 3-4 Sätze, spezifisch auf "${position}" zugeschnitten, keine generischen Phrasen
- Skills: maximal 8-10 relevante Kenntnisse, keine Duplikate

Antworte NUR als gültiges JSON ohne Markdown oder Code-Blöcke:
{"profile":"3-4 Sätze professionelle Zusammenfassung","experience":"aufbereiteter Erfahrungstext mit Bullets pro Stelle (Format: Bulletpoint pro Zeile, beginnend mit •)","education":"aufbereiteter Ausbildungstext","skills":["Skill1","Skill2","Skill3"],"languages":"Sprachkenntnisse"}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map(c => (c.type === 'text' ? c.text : '')).join('')
    const cvData = JSON.parse(text.replace(/```json\s*|```/g, '').trim())

    return NextResponse.json({ cvData })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('cv/generate error:', msg)
    if (msg.includes('api_key') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'KI-Generierung vorübergehend nicht verfügbar. Bitte versuche es in ein paar Minuten erneut.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Generierung fehlgeschlagen. Bitte versuche es erneut.' }, { status: 500 })
  }
}
