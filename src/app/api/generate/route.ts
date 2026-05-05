import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { styleInstructions } from '@/lib/translations'
import type { UserData, WritingStyle, Lang } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const writeLangMap: Record<Lang, string> = {
  de: 'German',
  tr: 'Turkish',
  es: 'Spanish',
  fr: 'French',
  pl: 'Polish',
  en: 'English',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pro
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userData,
      style,
      lang,
      selectedJob,
    }: {
      userData: UserData
      style: WritingStyle
      lang: Lang
      selectedJob: { t: string; c: string } | null
    } = body

    const writeLang = writeLangMap[lang] || 'English'
    const jobPart = selectedJob
      ? `Target job: "${selectedJob.t}" at "${selectedJob.c}".`
      : ''

    const prompt = `You are a professional application writer. Write in ${writeLang}.
RULE: No flattery, no grovelling phrases. Write on equal footing — genuine, direct, human.
PERSON: ${userData.fullname}, ${userData.email || ''}, ${userData.phone || ''}, ${userData.city}
INDUSTRY: ${userData.industry || '–'} | POSITION: ${userData.position || '–'} | EXPERIENCE: ${userData.experience || '–'} | EDUCATION: ${userData.education || '–'}
SKILLS: ${userData.skills || '–'} | LANGUAGES: ${userData.languages || '–'} | LAST ROLE: ${userData.lastjob || '–'}
${jobPart}
WRITING STYLE: ${styleInstructions[style]}
Create:
1. Profile summary (4 sentences, in chosen style)
2. Work experience summary (3–4 sentences)
3. Education summary (1–2 sentences)
4. Skills list (5–8 items)
5. Languages
6. Complete cover letter (~220 words, correct spelling, chosen style)
Reply ONLY as valid JSON, no markdown, no code blocks, no comments:
{"profil":"...","erfahrung":"...","ausbildung":"...","skills":["...","...","..."],"sprachen":"...","anschreiben":"..."}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
    const cvData = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Save application to database
    const { data: application } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        position: userData.position || 'Application',
        company: selectedJob?.c || null,
        template: body.template || 'classic',
        style,
        cv_data: cvData,
        cover_letter: cvData.anschreiben,
      })
      .select()
      .single()

    return NextResponse.json({ cvData, applicationId: application?.id })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
