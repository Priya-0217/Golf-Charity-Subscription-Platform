/** Prize pool splits per PRD: 40% / 35% / 25% of gross subscription pool */

export const POOL_SPLIT = {
  jackpot: 0.4,
  fourMatch: 0.35,
  threeMatch: 0.25,
} as const

export const DEFAULT_MONTHLY_FEE = 10

export function calculatePoolsFromSubscribers(
  activeSubscriberCount: number,
  monthlyFee: number = DEFAULT_MONTHLY_FEE
) {
  const total = activeSubscriberCount * monthlyFee
  return {
    total,
    pool5: total * POOL_SPLIT.jackpot,
    pool4: total * POOL_SPLIT.fourMatch,
    pool3: total * POOL_SPLIT.threeMatch,
  }
}

export function formatPrizeCurrency(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '$0'
  return `$${Math.round(amount).toLocaleString()}`
}
