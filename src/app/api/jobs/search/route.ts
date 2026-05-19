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
  'mechaniker':      ['Kfz-Mechaniker', 'Mechatroniker', 'Kfz Mechatroniker', 'Schlosser', 'KFZ'],
  'mechatroniker':   ['Kfz-Mechatroniker', 'Mechaniker', 'Kfz Mechaniker', 'KFZ'],
  'elektriker':      ['Elektrotechniker', 'Elektroinstallateur', 'Elektroniker'],
  'schlosser':       ['Metallbauer', 'Mechaniker', 'Schweißer'],
  'buchhalter':      ['Buchhaltung', 'Accountant', 'Finanzbuchhaltung', 'Rechnungswesen'],
  'pfleger':         ['Pflegefachkraft', 'Krankenpfleger', 'Altenpfleger', 'DGKP', 'Pflegeassistenz'],
  'verkäufer':       ['Verkauf', 'Vertrieb', 'Sales', 'Kundenberater', 'Handelskaufmann'],
  'fahrer':          ['LKW-Fahrer', 'Kraftfahrer', 'Chauffeur', 'Berufskraftfahrer'],
  'entwickler':      ['Developer', 'Softwareentwickler', 'Programmierer', 'Software Engineer'],
  'developer':       ['Entwickler', 'Softwareentwickler', 'Software Engineer', 'Programmierer'],
  'koch':            ['Küchenchef', 'Chefkoch', 'Sous Chef', 'Küchenhilfe', 'Köchin'],
  'kellner':         ['Servicekraft', 'Restaurantfachmann', 'Servierer', 'Servicemitarbeiter'],
  'ingenieur':       ['Engineer', 'Techniker', 'Konstrukteur', 'Projektingenieur'],
  'arzt':            ['Ärztin', 'Mediziner', 'Facharzt', 'Allgemeinmediziner', 'Assistenzarzt'],
  'lehrer':          ['Pädagoge', 'Lehrperson', 'Trainer', 'Dozent'],
  'designer':        ['UX Designer', 'Grafiker', 'Gestalter', 'UI Designer'],
  'marketing':       ['Marketingmanager', 'Online Marketing', 'Digital Marketing', 'SEO'],
  'hr':              ['Human Resources', 'Personalreferent', 'Recruiter', 'Personalwesen'],
  'lagerarbeiter':   ['Lagermitarbeiter', 'Kommissionierer', 'Lagerfachkraft', 'Lager'],
  'reinigungskraft': ['Reinigung', 'Hausmeister', 'Facility', 'Gebäudereinigung'],
}

function expandKeyword(kw: string): string[] {
  const key = kw.toLowerCase().trim()
  if (!key) return []
  for (const [k, syns] of Object.entries(SYNONYMS)) {
    if (key === k || key.includes(k) || k.includes(key)) return [kw, ...syns]
  }
  return [kw]
}

// ── Location helpers ──────────────────────────────────────────────────────────

const AT_KEYS = ['wien', 'vienna', 'graz', 'salzburg', 'linz', 'innsbruck',
  'klagenfurt', 'villach', 'wels', 'steyr', 'bregenz', 'eisenstadt',
  'st. pölten', 'österreich', 'austria']

const DE_KEYS = ['berlin', 'hamburg', 'münchen', 'munich', 'frankfurt', 'köln',
  'cologne', 'stuttgart', 'düsseldorf', 'dusseldorf', 'hannover', 'nürnberg',
  'nuremberg', 'deutschland', 'germany']

const CH_KEYS = ['zürich', 'zurich', 'bern', 'basel', 'genf', 'geneva',
  'schweiz', 'switzerland']

function isAustria(loc: string): boolean     { const l = loc.toLowerCase(); return AT_KEYS.some(k => l.includes(k)) }
function isGermany(loc: string): boolean     { const l = loc.toLowerCase(); return DE_KEYS.some(k => l.includes(k)) }
function isSwitzerland(loc: string): boolean { const l = loc.toLowerCase(); return CH_KEYS.some(k => l.includes(k)) }

function mapToJoobleLocation(location: string): string {
  if (!location)           return 'Austria'
  if (isAustria(location)) return 'Austria'
  if (isSwitzerland(location)) return 'Switzerland'
  if (isGermany(location)) return location
  return 'Austria'
}

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

// ── Scoring ───────────────────────────────────────────────────────────────────

const DACH_TERMS = ['wien', 'vienna', 'graz', 'salzburg', 'linz', 'innsbruck',
  'österreich', 'austria', 'berlin', 'hamburg', 'münchen', 'munich', 'frankfurt',
  'deutschland', 'germany', 'zürich', 'schweiz', 'switzerland']

// Only hard-block explicit US phrases — 'austria' is safe (no overlap)
const US_INDICATORS = ['usa', 'united states', ' us,', 'america', 'remote worldwide', 'anywhere in the world']

function scoreJob(
  job: { title: string; description: string; location: string; source: string },
  keyword: string,
  city: string,
  synonyms: string[],
): number {
  const title = (job.title || '').toLowerCase()
  const desc  = (job.description || '').toLowerCase()
  const loc   = (job.location || '').toLowerCase()
  const kw    = (keyword || '').toLowerCase().trim()

  // Hard filter: explicit US/global jobs
  if (US_INDICATORS.some(u => loc.includes(u))) return 0

  let score = 30

  if (kw) {
    const allTerms = [kw, ...synonyms.map(s => s.toLowerCase())].filter(t => t.length > 0)
    const titleMatch = allTerms.some(t => title.includes(t))
    const descMatch  = allTerms.some(t => desc.includes(t))

    // Keyword not found anywhere → irrelevant
    if (!titleMatch && !descMatch) return 0

    if (title.includes(kw))      score += 60
    else if (titleMatch)          score += 35
    else if (desc.includes(kw))  score += 20
    else if (descMatch)           score += 10
  }

  const cityNorm = (city || '').toLowerCase()
  if (cityNorm && loc.includes(cityNorm))    score += 25
  if (DACH_TERMS.some(d => loc.includes(d))) score += 15
  if (job.source === 'AMS Austria')          score += 10

  return Math.min(99, score)
}

// ── Skills extractor ──────────────────────────────────────────────────────────

function extractSkills(description: string): string[] {
  const known = ['React', 'TypeScript', 'Python', 'Java', 'SQL', 'AWS', 'Azure', 'Docker',
    'Kubernetes', 'Node.js', 'Vue', 'Angular', 'PHP', 'C#', '.NET', 'Go', 'Swift', 'Kotlin',
    'Excel', 'PowerBI', 'Scrum', 'Agile', 'SAP', 'Marketing', 'SEO']
  const desc = description.toLowerCase()
  return known.filter(s => desc.includes(s.toLowerCase())).slice(0, 5)
}

// ── Dedup ─────────────────────────────────────────────────────────────────────

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
  // Simple call — just keyword + page. Log full response to see actual structure.
  const params = new URLSearchParams({ page: '1' })
  if (keyword) params.set('query', keyword)
  // Location param: send when given, skip for Austria-wide
  if (location && location.trim()) params.set('location', location)

  const url = `https://jobs.ams.at/public/emps/jobs?${params}`
  console.log('[AMS] Fetching:', url)

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`AMS ${res.status} ${res.statusText}`)

  const data = await res.json()
  // Log full response to Vercel logs so we can see the actual field structure
  console.log('[AMS] Full response:', JSON.stringify(data))

  // Try every known envelope key
  const raw: unknown[] =
    data.jobs         ||
    data.content      ||
    data.items        ||
    data.results      ||
    data.data         ||
    data.stellenangebote ||
    (Array.isArray(data) ? data : [])

  console.log('[AMS] Parsed', raw.length, 'jobs from key:', Object.keys(data).join(','))

  return raw.slice(0, 20).map((j: unknown) => {
    const job      = j as Record<string, unknown>
    const employer = (job.employer  as Record<string, unknown>) || {}
    const locObj   = (job.location  as Record<string, unknown>) || {}
    const id       = String(job.id || job.jobId || job.refnr || Math.random())
    return {
      id:          `ams_${id}`,
      title:       String(job.title || job.jobTitle || job.titel || ''),
      company:     String(employer.name || job.company || job.arbeitgeber || ''),
      location:    String(locObj.city || locObj.ort || job.city || job.ort || location || 'Österreich'),
      type:        String(job.employmentType || job.beschaeftigungsart || 'Vor Ort'),
      salary:      String(job.salary || job.gehalt || ''),
      description: String(job.description || job.snippet || job.kurzbeschreibung || '').slice(0, 400),
      url:         `https://jobs.ams.at/public/emps/jobs/${id}`,
      postedAt:    String(job.publicationDate || job.veroeffentlichungsdatum || ''),
      source:      'AMS Austria',
      matchScore:  0,
      skills:      extractSkills(String(job.description || job.snippet || '')),
    }
  })
}

// ── API: Jooble ───────────────────────────────────────────────────────────────

async function fetchJoobleOnce(keyword: string, joobleLocation: string): Promise<JobResult[]> {
  const key = process.env.JOOBLE_API_KEY
  if (!key) return []

  const res = await fetch(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: keyword || '', location: joobleLocation, page: '1', resultonpage: '20' }),
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`Jooble ${res.status}`)
  const json = await res.json()

  return (json.jobs || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id:          `jooble_${j.id}`,
    title:       String(j.title || ''),
    company:     String(j.company || ''),
    location:    String(j.location || joobleLocation),
    type:        String(j.type || 'Vor Ort'),
    salary:      String(j.salary || ''),
    description: String(j.snippet || '').replace(/<[^>]+>/g, '').slice(0, 400),
    url:         String(j.link || ''),
    postedAt:    String(j.updated || ''),
    source:      'Jooble',
    matchScore:  0,
    skills:      extractSkills(String(j.snippet || '')),
  }))
}

// For AT searches: fire two Jooble calls in parallel (city + Austria-wide)
async function fetchJooble(keyword: string, location: string, atSearch: boolean): Promise<JobResult[]> {
  if (atSearch && location && mapToJoobleLocation(location) !== location) {
    // City-specific + Austria-wide in parallel
    const cityLoc = location  // e.g. "Wien"
    const [cityRes, atRes] = await Promise.allSettled([
      fetchJoobleOnce(keyword, cityLoc),
      fetchJoobleOnce(keyword, 'Austria'),
    ])
    const cityJobs = cityRes.status === 'fulfilled' ? cityRes.value : []
    const atJobs   = atRes.status   === 'fulfilled' ? atRes.value   : []
    if (cityRes.status === 'rejected') console.warn('[Jooble city] failed:', cityRes.reason)
    if (atRes.status   === 'rejected') console.warn('[Jooble AT]   failed:', atRes.reason)
    return [...cityJobs, ...atJobs]
  }

  // Single call for non-AT or when location is already 'Austria'
  const joobleLocation = mapToJoobleLocation(location)
  return fetchJoobleOnce(keyword, joobleLocation)
}

// ── API: Bundesagentur für Arbeit (DE only) ───────────────────────────────────

async function fetchBundesagentur(keyword: string, location: string): Promise<JobResult[]> {
  const params = new URLSearchParams({ was: keyword, wo: location, page: '1', size: '20', angebotsart: '1' })
  const res = await fetch(
    `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`,
    { headers: { 'X-API-Key': 'jobboerse-jobsuche' }, signal: AbortSignal.timeout(7000) }
  )
  if (!res.ok) throw new Error(`Bundesagentur ${res.status}`)
  const json = await res.json()

  return (json.stellenangebote || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id:          `ba_${j.refnr}`,
    title:       String(j.titel || ''),
    company:     String(j.arbeitgeber || ''),
    location:    String((j.arbeitsort as Record<string, unknown>)?.ort || location),
    type:        'Vor Ort',
    salary:      '',
    description: String(j.kurzbeschreibung || '').slice(0, 400),
    url:         `https://www.arbeitsagentur.de/jobsuche/jobdetail/${j.refnr}`,
    postedAt:    String(j.eintrittsdatum || ''),
    source:      'Bundesagentur für Arbeit',
    matchScore:  0,
    skills:      extractSkills(String(j.kurzbeschreibung || '')),
  }))
}

// ── API: Careerjet ────────────────────────────────────────────────────────────

async function fetchCareerjet(keyword: string, location: string, locale: string): Promise<JobResult[]> {
  const params = new URLSearchParams({
    keywords: keyword, location, affid: '0', locale_code: locale, pagesize: '20', page: '1',
  })
  const res = await fetch(`https://public.api.careerjet.net/search?${params}`, {
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) throw new Error(`Careerjet ${res.status}`)
  const json = await res.json()

  return (json.jobs || []).slice(0, 20).map((j: Record<string, unknown>) => ({
    id:          `cj_${j.id}`,
    title:       String(j.title || ''),
    company:     String(j.company || ''),
    location:    String(j.locations || location),
    type:        String(j.job_type || 'Vor Ort'),
    salary:      String(j.salary || ''),
    description: String(j.description || '').slice(0, 400),
    url:         String(j.url || ''),
    postedAt:    String(j.date || ''),
    source:      'Careerjet',
    matchScore:  0,
    skills:      extractSkills(String(j.description || '')),
  }))
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
    const tags     = (j.tags as string[] || [])
    const isRemote = String(j.remote || '').toLowerCase() === 'true' || tags.some((t: string) => /remote/i.test(t))
    return {
      id:          `an_${j.slug || j.title}`,
      title:       String(j.title || ''),
      company:     String(j.company_name || ''),
      location:    String(j.location || location || 'DACH'),
      type:        isRemote ? 'Remote' : 'Vor Ort',
      salary:      '',
      description: String(j.description || '').replace(/<[^>]+>/g, '').slice(0, 400),
      url:         String(j.url || ''),
      postedAt:    String(j.created_at || ''),
      source:      'Arbeitnow',
      matchScore:  0,
      skills:      extractSkills(String(j.description || '')),
    }
  })
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

  const { data: profileData } = await supabase
    .from('profiles').select('desired_position, city').eq('id', user.id).single()
  const p = profileData as Record<string, unknown> | null

  const effectiveKeyword  = keyword  || String(p?.desired_position || '')
  const effectiveLocation = location || String(p?.city || '')

  console.log('[Search] params:', { keyword: effectiveKeyword, location: effectiveLocation })

  const synonyms  = expandKeyword(effectiveKeyword).slice(1)
  const atSearch  = isAustria(effectiveLocation) || (!effectiveLocation && !isGermany(effectiveLocation) && !isSwitzerland(effectiveLocation))
  const deSearch  = isGermany(effectiveLocation)
  const careerjetLocale = deSearch ? 'de_DE' : 'de_AT'

  const amsTask       = atSearch ? fetchAMS(effectiveKeyword, effectiveLocation) : Promise.resolve([] as JobResult[])
  const baTask        = deSearch ? fetchBundesagentur(effectiveKeyword, effectiveLocation) : Promise.resolve([] as JobResult[])
  const joobleTask    = fetchJooble(effectiveKeyword, effectiveLocation, atSearch)
  const careerjetTask = fetchCareerjet(effectiveKeyword, effectiveLocation, careerjetLocale)
  const arbeitnowTask = fetchArbeitnow(effectiveKeyword, effectiveLocation)

  const [ams, ba, jooble, careerjet, arbeitnow] = await Promise.allSettled([
    amsTask, baTask, joobleTask, careerjetTask, arbeitnowTask,
  ])

  const amsJobs       = ams.status       === 'fulfilled' ? ams.value       : []
  const baJobs        = ba.status        === 'fulfilled' ? ba.value        : []
  const joobleJobs    = jooble.status    === 'fulfilled' ? jooble.value    : []
  const careerjetJobs = careerjet.status === 'fulfilled' ? careerjet.value : []
  const arbeitnowJobs = arbeitnow.status === 'fulfilled' ? arbeitnow.value : []

  if (ams.status       === 'rejected') console.warn('[AMS] failed:',          ams.reason)
  if (ba.status        === 'rejected') console.warn('[BA] failed:',           ba.reason)
  if (jooble.status    === 'rejected') console.warn('[Jooble] failed:',       jooble.reason)
  if (careerjet.status === 'rejected') console.warn('[Careerjet] failed:',    careerjet.reason)
  if (arbeitnow.status === 'rejected') console.warn('[Arbeitnow] failed:',    arbeitnow.reason)

  console.log('[Search] raw counts — AMS:', amsJobs.length, '| BA:', baJobs.length,
    '| Jooble:', joobleJobs.length, '| Careerjet:', careerjetJobs.length,
    '| Arbeitnow:', arbeitnowJobs.length)

  const allJobs: JobResult[] = dedup([
    ...amsJobs, ...baJobs, ...joobleJobs, ...careerjetJobs, ...arbeitnowJobs,
  ])

  const scored = allJobs.map(j => ({
    ...j,
    matchScore: scoreJob(j, effectiveKeyword, effectiveLocation, synonyms),
  }))

  const hasKeyword = effectiveKeyword.trim().length > 0
  let jobs = scored
    .filter(j => hasKeyword ? j.matchScore > 0 : j.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 30)

  console.log('[Search] after scoring/filter:', jobs.length, 'jobs')

  if (workType) {
    jobs = jobs.filter(j => j.type.toLowerCase().includes(workType.toLowerCase()))
  }

  if (jobs.length === 0) {
    return NextResponse.json({ jobs: [], total: 0, message: 'Keine passenden Jobs gefunden.' })
  }

  const sources = [...new Set(jobs.map(j => j.source))].join(', ')
  return NextResponse.json({ jobs, total: jobs.length, source: sources })
}
