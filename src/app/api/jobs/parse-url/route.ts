import { NextRequest, NextResponse } from 'next/server'

function extractMeta(html: string, property: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']{1,500})["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:property|name)=["']${property}["']`, 'i'))
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").trim() : ''
}

function extractTitle(html: string): string {
  const og = extractMeta(html, 'og:title')
  if (og) return og

  const title = html.match(/<title[^>]*>([^<]{2,200})<\/title>/i)?.[1]?.trim() ?? ''
  if (title) {
    // Strip site name suffix: "Job Title | Site" or "Job Title - Site"
    return title.split(/\s*[|–—]\s*/)[0].trim()
  }

  const h1 = html.match(/<h1[^>]*>([^<]{2,200})<\/h1>/i)?.[1]?.trim() ?? ''
  return h1
}

function extractCompany(html: string): string {
  // Structured data: hiringOrganization
  const org = html.match(/"hiringOrganization"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{2,100})"/i)?.[1]
    ?? html.match(/"employer"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{2,100})"/i)?.[1]
  if (org) return org.trim()

  // og:site_name
  const site = extractMeta(html, 'og:site_name')

  // "Unternehmen:" label
  const untern = html.match(/Unternehmen[:\s]+<[^>]+>([^<]{2,80})</i)?.[1]
    ?? html.match(/Unternehmen:\s*([^\n<]{2,80})/i)?.[1]
  if (untern) return untern.trim()

  return site
}

function extractDescription(html: string): string {
  const og = extractMeta(html, 'og:description')
  if (og) return og

  const desc = extractMeta(html, 'description')
  if (desc) return desc

  // First substantial <p>
  const p = html.match(/<p[^>]*>([^<]{100,})<\/p>/i)?.[1]?.trim() ?? ''
  return p
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    if (!url) return NextResponse.json({ success: false, reason: 'no_url' })

    try { new URL(url) } catch {
      return NextResponse.json({ success: false, reason: 'invalid_url' })
    }

    let html = ''
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        const reason = (res.status === 403 || res.status === 401 || res.status === 429) ? 'blocked' : 'http_error'
        return NextResponse.json({ success: false, reason, status: res.status })
      }
      html = await res.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const reason = msg.includes('timeout') || msg.includes('abort') || msg.includes('TimeoutError') ? 'timeout' : 'network_error'
      return NextResponse.json({ success: false, reason })
    }

    const title = extractTitle(html)
    const company = extractCompany(html)
    const description = extractDescription(html)

    if (!title) return NextResponse.json({ success: false, reason: 'no_data' })

    return NextResponse.json({
      success: true,
      title: title.slice(0, 200),
      company: (company || '').slice(0, 200),
      description: description.slice(0, 500),
    })
  } catch {
    return NextResponse.json({ success: false, reason: 'server_error' })
  }
}
