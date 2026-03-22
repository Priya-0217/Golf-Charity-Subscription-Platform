import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { planTypeFromPriceId, STRIPE_PRICE_MONTHLY } from '@/lib/stripe-plans'

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get or create stripe customer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[STRIPE_CHECKOUT_PROFILE_ERROR]', profileError)
    }

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      console.log('[STRIPE_CHECKOUT] Creating new customer for', user.email)
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabaseUUID: user.id,
        },
      })
      customerId = customer.id
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.error('[STRIPE_CHECKOUT_UPDATE_ERROR]', updateError)
        // If we can't update the profile, it might mean the profile doesn't exist yet
        // Let's try to insert it if it's missing (fallback)
        await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            email: user.email!, 
            stripe_customer_id: customerId,
            full_name: user.user_metadata?.full_name || 'Golfer'
          })
      }
    }

    const planType = planTypeFromPriceId(
      typeof priceId === 'string' ? priceId : STRIPE_PRICE_MONTHLY
    )

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      /** Required: webhook reads this — subscription_data metadata alone is not on the session object. */
      metadata: {
        supabaseUUID: user.id,
        planType,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      subscription_data: {
        metadata: {
          supabaseUUID: user.id,
          planType,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR]', {
      message: error.message,
      type: error.type,
      code: error.code,
    })
    return new NextResponse(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
