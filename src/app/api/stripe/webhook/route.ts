import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type Stripe from 'stripe'

function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

async function updateProStatus(userId: string, isPro: boolean, subscriptionId?: string) {
  const supabase = createAdminClient()
  await supabase
    .from('profiles')
    .update({ is_pro: isPro, stripe_subscription_id: subscriptionId ?? null })
    .eq('id', userId)
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  const { getStripe } = await import('@/lib/stripe')
  const stripe = getStripe()

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const getUserId = (obj: { metadata?: Stripe.Metadata | null }): string | null =>
    obj.metadata?.supabase_user_id ?? null

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = getUserId(session)
      if (userId && session.subscription) {
        await updateProStatus(userId, true, session.subscription as string)
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = getUserId(sub)
      if (userId) {
        const isActive = ['active', 'trialing'].includes(sub.status)
        await updateProStatus(userId, isActive, sub.id)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = getUserId(sub)
      if (userId) await updateProStatus(userId, false)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : null
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        const userId = getUserId(sub)
        if (userId) await updateProStatus(userId, false, subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
