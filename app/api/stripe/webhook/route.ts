import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getPeriodDates(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  const periodStart = item?.current_period_start
  const periodEnd = item?.current_period_end
  return {
    current_period_start: periodStart
      ? new Date(periodStart * 1000).toISOString()
      : null,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Helper: sync organizations.plan for the user's owned org
  async function syncOrgPlan(userId: string, plan: string) {
    // Find org where user is owner
    const { data: membership } = await admin
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single()

    if (membership) {
      await admin
        .from('organizations')
        .update({ plan })
        .eq('id', membership.org_id)
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan || 'pro'

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const periods = getPeriodDates(subscription)

        await admin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status,
          ...periods,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'user_id' })

        // Sync org plan
        await syncOrgPlan(userId, plan)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Find user by customer ID
      const { data: sub } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price?.id
        let plan = 'pro'
        if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
          plan = 'team'
        } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
          plan = 'enterprise'
        }

        const periods = getPeriodDates(subscription)

        await admin.from('subscriptions').update({
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status,
          ...periods,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('user_id', sub.user_id)

        // Sync org plan
        await syncOrgPlan(sub.user_id, plan)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: sub } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        await admin.from('subscriptions').update({
          plan: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
        }).eq('user_id', sub.user_id)

        // Sync org plan to free
        await syncOrgPlan(sub.user_id, 'free')
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: sub } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        await admin.from('subscriptions').update({
          status: 'past_due',
        }).eq('user_id', sub.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
