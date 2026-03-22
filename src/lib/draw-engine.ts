import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

export async function calculatePrizePool() {
  const supabase = await createClient()

  // Get all active subscriptions
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  if (error) throw error

  const totalSubscribers = count || 0
  const monthlySubscriptionPrice = 10 // Assumption
  const totalPool = totalSubscribers * monthlySubscriptionPrice

  // PRD Splits:
  // 5-match: 40% (rollover)
  // 4-match: 35%
  // 3-match: 25%
  return {
    total: totalPool,
    pool_5: totalPool * 0.4,
    pool_4: totalPool * 0.35,
    pool_3: totalPool * 0.25,
  }
}

export function generateWinningNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(n)) {
      numbers.push(n)
    }
  }
  return numbers.sort((a, b) => a - b)
}

export async function findWinners(winningNumbers: number[]) {
  const supabase = await createClient()

  // Get all active subscribers and their last 5 scores
  const { data: subscribers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      scores (
        score,
        date
      )
    `)
    .eq('subscription_status', 'active')

  if (error) throw error

  const winners = {
    match_5: [] as string[],
    match_4: [] as string[],
    match_3: [] as string[],
  }

  subscribers.forEach((subscriber) => {
    // Get last 5 scores
    const userScores = (subscriber.scores as any[])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(s => s.score)

    // Check matches
    const matches = userScores.filter(score => winningNumbers.includes(score)).length

    if (matches === 5) winners.match_5.push(subscriber.id)
    else if (matches === 4) winners.match_4.push(subscriber.id)
    else if (matches === 3) winners.match_3.push(subscriber.id)
  })

  return winners
}

export async function executeDraw(simulate = false) {
  const supabase = await createClient()

  // 1. Calculate pool
  const pools = await calculatePrizePool()

  // 2. Generate numbers
  const winningNumbers = generateWinningNumbers()

  // 3. Find winners
  const winners = await findWinners(winningNumbers)

  // 4. Get previous rollover
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('jackpot_rollover')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const prevRollover = lastDraw?.jackpot_rollover || 0
  const currentPool5 = pools.pool_5 + prevRollover

  // 5. Calculate prize per winner
  const prize5 = winners.match_5.length > 0 ? currentPool5 / winners.match_5.length : 0
  const prize4 = winners.match_4.length > 0 ? pools.pool_4 / winners.match_4.length : 0
  const prize3 = winners.match_3.length > 0 ? pools.pool_3 / winners.match_3.length : 0

  // 6. New rollover (if no 5-match winners)
  const newRollover = winners.match_5.length === 0 ? currentPool5 : 0

  if (simulate) {
    return {
      winningNumbers,
      winners,
      prizes: { prize5, prize4, prize3 },
      newRollover,
      pools,
    }
  }

  // 7. Save draw
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .insert({
      draw_date: new Date().toISOString(),
      status: 'published',
      prize_pool_3: pools.pool_3,
      prize_pool_4: pools.pool_4,
      prize_pool_5: pools.pool_5,
      jackpot_rollover: newRollover,
      winning_numbers: winningNumbers,
    })
    .select()
    .single()

  if (drawError) throw drawError

  // 8. Insert winners
  const winnerRecords = [
    ...winners.match_5.map(id => ({ user_id: id, draw_id: draw.id, match_tier: 5, prize_amount: prize5 })),
    ...winners.match_4.map(id => ({ user_id: id, draw_id: draw.id, match_tier: 4, prize_amount: prize4 })),
    ...winners.match_3.map(id => ({ user_id: id, draw_id: draw.id, match_tier: 3, prize_amount: prize3 })),
  ]

  if (winnerRecords.length > 0) {
    await supabase.from('winners').insert(winnerRecords)
  }

  return { draw, winners: winnerRecords }
}
