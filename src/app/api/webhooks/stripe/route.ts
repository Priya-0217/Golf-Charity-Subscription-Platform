import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { planTypeFromPriceId } from '@/lib/stripe-plans'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id?: string
      mode?: string
      metadata?: Record<string, string>
      customer?: string | { id?: string }
      subscription?: string | { id?: string }
    }

    if (session.mode !== 'subscription') {
      return NextResponse.json({ received: true })
    }

    let supabaseUUID = session.metadata?.supabaseUUID
    let planType: string = session.metadata?.planType || 'monthly'

    const subRef = session.subscription
    const subId = typeof subRef === 'string' ? subRef : subRef?.id

    if (subId) {
      const subscription = (await stripe.subscriptions.retrieve(subId)) as unknown as {
        id: string
        status: string
        metadata?: Record<string, string>
        current_period_start: number
        current_period_end: number
        items?: { data: Array<{ price?: { id?: string } }> }
      }

      if (!supabaseUUID) {
        supabaseUUID = subscription.metadata?.supabaseUUID
      }
      if (subscription.metadata?.planType) {
        planType = subscription.metadata.planType
      }

      const priceId = subscription.items?.data?.[0]?.price?.id
      if (priceId && planType !== 'yearly' && planType !== 'monthly') {
        planType = planTypeFromPriceId(priceId)
      }

      const resolvedPlan =
        planType === 'yearly' || planType === 'monthly' ? planType : planTypeFromPriceId(priceId ?? '')

      if (!supabaseUUID) {
        const customerRef = session.customer
        const customerId =
          typeof customerRef === 'string' ? customerRef : customerRef?.id
        if (customerId) {
          const { data: row } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle()
          supabaseUUID = row?.id
        }
      }

      if (!supabaseUUID) {
        console.error('[STRIPE_WEBHOOK] checkout.session.completed: no user id', session.id)
        return NextResponse.json({ received: true })
      }

      const profileStatus =
        subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive'
      const subscriptionRowStatus =
        subscription.status === 'trialing' || subscription.status === 'active' ? 'active' : subscription.status

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ subscription_status: profileStatus })
        .eq('id', supabaseUUID)

      if (profileErr) {
        console.error('[STRIPE_WEBHOOK] profile update', profileErr)
      }

      const { error: upsertErr } = await supabase.from('subscriptions').upsert(
        {
          user_id: supabaseUUID,
          stripe_subscription_id: subscription.id,
          plan_type: resolvedPlan,
          status: subscriptionRowStatus,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      )

      if (upsertErr) {
        console.error('[STRIPE_WEBHOOK] subscriptions upsert', upsertErr)
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as {
      id: string
      status: string
      metadata?: Record<string, string>
      customer?: string | { id?: string }
      current_period_end?: number
    }

    let supabaseUUID = subscription.metadata?.supabaseUUID

    if (!supabaseUUID && subscription.customer) {
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id
      if (customerId) {
        const { data: row } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        supabaseUUID = row?.id
      }
    }

    if (supabaseUUID) {
      const profileActive =
        subscription.status === 'active' || subscription.status === 'trialing'
      const profileStatus = profileActive ? 'active' : 'inactive'
      const rowStatus =
        subscription.status === 'trialing' || subscription.status === 'active'
          ? 'active'
          : subscription.status

      await supabase
        .from('profiles')
        .update({ subscription_status: profileStatus })
        .eq('id', supabaseUUID)

      if (subscription.current_period_end) {
        await supabase
          .from('subscriptions')
          .update({
            status: rowStatus,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}
