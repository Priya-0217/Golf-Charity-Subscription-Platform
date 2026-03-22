import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { planTypeFromPriceId } from '@/lib/stripe-plans'

type StripeSub = {
  id: string
  status: string
  metadata?: Record<string, string>
  current_period_start: number
  current_period_end: number
  items?: { data: Array<{ price?: { id?: string } }> }
}

function normalizeSubscription(raw: unknown): StripeSub | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const id = typeof s.id === 'string' ? s.id : null
  if (!id) return null
  return {
    id,
    status: typeof s.status === 'string' ? s.status : '',
    metadata: s.metadata as StripeSub['metadata'],
    current_period_start: Number(s.current_period_start),
    current_period_end: Number(s.current_period_end),
    items: s.items as StripeSub['items'],
  }
}

/**
 * Pull the user's active Stripe subscription and mirror it to profiles + subscriptions.
 * Use when webhooks are delayed (local dev) or as a backup after Checkout redirect.
 */
export async function syncUserSubscriptionFromStripe(userId: string): Promise<{
  ok: boolean
  error?: string
}> {
  const supabase = createAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('[STRIPE_SYNC_PROFILE]', profileError)
    return { ok: false, error: 'profile_lookup_failed' }
  }

  const customerId = profile?.stripe_customer_id
  if (!customerId) {
    return { ok: false, error: 'no_stripe_customer' }
  }

  const list = await stripe.subscriptions.list({
    customer: customerId,
    limit: 15,
  })

  const raw = list.data.find(
    (s) => s.status === 'active' || s.status === 'trialing'
  )
  const sub = normalizeSubscription(raw)
  if (!sub) {
    return { ok: false, error: 'no_active_subscription' }
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? ''
  const metaPlan = sub.metadata?.planType
  let planType: 'monthly' | 'yearly'
  if (metaPlan === 'yearly' || metaPlan === 'monthly') {
    planType = metaPlan
  } else {
    planType = planTypeFromPriceId(priceId)
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ subscription_status: 'active' })
    .eq('id', userId)

  if (profileUpdateError) {
    console.error('[STRIPE_SYNC_PROFILE_UPDATE]', profileUpdateError)
    return { ok: false, error: 'profile_update_failed' }
  }

  const rowStatus = sub.status === 'trialing' || sub.status === 'active' ? 'active' : sub.status

  const { error: upsertError } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      plan_type: planType,
      status: rowStatus,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  )

  if (upsertError) {
    console.error('[STRIPE_SYNC_UPSERT]', upsertError)
    return { ok: false, error: 'subscription_upsert_failed' }
  }

  return { ok: true }
}
