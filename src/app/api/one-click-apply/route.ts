import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { UserData } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userData, jobTitle, jobCompany, jobDescription, lang }: {
      userData: UserData
      jobTitle: string
      jobCompany: string
      jobDescription?: string
      lang: string
    } = await request.json()

    const langMap: Record<string, string> = { de: 'German', tr: 'Turkish', es: 'Spanish', fr: 'French', pl: 'Polish', en: 'English' }
    const writeLang = langMap[lang] || 'English'

    const prompt = `You are a professional application writer. Write in ${writeLang}.
RULE: No flattery, no hollow phrases. Genuine, direct, on equal footing.
PERSON: ${userData.fullname}, ${userData.city || ''}
POSITION APPLYING TO: "${jobTitle}" at "${jobCompany}"
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 800)}` : ''}
PERSON'S PROFILE: ${userData.industry || ''} | ${userData.experience || ''} | Skills: ${userData.skills || ''} | Last role: ${userData.lastjob || ''}

Write a cover letter (~220 words) that is SPECIFICALLY tailored to this exact job posting and company.
Reference the company and role by name. Match the language of the job description.
Reply with ONLY the cover letter text, no JSON, no labels.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const coverLetter = message.content.map(c => c.type === 'text' ? c.text : '').join('').trim()
    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('One-click apply error:', error)
    return NextResponse.json({ error: 'Failed to adapt cover letter' }, { status: 500 })
  }
}
