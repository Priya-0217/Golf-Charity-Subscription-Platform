import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const session = event.data.object as any
    const supabaseUUID = session.subscription_data?.metadata?.supabaseUUID || session.metadata?.supabaseUUID
    const planType = session.subscription_data?.metadata?.planType || session.metadata?.planType || 'monthly'

    if (supabaseUUID) {
      // Update profile
      await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', supabaseUUID)

      // Create or update subscription record
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: supabaseUUID,
          stripe_subscription_id: subscription.id,
          plan_type: planType,
          status: 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, {
          onConflict: 'stripe_subscription_id'
        })
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any
    const supabaseUUID = subscription.metadata?.supabaseUUID

    if (supabaseUUID) {
      const status = subscription.status === 'active' ? 'active' : 'inactive'
      
      await supabase
        .from('profiles')
        .update({ subscription_status: status })
        .eq('id', supabaseUUID)

      await supabase
        .from('subscriptions')
        .update({ 
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)
    }
  }

  return NextResponse.json({ received: true })
}
