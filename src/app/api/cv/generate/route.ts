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
      .select('is_pro')
      .eq('id', user.id)
      .single()

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
    const photoUrl      = sanitizeText(body.photoUrl, 500)

    // Server-side validation — block AI call if required fields are missing
    const missing: string[] = []
    if (!firstName || !lastName) missing.push('Vor- und Nachname')
    if (!city)                   missing.push('Wohnort / Stadt')
    if (!position)               missing.push('Wunschposition')
    if (!experienceRaw && !educationRaw) missing.push('mindestens eine Berufserfahrung oder Ausbildung')

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

    const prompt = `Du bist ein professioneller Karriereberater. Erstelle auf Basis der folgenden Daten einen vollständigen, professionellen deutschen Lebenslauf.

Name: ${firstName} ${lastName}
E-Mail: ${email}
Telefon: ${phone}
Ort: ${city}
LinkedIn: ${linkedin || '–'}
Angestrebte Stelle: ${position}
Berufserfahrung (Rohtext): ${experienceRaw || '–'}
Ausbildung (Rohtext): ${educationRaw || '–'}
Kenntnisse (Rohtext): ${skillsRaw || '–'}
Sprachen: ${languagesRaw || '–'}

Erstelle professionelle, präzise Texte. Antworte NUR als gültiges JSON ohne Markdown oder Code-Blöcke:
{"profile":"...","experience":"...","education":"...","skills":["...","...","..."],"languages":"..."}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
    const cvData = JSON.parse(text.replace(/```json|```/g, '').trim())

    return NextResponse.json({ cvData })
  } catch (error) {
    console.error('CV generate error:', error)
    return NextResponse.json({ error: 'Generierung fehlgeschlagen. Bitte versuche es erneut.' }, { status: 500 })
  }
}
