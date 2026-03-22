import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserSubscriptionFromStripe } from '@/lib/stripe/subscription-sync'

/** Call after Stripe Checkout redirect if webhooks are slow or unavailable (e.g. local dev). */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const result = await syncUserSubscriptionFromStripe(user.id)
  return NextResponse.json(result)
}
