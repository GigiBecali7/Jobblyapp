import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { firstName, lastName, email, phone, city, linkedin, position, experienceRaw, educationRaw, skillsRaw, languagesRaw, photoUrl } = body

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
    const cvData = JSON.parse(text.replace(/```json|```/g, '').trim())

    return NextResponse.json({ cvData })
  } catch (error) {
    console.error('CV generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
