/** Stripe Price IDs — override with NEXT_PUBLIC_STRIPE_PRICE_MONTHLY / YEARLY in .env */
export const STRIPE_PRICE_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? 'price_1TDgnICjCqYNHI0m0G8xc1Io'

export const STRIPE_PRICE_YEARLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ?? 'price_1TDgpDCjCqYNHI0muleBt9jH'

export function planTypeFromPriceId(priceId: string): 'monthly' | 'yearly' {
  if (priceId === STRIPE_PRICE_YEARLY) return 'yearly'
  return 'monthly'
}
