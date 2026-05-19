import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface JobResult {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  description: string
  url: string
  postedAt: string
  source: string
  matchScore: number
  skills: string[]
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreJob(
  job: { title: string; description: string; location: string },
  keyword: string,
  city: string,
): number {
  const title = job.title.toLowerCase()
  const desc  = job.description.toLowerCase()
  const loc   = (job.location || '').toLowerCase()
  const kw    = keyword.toLowerCase().trim()

  // Filter out irrelevant jobs when a keyword is present
  if (kw && !title.includes(kw) && !desc.includes(kw)) return 0

  let score = 20
  if (kw) {
    if (title.includes(kw)) score += 60
    else if (desc.includes(kw)) score += 20
  }

  const cityNorm = city.toLowerCase()
  if (cityNorm && loc.includes(cityNorm)) score += 20
  if (
    loc.includes('wien') || loc.includes('vienna') ||
    loc.includes('österreich') || loc.includes('austria') ||
    loc.includes('graz') || loc.includes('salzburg') ||
    loc.includes('linz') || loc.includes('innsbruck') ||
    loc.includes('remote')
  ) score += 5

  return Math.min(99, score)
}

function extractSkills(description: string): string[] {
  const known = ['React', 'TypeScript', 'Python', 'Java', 'SQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Node.js', 'Vue', 'Angular', 'PHP', 'C#', '.NET', 'Go', 'Rust', 'Swift', 'Kotlin', 'Excel',
    'Tableau', 'PowerBI', 'Scrum', 'Agile', 'Jira', 'Salesforce', 'SAP', 'Marketing', 'SEO']
  const desc = description.toLowerCase()
  return known.filter(s => desc.includes(s.toLowerCase())).slice(0, 5)
}

// German/Austrian city names → lowercase English for APIs that require it
const CITY_MAP: Record<string, string> = {
  wien: 'vienna', münchen: 'munich', muenchen: 'munich', köln: 'cologne', koeln: 'cologne',
  frankfurt: 'frankfurt', hamburg: 'hamburg', berlin: 'berlin', stuttgart: 'stuttgart',
  düsseldorf: 'dusseldorf', duesseldorf: 'dusseldorf', hannover: 'hannover',
  nürnberg: 'nuremberg', nuernberg: 'nuremberg', graz: 'graz', salzburg: 'salzburg',
  innsbruck: 'innsbruck', linz: 'linz', klagenfurt: 'klagenfurt', bregenz: 'bregenz',
  zürich: 'zurich', zuerich: 'zurich', basel: 'basel', bern: 'bern', genf: 'geneva',
}

function normalizeCity(city: string): string {
  const lower = city.toLowerCase().trim()
  return CITY_MAP[lower] || lower
}

// ── API 1: Arbeitnow ──────────────────────────────────────────────────────────

async function fetchArbeitnow(keyword: string, location: string): Promise<JobResult[]> {
  const url = new URL('https://www.arbeitnow.com/api/job-board-api')
  if (keyword)  url.searchParams.set('search', keyword)
  if (location) url.searchParams.set('location', normalizeCity(location))

  console.log('Fetching Arbeitnow:', url.toString())
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Jobbly/1.0' },
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`)
  const json = await res.json()

  return (json.data || []).slice(0, 20).map((j: Record<string, unknown>) => {
    const tags = (j.tags as string[] || [])
    const isRemote = String(j.remote || '').toLowerCase() === 'true' || tags.some((t: string) => /remote/i.test(t))
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

// ── API 2: Jooble (140+ DACH job boards) ─────────────────────────────────────

async function fetchJooble(keyword: string, location: string): Promise<JobResult[]> {
  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) throw new Error('Jooble key not set')

  const res = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: keyword, location, page: '1', resultonpage: '20' }),
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`Jooble ${res.status}`)
  const json = await res.json()

  return (json.jobs || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id: `jooble_${j.id}`,
    title: String(j.title || ''),
    company: String(j.company || ''),
    location: String(j.location || location),
    type: String(j.type || 'Vor Ort'),
    salary: String(j.salary || ''),
    description: String(j.snippet || '').replace(/<[^>]+>/g, '').slice(0, 400),
    url: String(j.link || ''),
    postedAt: String(j.updated || ''),
    source: 'Jooble',
    matchScore: 0,
    skills: extractSkills(String(j.snippet || '')),
  }))
}

// ── API 3: Bundesagentur für Arbeit (Germany, no key needed) ─────────────────

async function fetchBundesagentur(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({
    was: keyword,
    wo: location,
    page: '1',
    size: '20',
    angebotsart: '1',
  })

  console.log('Fetching Bundesagentur:', `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`)
  const res = await fetch(
    `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`,
    {
      headers: { 'X-API-Key': 'jobboerse-jobsuche' },
      signal: AbortSignal.timeout(7000),
    }
  )
  if (!res.ok) throw new Error(`Bundesagentur ${res.status}`)
  const json = await res.json()

  return (json.stellenangebote || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id: `ba_${j.refnr}`,
    title: String(j.titel || ''),
    company: String(j.arbeitgeber || ''),
    location: String((j.arbeitsort as Record<string, unknown>)?.ort || location),
    type: 'Vor Ort',
    salary: '',
    description: String(j.kurzbeschreibung || '').slice(0, 400),
    url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${j.refnr}`,
    postedAt: String(j.eintrittsdatum || ''),
    source: 'Bundesagentur für Arbeit',
    matchScore: 0,
    skills: extractSkills(String(j.kurzbeschreibung || '')),
  }))
}

// ── API 4: Careerjet (DACH aggregator, no key needed) ─────────────────────────

async function fetchCareerjet(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({
    keywords: keyword,
    location,
    affid: '0',
    locale_code: 'de_AT',
    pagesize: '20',
    page: '1',
  })

  const res = await fetch(`https://public.api.careerjet.net/search?${params}`, {
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`Careerjet ${res.status}`)
  const json = await res.json()

  return (json.jobs || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id: `cj_${j.id}`,
    title: String(j.title || ''),
    company: String(j.company || ''),
    location: String(j.locations || location),
    type: String(j.job_type || 'Vor Ort'),
    salary: String(j.salary || ''),
    description: String(j.description || '').slice(0, 400),
    url: String(j.url || ''),
    postedAt: String(j.date || ''),
    source: 'Careerjet',
    matchScore: 0,
    skills: extractSkills(String(j.description || '')),
  }))
}

// ── API 5: Remotive (remote jobs, no key needed) ──────────────────────────────

async function fetchRemotive(keyword: string): Promise<JobResult[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=10`
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) })
  if (!res.ok) throw new Error(`Remotive ${res.status}`)
  const json = await res.json()

  return (json.jobs || []).slice(0, 10).map((j: Record<string, unknown>) => ({
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

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const keyword  = searchParams.get('q') || ''
  const location = searchParams.get('location') || ''
  const workType = searchParams.get('workType') || ''

  // Fall back to profile data when no explicit params provided
  const { data: profileData } = await supabase
    .from('profiles')
    .select('desired_position, city')
    .eq('id', user.id).single()
  const p = profileData as Record<string, unknown> | null

  const effectiveKeyword  = keyword  || String(p?.desired_position || '')
  const effectiveLocation = location || String(p?.city || '')

  // Fetch all sources in parallel — a failed source never crashes the request
  const [arbeitnow, jooble, bundesagentur, careerjet, remotive] = await Promise.allSettled([
    fetchArbeitnow(effectiveKeyword, effectiveLocation),
    fetchJooble(effectiveKeyword, effectiveLocation),
    fetchBundesagentur(effectiveKeyword, effectiveLocation),
    fetchCareerjet(effectiveKeyword, effectiveLocation),
    fetchRemotive(effectiveKeyword),
  ])

  if (arbeitnow.status === 'rejected')     console.warn('Arbeitnow failed:', arbeitnow.reason)
  if (jooble.status === 'rejected')        console.warn('Jooble failed:', jooble.reason)
  if (bundesagentur.status === 'rejected') console.warn('Bundesagentur failed:', bundesagentur.reason)
  if (careerjet.status === 'rejected')     console.warn('Careerjet failed:', careerjet.reason)
  if (remotive.status === 'rejected')      console.warn('Remotive failed:', remotive.reason)

  const allJobs: JobResult[] = [
    ...(arbeitnow.status     === 'fulfilled' ? arbeitnow.value     : []),
    ...(jooble.status        === 'fulfilled' ? jooble.value        : []),
    ...(bundesagentur.status === 'fulfilled' ? bundesagentur.value : []),
    ...(careerjet.status     === 'fulfilled' ? careerjet.value     : []),
    ...(remotive.status      === 'fulfilled' ? remotive.value      : []),
  ]

  // Deduplicate by normalised title+company key
  const seen = new Set<string>()
  const unique = allJobs.filter(job => {
    const key = (job.title + job.company).toLowerCase().replace(/\s/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Score, filter irrelevant, sort, cap at 30
  let jobs = unique
    .map(j => ({ ...j, matchScore: scoreJob(j, effectiveKeyword, effectiveLocation) }))
    .filter(j => j.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 30)

  // Work type filter (applied after scoring so we still deduplicate first)
  if (workType) {
    jobs = jobs.filter(j => j.type.toLowerCase().includes(workType.toLowerCase()))
  }

  if (jobs.length === 0) {
    return NextResponse.json({ jobs: [], total: 0, message: 'Keine passenden Jobs gefunden.' })
  }

  const sources = [...new Set(jobs.map(j => j.source))].join(', ')
  return NextResponse.json({ jobs, total: jobs.length, source: sources })
}
