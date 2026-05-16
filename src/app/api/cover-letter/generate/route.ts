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
    const { jobTitle, company, userProfile, lang } = body

    const langInstructions: Record<string, string> = {
      de: 'Schreibe auf Deutsch.',
      en: 'Write in English.',
      tr: 'Türkçe yaz.',
      es: 'Escribe en español.',
      fr: 'Écris en français.',
      pl: 'Pisz po polsku.',
    }
    const langNote = langInstructions[lang as string] || langInstructions.de

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
    return NextResponse.json({ error: 'Generation failed', detail: msg }, { status: 500 })
  }
}
