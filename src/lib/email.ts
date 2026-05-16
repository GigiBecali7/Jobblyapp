// Verify jobblyapp.com in Resend dashboard at resend.com
import { createServerClient } from '@supabase/ssr'

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

const BASE_URL = 'https://www.jobblyapp.com'
const FROM = 'Jobbly <hello@jobblyapp.com>'

// Shared email shell
function emailShell(bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jobbly</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'DM Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:32px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0D1117;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
  <tr><td style="background:linear-gradient(135deg,#1B2E6B,#253A85);padding:28px 32px;">
    <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;">Jobbly</span>
    <span style="font-size:11px;color:rgba(255,255,255,0.5);margin-left:6px;">· KI Bewerbungshelfer</span>
  </td></tr>
  <tr><td style="padding:32px;">
    ${bodyContent}
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:28px 0;">
    <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:0;line-height:1.6;">
      Jobbly · hello@jobblyapp.com · ${BASE_URL}<br>
      <a href="${BASE_URL}/datenschutz" style="color:rgba(147,175,253,0.6);text-decoration:none;">Abmelden</a> ·
      <a href="${BASE_URL}/datenschutz" style="color:rgba(147,175,253,0.6);text-decoration:none;">Datenschutz</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function btn(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#1B2E6B,#253A85);color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:700;margin-top:20px;">${text}</a>`
}

function txt(content: string, size = 14, color = 'rgba(255,255,255,0.8)', mb = 12): string {
  return `<p style="font-size:${size}px;color:${color};margin:0 0 ${mb}px;line-height:1.7;">${content}</p>`
}

async function logEmail(userId: string | null, emailType: string, toEmail: string, status: string) {
  try {
    const supabase = createAdminClient()
    await supabase.from('emails_log').insert({ user_id: userId || null, email_type: emailType, to_email: toEmail, status })
  } catch (e) { console.warn('Failed to log email:', e) }
}

async function send(to: string, subject: string, html: string, userId: string | null, emailType: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('RESEND_API_KEY not configured — skipping email send'); return }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    await resend.emails.send({ from: FROM, to: [to], subject, html })
    await logEmail(userId, emailType, to, 'sent')
  } catch (e) {
    console.error(`Failed to send ${emailType} email:`, e)
    await logEmail(userId, emailType, to, 'failed')
  }
}

export async function sendWelcomeEmail(userId: string, toEmail: string, firstName: string) {
  const name = firstName || 'Bewerber'
  const html = emailShell(`
    ${txt(`Hallo ${name}! 👋`, 20, '#fff', 8)}
    ${txt('Schön, dass du dabei bist. Jobbly hilft dir, schneller zum Traumjob zu kommen.', 14, 'rgba(255,255,255,0.7)')}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
      ${[
        ['1', 'Profil ausfüllen', 'Bessere Job-Matches durch vollständiges Profil'],
        ['2', 'Lebenslauf erstellen', 'In 3 Minuten fertig mit KI-Unterstützung'],
        ['3', 'Traumjob finden', 'KI sucht passende Jobs automatisch für dich'],
      ].map(([n, title, desc]) => `
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:rgba(27,46,107,0.6);color:#93AFFD;font-size:11px;font-weight:700;text-align:center;line-height:24px;margin-right:12px;">${n}</span>
          <span style="font-size:13px;font-weight:600;color:#fff;">${title}</span>
          <span style="display:block;font-size:12px;color:rgba(255,255,255,0.5);margin-left:36px;margin-top:2px;">${desc}</span>
        </td></tr>`).join('')}
    </table>
    ${btn(`${BASE_URL}/dashboard`, 'Jetzt loslegen →')}
  `)
  await send(toEmail, 'Willkommen bei Jobbly.ai! 🚀', html, userId, 'welcome')
}

export async function sendApplicationConfirmationEmail(
  userId: string, toEmail: string, firstName: string,
  jobTitle: string, company: string, method: 'email' | 'portal'
) {
  const name = firstName || 'Bewerber'
  const now = new Date().toLocaleString('de-AT', { dateStyle: 'long', timeStyle: 'short' })
  const methodLabel = method === 'email' ? 'Per E-Mail' : 'Über Portal'
  const html = emailShell(`
    ${txt(`Hallo ${name}!`, 18, '#fff', 8)}
    ${txt('Deine Bewerbung wurde erfolgreich abgeschickt.', 14, 'rgba(255,255,255,0.7)')}
    <div style="background:rgba(27,46,107,0.15);border:1px solid rgba(27,46,107,0.3);border-radius:12px;padding:20px;margin:20px 0;">
      <p style="font-size:12px;color:#93AFFD;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin:0 0 12px;">Bewerbungsdetails</p>
      ${[['Position', jobTitle], ['Unternehmen', company], ['Datum', now], ['Methode', methodLabel]].map(([l, v]) => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:12px;color:rgba(255,255,255,0.5);">${l}</span>
          <span style="font-size:13px;color:#fff;font-weight:600;">${v}</span>
        </div>`).join('')}
    </div>
    ${btn(`${BASE_URL}/dashboard`, 'Bewerbungen verfolgen →')}
  `)
  await send(toEmail, `Bewerbung bei ${company} abgeschickt ✓`, html, userId, 'application_confirmation')
}

export async function sendJobAlertEmail(
  userId: string, toEmail: string, firstName: string,
  jobTitle: string, company: string, location: string,
  salary: string, matchScore: number, jobUrl: string
) {
  const name = firstName || 'Bewerber'
  const html = emailShell(`
    ${txt(`Hallo ${name}! 🎯`, 18, '#fff', 8)}
    ${txt('Wir haben einen neuen Job gefunden, der perfekt zu dir passt:', 14, 'rgba(255,255,255,0.7)')}
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:20px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <p style="font-size:16px;font-weight:700;color:#fff;margin:0 0 4px;">${jobTitle}</p>
          <p style="font-size:13px;color:rgba(255,255,255,0.6);margin:0;">${company} · ${location}</p>
        </div>
        <div style="background:rgba(27,46,107,0.4);border-radius:8px;padding:8px 14px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:#93AFFD;">${matchScore}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);">Match</div>
        </div>
      </div>
      ${salary ? `<p style="font-size:12px;color:rgba(255,255,255,0.5);margin:0;">💰 ${salary}</p>` : ''}
    </div>
    ${btn(jobUrl || `${BASE_URL}/dashboard`, 'Job ansehen →')}
    <p style="font-size:11px;color:rgba(255,255,255,0.3);margin:16px 0 0;">
      <a href="${BASE_URL}/datenschutz" style="color:rgba(147,175,253,0.5);text-decoration:none;">Job-Alerts abbestellen</a>
    </p>
  `)
  await send(toEmail, `Neuer Job-Match: ${jobTitle} bei ${company} 🎯`, html, userId, 'job_alert')
}

export async function sendProUpgradeEmail(userId: string, toEmail: string, firstName: string) {
  const name = firstName || 'Pro-Nutzer'
  const features = [
    'Unbegrenzte Bewerbungen',
    'Alle 6 CV-Designs',
    'Unbegrenzte Bearbeitungen',
    'Priorität Job-Alerts',
  ]
  const html = emailShell(`
    ${txt(`Willkommen bei Jobbly Pro, ${name}! ⭐`, 20, '#fff', 8)}
    ${txt('Du bist jetzt Pro-Mitglied — alle Features sind freigeschaltet.', 14, 'rgba(255,255,255,0.7)')}
    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(109,40,217,0.08));border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:20px;margin:20px 0;">
      ${features.map(f => `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
          <span style="color:#4ADE80;font-size:14px;">✓</span>
          <span style="font-size:13px;color:#fff;">${f}</span>
        </div>`).join('')}
    </div>
    ${btn(`${BASE_URL}/dashboard`, 'Alle Pro-Features entdecken →')}
  `)
  await send(toEmail, 'Willkommen bei Jobbly Pro! ⭐', html, userId, 'pro_upgrade')
}
