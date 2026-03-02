import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan || 'pro'
  const priceId = body.priceId || PLANS[plan as keyof typeof PLANS]?.priceId || PLANS.pro.priceId

  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get or create Stripe customer
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let stripeCustomerId = subscription?.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    stripeCustomerId = customer.id

    // Upsert subscription record with customer ID
    await admin.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      plan: 'free',
      status: 'inactive',
    }, { onConflict: 'user_id' })
  }

  // Find user's org for metadata
  const { data: orgMembership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .single()

  const origin = request.headers.get('origin') || 'https://tweaklog.vercel.app'

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/post-login?upgrade=success`,
    cancel_url: `${origin}/post-login?upgrade=canceled`,
    subscription_data: plan === 'pro' ? { trial_period_days: 14 } : undefined,
    allow_promotion_codes: true,
    metadata: {
      userId: user.id,
      plan: plan || 'pro',
      ...(orgMembership?.org_id ? { orgId: orgMembership.org_id } : {}),
    },
  })

  return NextResponse.json({ url: session.url })
}
