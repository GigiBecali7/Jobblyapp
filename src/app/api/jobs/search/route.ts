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

// ── Synonyms ──────────────────────────────────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  'mechaniker':       ['Kfz-Mechaniker', 'Mechatroniker', 'Kfz Mechatroniker', 'Schlosser'],
  'mechatroniker':    ['Kfz-Mechatroniker', 'Mechaniker', 'Kfz Mechaniker'],
  'elektriker':       ['Elektrotechniker', 'Elektroinstallateur', 'Elektroniker'],
  'schlosser':        ['Metallbauer', 'Mechaniker', 'Schweißer', 'Schlosser'],
  'buchhalter':       ['Buchhaltung', 'Accountant', 'Finanzbuchhaltung', 'Rechnungswesen'],
  'pfleger':          ['Pflegefachkraft', 'Krankenpfleger', 'Altenpfleger', 'DGKP', 'Pflegeassistenz'],
  'verkäufer':        ['Verkauf', 'Vertrieb', 'Sales', 'Kundenberater', 'Handelskaufmann'],
  'fahrer':           ['LKW-Fahrer', 'Kraftfahrer', 'Chauffeur', 'Berufskraftfahrer'],
  'entwickler':       ['Developer', 'Softwareentwickler', 'Programmierer', 'Software Engineer'],
  'developer':        ['Entwickler', 'Softwareentwickler', 'Software Engineer', 'Programmierer'],
  'koch':             ['Küchenchef', 'Chefkoch', 'Sous Chef', 'Küchenhilfe', 'Köchin'],
  'kellner':          ['Servicekraft', 'Restaurantfachmann', 'Servierer', 'Servicemitarbeiter'],
  'ingenieur':        ['Engineer', 'Techniker', 'Konstrukteur', 'Projektingenieur'],
  'arzt':             ['Ärztin', 'Mediziner', 'Facharzt', 'Allgemeinmediziner', 'Assistenzarzt'],
  'lehrer':           ['Pädagoge', 'Lehrperson', 'Trainer', 'Dozent', 'Unterricht'],
  'designer':         ['UX Designer', 'Grafiker', 'Gestalter', 'UI Designer'],
  'marketing':        ['Marketingmanager', 'Online Marketing', 'Digital Marketing', 'SEO'],
  'hr':               ['Human Resources', 'Personalreferent', 'Recruiter', 'Personalwesen'],
  'lagerarbeiter':    ['Lagermitarbeiter', 'Kommissionierer', 'Lagerfachkraft', 'Lager'],
  'reinigungskraft':  ['Reinigung', 'Hausmeister', 'Facility', 'Gebäudereinigung'],
}

function expandKeyword(kw: string): string[] {
  const key = kw.toLowerCase().trim()
  for (const [k, syns] of Object.entries(SYNONYMS)) {
    if (key === k || key.includes(k) || k.includes(key)) {
      return [kw, ...syns]
    }
  }
  return [kw]
}

// ── Austrian city detection ───────────────────────────────────────────────────

const AUSTRIAN_CITIES = [
  'wien', 'vienna', 'graz', 'salzburg', 'linz', 'innsbruck',
  'klagenfurt', 'villach', 'wels', 'steyr', 'bregenz', 'eisenstadt',
  'st. pölten', 'österreich', 'austria', 'at',
]

function isAustrianLocation(loc: string): boolean {
  const lower = loc.toLowerCase()
  return AUSTRIAN_CITIES.some(c => lower.includes(c))
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreJob(
  job: { title: string; description: string; location: string; source: string },
  keyword: string,
  city: string,
  synonyms: string[],
): number {
  const title = job.title.toLowerCase()
  const desc  = job.description.toLowerCase()
  const loc   = (job.location || '').toLowerCase()
  const kw    = keyword.toLowerCase().trim()

  const AUSTRIAN = ['wien', 'vienna', 'graz', 'salzburg', 'linz',
    'innsbruck', 'österreich', 'austria', 'klagenfurt', 'steyr']
  const cityNorm = city.toLowerCase()

  // No keyword → show all jobs, score by location only
  if (!kw) {
    let score = 30
    if (cityNorm && loc.includes(cityNorm)) score += 25
    if (AUSTRIAN.some(a => loc.includes(a))) score += 15
    if (job.source === 'AMS Austria') score += 10
    return Math.min(99, score)
  }

  // Keyword present → filter irrelevant jobs
  const allTerms = [kw, ...synonyms.map(s => s.toLowerCase())].filter(t => t.length > 0)
  const titleMatch = allTerms.some(t => title.includes(t))
  const descMatch  = allTerms.some(t => desc.includes(t))
  if (!titleMatch && !descMatch) return 0

  let score = 20
  if (title.includes(kw))           score += 60
  else if (titleMatch)               score += 35
  else if (desc.includes(kw))       score += 20
  else if (descMatch)                score += 10

  if (cityNorm && loc.includes(cityNorm)) score += 25
  if (AUSTRIAN.some(a => loc.includes(a))) score += 15
  if (job.source === 'AMS Austria') score += 10

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

// ── Dedup helper ──────────────────────────────────────────────────────────────

function dedup(jobs: JobResult[]): JobResult[] {
  const seen = new Set<string>()
  return jobs.filter(job => {
    const key = (job.title + job.company).toLowerCase().replace(/\s/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── API: AMS Austria ──────────────────────────────────────────────────────────

async function fetchAMS(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({
    query: keyword,
    page: '1',
    JOB_OFFER_TYPE: 'SB_WKO',
    PERIOD: 'ALL',
    sortField: '_SCORE',
  })
  // Add additional offer types
  params.append('JOB_OFFER_TYPE', 'IJ')
  params.append('JOB_OFFER_TYPE', 'BA')

  // For Wien specifically, add locationId for better results
  if (location) {
    params.set('location', location)
    if (location.toLowerCase() === 'wien' || location.toLowerCase() === 'vienna') {
      params.set('locationId', 'MUNICIPALITY_90001')
      params.set('vicinity', '100')
    }
  }

  const url = `https://jobs.ams.at/public/emps/jobs?${params}`
  console.log('Fetching AMS:', url)
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`AMS ${res.status}`)
  const data = await res.json()
  console.log('AMS response:', JSON.stringify(data).slice(0, 500))

  // AMS can return { jobs: [...] } or { content: [...] } or { items: [...] } — handle all
  const raw: unknown[] = data.jobs || data.content || data.items || data.stellenangebote || []

  return raw.slice(0, 20).map((j: unknown) => {
    const job = j as Record<string, unknown>
    const employer = (job.employer as Record<string, unknown>) || {}
    const locationObj = (job.location as Record<string, unknown>) || {}
    const id = String(job.id || job.jobId || job.refnr || Math.random())
    return {
      id: `ams_${id}`,
      title: String(job.title || job.jobTitle || job.titel || ''),
      company: String(employer.name || job.company || job.arbeitgeber || ''),
      location: String(locationObj.city || locationObj.ort || job.city || job.ort || location),
      type: String(job.employmentType || job.beschaeftigungsart || 'Vor Ort'),
      salary: String(job.salary || job.gehalt || ''),
      description: String(job.description || job.snippet || job.kurzbeschreibung || '').slice(0, 400),
      url: `https://jobs.ams.at/public/emps/jobs/${id}`,
      postedAt: String(job.publicationDate || job.veroeffentlichungsdatum || ''),
      source: 'AMS Austria',
      matchScore: 0,
      skills: extractSkills(String(job.description || job.snippet || '')),
    }
  })
}

// ── API: Arbeitnow ────────────────────────────────────────────────────────────

async function fetchArbeitnow(keyword: string, location: string): Promise<JobResult[]> {
  const url = new URL('https://www.arbeitnow.com/api/job-board-api')
  if (keyword)  url.searchParams.set('search', keyword)
  if (location) url.searchParams.set('location', normalizeCity(location))

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

// ── API: Jooble ───────────────────────────────────────────────────────────────

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

// ── API: Bundesagentur für Arbeit ─────────────────────────────────────────────

async function fetchBundesagentur(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({ was: keyword, wo: location, page: '1', size: '20', angebotsart: '1' })
  const res = await fetch(
    `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`,
    { headers: { 'X-API-Key': 'jobboerse-jobsuche' }, signal: AbortSignal.timeout(7000) }
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

// ── API: Careerjet ────────────────────────────────────────────────────────────

async function fetchCareerjet(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({
    keywords: keyword, location, affid: '0', locale_code: 'de_AT', pagesize: '20', page: '1',
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

// ── API: Remotive ─────────────────────────────────────────────────────────────

async function fetchRemotive(keyword: string): Promise<JobResult[]> {
  const res = await fetch(
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=10`,
    { signal: AbortSignal.timeout(7000) }
  )
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
    .from('profiles').select('desired_position, city').eq('id', user.id).single()
  const p = profileData as Record<string, unknown> | null

  const effectiveKeyword  = keyword  || String(p?.desired_position || '')
  const effectiveLocation = location || String(p?.city || '')

  // Expand keyword with synonyms; use first 2 synonyms for additional API calls
  const synonyms  = expandKeyword(effectiveKeyword)
  const extraKws  = synonyms.slice(1, 3) // top 2 synonyms

  const isAustria = isAustrianLocation(effectiveLocation)

  // Build fetch tasks ─────────────────────────────────────────────────────────
  // AMS Austria: city-specific + Austria-wide when location is Austrian
  const amsCityTask    = fetchAMS(effectiveKeyword, effectiveLocation)
  const amsAustriaTask = isAustria ? fetchAMS(effectiveKeyword, '') : Promise.resolve([] as JobResult[])

  // Extra synonym searches on AMS (only first synonym, Austria-wide)
  const amsSyn1Task = isAustria && extraKws[0]
    ? fetchAMS(extraKws[0], '')
    : Promise.resolve([] as JobResult[])

  // Jooble: use 'Austria' as location override for AT searches
  const joobleLocation = isAustria ? 'Austria' : effectiveLocation
  const joobleTask     = fetchJooble(effectiveKeyword, joobleLocation)

  // Bundesagentur: Germany only — skip for Austrian searches
  const baTask = isAustria
    ? Promise.resolve([] as JobResult[])
    : fetchBundesagentur(effectiveKeyword, effectiveLocation)

  const careerjetTask = fetchCareerjet(effectiveKeyword, effectiveLocation)
  const remotiveTask  = fetchRemotive(effectiveKeyword)
  const arbeitnowTask = fetchArbeitnow(effectiveKeyword, effectiveLocation)

  const [
    amsCity, amsAustria, amsSyn1,
    jooble, ba, careerjet, remotive, arbeitnow,
  ] = await Promise.allSettled([
    amsCityTask, amsAustriaTask, amsSyn1Task,
    joobleTask, baTask, careerjetTask, remotiveTask, arbeitnowTask,
  ])

  if (amsCity.status    === 'rejected') console.warn('AMS (city) failed:',    amsCity.reason)
  if (amsAustria.status === 'rejected') console.warn('AMS (AT) failed:',      amsAustria.reason)
  if (amsSyn1.status    === 'rejected') console.warn('AMS (syn1) failed:',    amsSyn1.reason)
  if (jooble.status     === 'rejected') console.warn('Jooble failed:',        jooble.reason)
  if (ba.status         === 'rejected') console.warn('Bundesagentur failed:', ba.reason)
  if (careerjet.status  === 'rejected') console.warn('Careerjet failed:',     careerjet.reason)
  if (remotive.status   === 'rejected') console.warn('Remotive failed:',      remotive.reason)
  if (arbeitnow.status  === 'rejected') console.warn('Arbeitnow failed:',     arbeitnow.reason)

  const allJobs: JobResult[] = dedup([
    ...(amsCity.status    === 'fulfilled' ? amsCity.value    : []),
    ...(amsAustria.status === 'fulfilled' ? amsAustria.value : []),
    ...(amsSyn1.status    === 'fulfilled' ? amsSyn1.value    : []),
    ...(jooble.status     === 'fulfilled' ? jooble.value     : []),
    ...(ba.status         === 'fulfilled' ? ba.value         : []),
    ...(careerjet.status  === 'fulfilled' ? careerjet.value  : []),
    ...(remotive.status   === 'fulfilled' ? remotive.value   : []),
    ...(arbeitnow.status  === 'fulfilled' ? arbeitnow.value  : []),
  ])

  // Score with synonyms, filter score=0, sort, cap at 30
  let jobs = allJobs
    .map(j => ({ ...j, matchScore: scoreJob(j, effectiveKeyword, effectiveLocation, synonyms.slice(1)) }))
    .filter(j => !effectiveKeyword.trim() || j.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 30)

  if (workType) {
    jobs = jobs.filter(j => j.type.toLowerCase().includes(workType.toLowerCase()))
  }

  if (jobs.length === 0) {
    return NextResponse.json({ jobs: [], total: 0, message: 'Keine passenden Jobs gefunden.' })
  }

  const sources = [...new Set(jobs.map(j => j.source))].join(', ')
  return NextResponse.json({ jobs, total: jobs.length, source: sources })
}
