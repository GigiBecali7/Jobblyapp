import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Clearly offensive terms — kept tight to avoid false positives on real jobs
const BLOCKLIST = [
  'fuck', 'shit', 'cunt', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'nigger', 'nigga', 'faggot', 'retard', 'spastic',
  'porn', 'pornography', 'escort', 'prostitut', 'onlyfans', 'sex worker', 'stripper',
  'cocaine', 'heroin', 'methamphetamine', 'crystal meth', 'drug dealer', 'drug lord',
  'hitman', 'assassin', 'murder', 'kill people', 'terrorism', 'terrorist',
  'hacker', 'cracker', 'ransomware', 'malware',
]

// Detects random keyboard mashing or gibberish
function isGibberish(text: string): boolean {
  if (!text || text.trim().length < 3) return false
  const cleaned = text.trim().toLowerCase()

  // Long consecutive consonant clusters (5+ without a vowel)
  if (/[^aeiou\s\d,.()\-]{5,}/i.test(cleaned)) return true

  // Repeating same character 4+ times
  if (/(.)\1{3,}/.test(cleaned)) return true

  // Very high ratio of non-alpha chars (e.g. "asdf!!!???###")
  const alphaCount = (cleaned.match(/[a-z]/g) || []).length
  if (alphaCount > 0 && alphaCount / cleaned.replace(/\s/g, '').length < 0.4) return true

  return false
}

function containsBlocklisted(fields: string[]): string | null {
  const combined = fields.join(' ').toLowerCase()
  for (const word of BLOCKLIST) {
    // Word-boundary match to avoid false positives (e.g. "classic" matching "ass")
    const regex = new RegExp(`(?<![a-z])${word.replace(/\s+/g, '\\s+')}(?![a-z])`, 'i')
    if (regex.test(combined)) return word
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { position, skills, lastjob } = await request.json()

    const freeTextFields = [position, skills, lastjob].filter(Boolean) as string[]

    // 1. Blocklist check
    const blocked = containsBlocklisted(freeTextFields)
    if (blocked) {
      return NextResponse.json({
        valid: false,
        reason: 'Your input contains inappropriate content. Please use professional language.',
      })
    }

    // 2. Gibberish check on the most important fields
    for (const field of [position, skills]) {
      if (field && isGibberish(field)) {
        return NextResponse.json({
          valid: false,
          reason: 'Some fields appear to contain random characters. Please enter real job information.',
        })
      }
    }

    // 3. AI check — fast, single call with claude-haiku
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ valid: true })
    }

    const checkText = [
      position && `Position: ${position}`,
      skills && `Skills: ${skills}`,
    ].filter(Boolean).join('\n')

    if (!checkText.trim()) {
      return NextResponse.json({ valid: true })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are a lenient validator for a CV builder. Determine if the following CV inputs are job-related.
Accept all real jobs (no matter how unusual), creative professions, trades, and anything plausibly professional.
Only reject: clearly nonsensical gibberish, explicit content, or content with no conceivable connection to employment.

${checkText}

Reply with ONLY a JSON object: {"valid": true} or {"valid": false, "reason": "one short sentence"}`,
      }],
    })

    const raw = msg.content.map(c => c.type === 'text' ? c.text : '').join('').trim()
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Validation error:', err)
    // Fail open — don't block users if validation itself errors
    return NextResponse.json({ valid: true })
  }
}
