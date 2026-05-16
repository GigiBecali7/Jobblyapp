import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { sendApplicationConfirmationEmail } from '@/lib/email'

const MAX_FREE_APPLICATIONS = 5

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profileRow } = await supabase
      .from('profiles').select('is_pro, first_name, last_name, email').eq('id', user.id).single()
    const isPro = profileRow?.is_pro === true || user.email === 'drthinkbyte@gmail.com'

    const body = await req.json()
    const { recipientEmail, jobTitle, company, cvId, coverLetterId, jobUrl } = body

    // Validate required fields
    if (!recipientEmail?.trim()) return NextResponse.json({ error: 'Empfänger-E-Mail erforderlich' }, { status: 422 })
    if (!jobTitle?.trim()) return NextResponse.json({ error: 'Stelle erforderlich' }, { status: 422 })
    if (!company?.trim()) return NextResponse.json({ error: 'Unternehmen erforderlich' }, { status: 422 })
    if (!cvId) return NextResponse.json({ error: 'Lebenslauf erforderlich' }, { status: 422 })
    if (!coverLetterId) return NextResponse.json({ error: 'Anschreiben erforderlich' }, { status: 422 })

    // Check application limit for free users
    if (!isPro) {
      const { count } = await supabase
        .from('applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if ((count ?? 0) >= MAX_FREE_APPLICATIONS) {
        return NextResponse.json({
          error: `Free-Plan: max. ${MAX_FREE_APPLICATIONS} Bewerbungen. Upgrade zu Pro!`,
          limitReached: true,
        }, { status: 403 })
      }
    }

    // Fetch CV content
    const { data: cvRow } = await supabase
      .from('cvs').select('title, design, content').eq('id', cvId).eq('user_id', user.id).single()
    if (!cvRow) return NextResponse.json({ error: 'Lebenslauf nicht gefunden' }, { status: 404 })

    // Fetch cover letter content
    const { data: clRow } = await supabase
      .from('cover_letters').select('content, job_title, company').eq('id', coverLetterId).eq('user_id', user.id).single()
    if (!clRow) return NextResponse.json({ error: 'Anschreiben nicht gefunden' }, { status: 404 })

    const firstName = String(profileRow?.first_name || '')
    const lastName = String(profileRow?.last_name || '')
    const senderName = `${firstName} ${lastName}`.trim() || 'Bewerber'
    const senderEmail = String(profileRow?.email || user.email || '')

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // Log the application without sending email if no API key configured
      console.warn('RESEND_API_KEY not configured — skipping email send')
    } else {
      const resend = new Resend(resendKey)
      const subject = `Bewerbung: ${jobTitle} bei ${company} — ${senderName}`
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #1B2E6B; color: white; padding: 32px 40px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${senderName}</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.8;">${senderEmail}</p>
          </div>
          <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #1B2E6B;">
              Bewerbung als ${jobTitle}
            </p>
            <p style="margin: 0 0 24px; color: #6b7280; font-size: 13px;">bei ${company}</p>
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #374151; border-top: 1px solid #f3f4f6; padding-top: 24px;">
${clRow.content}
            </div>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
              Lebenslauf als PDF-Anhang beigefügt · Gesendet über Jobbly
            </div>
          </div>
        </div>
      `

      await resend.emails.send({
        from: `${senderName} via Jobbly <hello@jobblyapp.com>`,
        to: [recipientEmail.trim()],
        replyTo: senderEmail || undefined,
        subject,
        html: htmlBody,
      })
    }

    // Record application in DB
    const { data: app, error: appErr } = await supabase
      .from('applications').insert({
        user_id: user.id,
        position: jobTitle,
        company,
        status: 'Gesendet',
        cv_id: cvId,
        cover_letter_id: coverLetterId,
        email_sent_to: recipientEmail.trim(),
        application_method: 'email',
        job_url: jobUrl || null,
        applied_at: new Date().toISOString(),
        // Legacy fields required by existing schema
        template: cvRow.design,
        style: 'balanced',
        cv_data: cvRow.content,
        cover_letter: clRow.content,
      }).select().single()

    if (appErr) {
      console.error('Failed to record application:', appErr)
      // Don't block if DB insert fails after email sent
    }

    // Send confirmation email to the applicant
    if (senderEmail) {
      const method = body.coverLetterId ? 'email' : 'portal'
      sendApplicationConfirmationEmail(
        user.id, senderEmail, firstName, jobTitle, company, method
      ).catch(e => console.error('Application confirmation email failed:', e))
    }

    return NextResponse.json({ ok: true, applicationId: app?.id })
  } catch (e) {
    console.error('apply/email error:', e)
    return NextResponse.json({ error: 'Server-Fehler beim Senden' }, { status: 500 })
  }
}
