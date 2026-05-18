import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkAndIncrementAIRate } from '@/lib/rateLimit'
import { sanitizeText, sanitizeArray } from '@/lib/sanitize'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ExpEntryInput { title: string; company: string; period: string; userDesc: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { data: profileRow } = await supabase
      .from('profiles').select('is_pro').eq('id', user.id).single()
    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await request.json()
    const firstName    = sanitizeText(body.firstName, 100)
    const lastName     = sanitizeText(body.lastName, 100)
    const email        = sanitizeText(body.email, 200)
    const phone        = sanitizeText(body.phone, 50)
    const city         = sanitizeText(body.city, 100)
    const linkedin     = sanitizeText(body.linkedin, 300)
    const position     = sanitizeText(body.position, 200)
    const educationRaw = sanitizeText(body.educationRaw, 3000)
    const skillsRaw    = sanitizeText(body.skillsRaw, 2000)
    const languagesRaw = sanitizeText(body.languagesRaw, 500)

    // Structured experience entries (preferred) — fall back to raw text
    const rawExpEntries: unknown[] = Array.isArray(body.expEntries) ? body.expEntries : []
    const expEntries: ExpEntryInput[] = rawExpEntries.slice(0, 10).map((e: unknown) => {
      const entry = e as Record<string, unknown>
      return {
        title:    sanitizeText(entry.title,    200),
        company:  sanitizeText(entry.company,  200),
        period:   sanitizeText(entry.period,   100),
        userDesc: sanitizeText(entry.userDesc, 2000),
      }
    }).filter(e => e.title || e.company)

    // Server-side validation
    const missing: string[] = []
    if (!firstName || !lastName)   missing.push('Vor- und Nachname')
    if (!email)                    missing.push('E-Mail-Adresse')
    if (!phone)                    missing.push('Telefonnummer')
    if (!city)                     missing.push('Wohnort / Stadt')
    if (!position)                 missing.push('Wunschposition')
    if (expEntries.length === 0 && !educationRaw) missing.push('mindestens eine Berufserfahrung oder Ausbildung')

    if (missing.length > 0) {
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

    const expSection = expEntries.length > 0
      ? expEntries.map((e, i) => `
Stelle ${i + 1}:
  Jobtitel (UNVERÄNDERLICH): "${e.title}"
  Firma (UNVERÄNDERLICH): "${e.company}"
  Zeitraum (UNVERÄNDERLICH): "${e.period}"
  Nutzer-Beschreibung: "${e.userDesc || '(keine Angabe — generiere sinnvolle Bullets basierend auf dem Jobtitel)'}"
`).join('')
      : '(keine Einträge)'

    const prompt = `Du bist ein professioneller CV-Texter für den österreichischen und deutschen Arbeitsmarkt.

DEINE AUFGABE:
Generiere ausschließlich:
1. Eine professionelle Profil-Zusammenfassung (3-4 Sätze)
2. Bullet-Points (Beschreibungen) für jede Stelle — NUR die Tätigkeitsbeschreibung

STRIKTE REGELN:
- KRITISCH: Firmennamen NIEMALS ändern, korrigieren, abkürzen oder ergänzen — exakt buchstabengenau übernehmen
- KRITISCH: Jobtitel NIEMALS ändern — exakt buchstabengenau übernehmen
- NIEMALS Zeiträume in Bullet-Points schreiben — sie stehen bereits separat
- NIEMALS Firmennamen in Bullet-Points nennen — sie stehen bereits separat
- NIEMALS Jobtitel in Bullet-Points nennen — sie stehen bereits separat
- Generiere KEIN Kauderwelsch oder unvollständige Sätze
- Starte jeden Bullet mit einem deutschen Aktionsverb

KANDIDAT:
Name: ${firstName} ${lastName}
Angestrebte Stelle: ${position}
Ort: ${city}

BERUFSERFAHRUNG (UNVERÄNDERLICH):
${expSection}

AUSBILDUNG: ${educationRaw || '–'}
SPRACHEN: ${languagesRaw || '–'}
KENNTNISSE: ${skillsRaw || '–'}

Antworte NUR als gültiges JSON (kein Markdown, keine Code-Blöcke):
{
  "profile": "3-4 Sätze professionelle Zusammenfassung für ${position}",
  "descriptions": [
    "• Bullet 1 für Stelle 1\\n• Bullet 2 für Stelle 1\\n• Bullet 3 für Stelle 1",
    "• Bullet 1 für Stelle 2\\n• Bullet 2 für Stelle 2"
  ],
  "skills": ["Skill1", "Skill2", "Skill3"]
}

WICHTIG: "descriptions" ist ein Array — ein Eintrag pro Stelle, in derselben Reihenfolge wie oben.
Für jede Stelle: 3-5 Bullet-Points, jeder beginnend mit "• " und einem starken Aktionsverb.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
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
