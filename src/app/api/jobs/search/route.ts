import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Add NEXT_PUBLIC_ADZUNA_APP_ID and ADZUNA_APP_KEY to Vercel environment variables
const ADZUNA_APP_ID = process.env.NEXT_PUBLIC_ADZUNA_APP_ID || ''
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || ''

export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  type: string          // Remote / Hybrid / Vor Ort / Full-time etc.
  salary: string
  description: string
  url: string
  postedAt: string
  source: string
  matchScore: number
  skills: string[]
}

function scoreJob(
  job: { title: string; description: string },
  userPosition: string,
  userIndustry: string,
  userCity: string,
  userWorkModel: string,
): number {
  const haystack = `${job.title} ${job.description}`.toLowerCase()

  // Position + industry keywords (high weight)
  const posWords = userPosition.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const indWords = userIndustry.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const posHits  = posWords.filter(w => haystack.includes(w)).length
  const indHits  = indWords.filter(w => haystack.includes(w)).length

  // City match (medium weight)
  const cityHit = userCity && haystack.includes(userCity.toLowerCase()) ? 1 : 0

  // Work model match (medium weight)
  const workHit = userWorkModel && haystack.includes(userWorkModel.toLowerCase()) ? 1 : 0

  const totalPossible = posWords.length + indWords.length
  if (totalPossible === 0) return 50 // no profile data — neutral score

  const baseScore = Math.round(((posHits * 2 + indHits) / (totalPossible * 2)) * 70)
  const bonus = cityHit * 10 + workHit * 8
  return Math.min(99, Math.max(1, baseScore + bonus))
}

function extractSkills(description: string): string[] {
  const known = ['React', 'TypeScript', 'Python', 'Java', 'SQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Node.js', 'Vue', 'Angular', 'PHP', 'C#', '.NET', 'Go', 'Rust', 'Swift', 'Kotlin', 'Excel',
    'Tableau', 'PowerBI', 'Scrum', 'Agile', 'Jira', 'Salesforce', 'SAP', 'Marketing', 'SEO']
  const desc = description.toLowerCase()
  return known.filter(s => desc.includes(s.toLowerCase())).slice(0, 5)
}

// ── PRIMARY: Arbeitnow API (free, no key needed, EU/DACH focused) ──────────────
async function fetchArbeitnow(keyword: string, location: string): Promise<JobResult[]> {
  const url = new URL('https://www.arbeitnow.com/api/job-board-api')
  if (keyword) url.searchParams.set('search', keyword)
  if (location) url.searchParams.set('location', location)

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Jobbly/1.0' },
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`)
  const json = await res.json()
  const jobs = (json.data || []).slice(0, 20)

  return jobs.map((j: Record<string, unknown>) => {
    const tags = (j.tags as string[] || [])
    const isRemote = String(j.remote || '').toLowerCase() === 'true' || tags.some(t => /remote/i.test(t))
    return {
      id: `an_${j.slug || j.title}`,
      title: String(j.title || ''),
      company: String(j.company_name || ''),
      location: String(j.location || location || 'Österreich/Deutschland'),
      type: isRemote ? 'Remote' : 'Vor Ort',
      salary: '',
      description: String(j.description || '').replace(/<[^>]+>/g, '').slice(0, 400),
      url: String(j.url || ''),
      postedAt: String(j.created_at || ''),
      source: 'Arbeitnow',
      matchScore: 0,
      skills: extractSkills(String(j.description || '')),
    }
  })
}

// ── SECONDARY: Adzuna API (requires API key) ───────────────────────────────────
async function fetchAdzuna(keyword: string, location: string, country = 'at'): Promise<JobResult[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) throw new Error('Adzuna keys not set')
  const q = [keyword, location].filter(Boolean).join(' ')
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&what=${encodeURIComponent(q)}&content-type=application/json`

  const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`Adzuna ${res.status}`)
  const json = await res.json()
  const results = json.results || []

  return results.map((j: Record<string, unknown>) => {
    const sal = j.salary_min && j.salary_max ? `€${Math.round(Number(j.salary_min)/1000)}k–${Math.round(Number(j.salary_max)/1000)}k` : ''
    const loc = (j.location as { display_name?: string })?.display_name || location
    return {
      id: `az_${j.id}`,
      title: String(j.title || ''),
      company: String((j.company as { display_name?: string })?.display_name || ''),
      location: loc,
      type: 'Vor Ort',
      salary: sal,
      description: String(j.description || '').replace(/<[^>]+>/g, '').slice(0, 400),
      url: String(j.redirect_url || ''),
      postedAt: String(j.created || ''),
      source: 'Adzuna',
      matchScore: 0,
      skills: extractSkills(String(j.description || '')),
    }
  })
}

// ── FALLBACK: Remotive API (free, no key, remote jobs only) ───────────────────
async function fetchRemotive(keyword: string): Promise<JobResult[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=20`
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`Remotive ${res.status}`)
  const json = await res.json()
  const jobs = (json.jobs || []).slice(0, 20)

  return jobs.map((j: Record<string, unknown>) => ({
    id: `rm_${j.id}`,
    title: String(j.title || ''),
    company: String(j.company_name || ''),
    location: String(j.candidate_required_location || 'Remote'),
    type: 'Remote',
    salary: String(j.salary || ''),
    description: String(j.description || '').replace(/<[^>]+>/g, '').slice(0, 400),
    url: String(j.url || ''),
    postedAt: String(j.publication_date || ''),
    source: 'Remotive',
    matchScore: 0,
    skills: extractSkills(String(j.description || '')),
  }))
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const keyword  = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const workType = searchParams.get('workType') || ''

  // Fetch user profile for default search + match scoring
  const { data: profileData } = await supabase
    .from('profiles')
    .select('desired_position, industry, city, work_model')
    .eq('id', user.id).single()
  const p = profileData as Record<string, unknown> | null
  const userPosition  = String(p?.desired_position || '')
  const userIndustry  = String(p?.industry || '')
  const userCity      = String(p?.city || '')
  const userWorkModel = String(p?.work_model || '')

  // Use profile position as default keyword when none provided
  const effectiveKeyword  = keyword  || userPosition
  const effectiveLocation = location || userCity

  let jobs: JobResult[] = []
  let source = 'none'

  // Try Arbeitnow first
  try {
    jobs = await fetchArbeitnow(effectiveKeyword, effectiveLocation)
    source = 'arbeitnow'
  } catch (e) {
    console.warn('Arbeitnow failed:', e)

    // Try Adzuna
    try {
      jobs = await fetchAdzuna(effectiveKeyword, effectiveLocation)
      source = 'adzuna'
    } catch (e2) {
      console.warn('Adzuna failed:', e2)

      // Try Remotive
      try {
        jobs = await fetchRemotive(effectiveKeyword)
        source = 'remotive'
      } catch (e3) {
        console.warn('Remotive failed:', e3)
        return NextResponse.json({ error: 'Stellensuche vorübergehend nicht verfügbar', jobs: [], total: 0 })
      }
    }
  }

  // Apply work type filter
  if (workType) {
    jobs = jobs.filter(j => j.type.toLowerCase().includes(workType.toLowerCase()))
  }

  // Calculate match scores using full profile context
  jobs = jobs.map(j => ({ ...j, matchScore: scoreJob(j, userPosition, userIndustry, userCity, userWorkModel) }))

  // Sort by match score descending
  jobs.sort((a, b) => b.matchScore - a.matchScore)

  return NextResponse.json({ jobs, total: jobs.length, source })
}
