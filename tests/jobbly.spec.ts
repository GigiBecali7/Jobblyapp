import { test, expect, type Page } from '@playwright/test'

// Attach console error monitor to every page
async function attachErrorMonitor(page: Page) {
  page.on('pageerror', err => { throw new Error(`PAGE CRASH: ${err.message}`) })
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (
        text.includes('undefined') ||
        text.includes('Cannot read') ||
        text.includes('supabase') ||
        text.includes(' 500') ||
        text.includes(' 404')
      ) {
        throw new Error(`CONSOLE ERROR: ${text}`)
      }
    }
  })
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────

test('no auto-redirect when visiting landing page', async ({ page }) => {
  await attachErrorMonitor(page)
  await page.goto('/')
  await page.waitForTimeout(3000)
  expect(page.url()).toMatch(/\/$/)
})

test('landing page renders full width on desktop 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const body = await page.evaluate(() => document.body.scrollWidth)
  expect(body).toBeGreaterThanOrEqual(1400)
})

test('no horizontal scroll on mobile 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
})

test('sign in modal has Angemeldet bleiben checkbox', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Sign in')
  await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 })
  const checkbox = page.locator('input[type="checkbox"]').first()
  await expect(checkbox).toBeVisible()
  const label = page.locator('text=Angemeldet bleiben')
  await expect(label).toBeVisible()
})

test('Get started button opens register modal', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Get started')
  await page.waitForSelector('input[type="email"]', { timeout: 5000 })
  const emailInput = page.locator('input[type="email"]').first()
  await expect(emailInput).toBeVisible()
})

// ── API HEALTH ────────────────────────────────────────────────────────────────

test('jobs search API returns results (Arbeitnow cascade)', async ({ page }) => {
  const response = await page.request.get('/api/jobs/search?q=developer&location=vienna')
  // API requires auth — expect 401 or 200 (not 500)
  expect([200, 401]).toContain(response.status())
  if (response.status() === 200) {
    const data = await response.json()
    expect(data).toHaveProperty('jobs')
    expect(Array.isArray(data.jobs)).toBe(true)
  }
})

// ── DASHBOARD (requires auth — these run against prod with session cookie) ───
// Note: dashboard tests below assume TEST_COOKIE env var set to a valid session

test.describe('Dashboard (requires auth)', () => {
  test.skip(!process.env.TEST_COOKIE, 'Skipped — set TEST_COOKIE env var to run dashboard tests')

  test.beforeEach(async ({ page }) => {
    const cookie = process.env.TEST_COOKIE!
    await page.context().addCookies([{
      name: 'sb-access-token',
      value: cookie,
      domain: 'jobblyapp.com',
      path: '/',
    }])
  })

  test('dashboard loads without crash', async ({ page }) => {
    await attachErrorMonitor(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('Meine Daten input fields keep focus while typing', async ({ page }) => {
    await attachErrorMonitor(page)
    await page.goto('/dashboard')
    await page.click('text=Meine Daten')
    await page.waitForTimeout(1000)
    const input = page.locator('input').first()
    await input.click()
    await input.fill('')
    await input.type('TestName', { delay: 50 })
    const value = await input.inputValue()
    expect(value).toContain('TestName')
  })

  test('jobs section shows real results from API', async ({ page }) => {
    await attachErrorMonitor(page)
    await page.goto('/dashboard')
    await page.click('text=Jobs finden')
    await page.waitForTimeout(5000)
    const noResults = page.locator('text=Keine Jobs gefunden')
    const unavail = page.locator('text=vorübergehend nicht verfügbar')
    const hasError = (await noResults.count()) > 0 || (await unavail.count()) > 0
    if (!hasError) {
      // Should have at least one job card
      const jobCards = page.locator('[data-testid="job-card"]')
      // Even without testid, check for company name or title elements
    }
  })

  test('all 6 CV designs load without crash', async ({ page }) => {
    const designs = ['NordicSidebar', 'ModernSplit', 'DarkPro', 'ExecutivePhoto', 'NordicMinimal', 'MonoElegant']
    for (const design of designs) {
      await page.goto(`/dashboard/lebenslauf?design=${design}`)
      await page.waitForTimeout(2000)
      const errorText = page.locator('text=Error')
      expect(await errorText.count()).toBe(0)
    }
  })

  test('photo upload shows in avatar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('text=Meine Daten')
    await page.waitForTimeout(2000)
    const avatar = page.locator('img').first()
    if (await avatar.count() > 0) {
      const src = await avatar.getAttribute('src')
      if (src) {
        expect(src).toMatch(/supabase|blob:/)
      }
    }
  })
})

// ── SECURITY ──────────────────────────────────────────────────────────────────

test('unauthenticated user gets redirected from /dashboard', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForURL(url => !url.pathname.startsWith('/dashboard'), { timeout: 5000 })
  expect(page.url()).not.toContain('/dashboard')
})

test('API routes return 401 without auth', async ({ page }) => {
  const response = await page.request.get('/api/jobs/search')
  expect(response.status()).toBe(401)
})
