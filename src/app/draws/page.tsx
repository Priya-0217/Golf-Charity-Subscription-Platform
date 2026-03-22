import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrizeCurrency } from '@/lib/prize-pool'
import { Trophy, ArrowLeft } from 'lucide-react'

function countMatches(userNums: number[], winning: number[]) {
  if (winning.length !== 5) return 0
  const w = new Set(winning)
  return userNums.filter((n) => w.has(n)).length
}

export default async function DrawsHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(48)

  const drawIds = draws?.map((d) => d.id) ?? []
  const { data: myScores } = await supabase
    .from('scores')
    .select('score, date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5)

  const userNums = (myScores ?? []).map((s) => s.score)

  type MyWin = {
    draw_id: string
    match_tier: number
    prize_amount: number
    status: string
  }

  const { data: myWinsRaw } =
    drawIds.length > 0
      ? await supabase.from('winners').select('draw_id, match_tier, prize_amount, status').eq('user_id', user.id).in('draw_id', drawIds)
      : { data: null as MyWin[] | null }

  const myWins: MyWin[] = myWinsRaw ?? []

  const { data: allWinners } =
    drawIds.length > 0
      ? await supabase.from('winners').select('draw_id, match_tier, prize_amount').in('draw_id', drawIds)
      : { data: [] as { draw_id: string; match_tier: number; prize_amount: number }[] }

  const winsByDraw = new Map<string, MyWin>()
  for (const w of myWins) {
    winsByDraw.set(w.draw_id, w)
  }

  const countsByDraw = new Map<string, { n5: number; n4: number; n3: number; paid: number }>()
  for (const w of allWinners ?? []) {
    const cur = countsByDraw.get(w.draw_id) ?? { n5: 0, n4: 0, n3: 0, paid: 0 }
    if (w.match_tier === 5) cur.n5 += 1
    if (w.match_tier === 4) cur.n4 += 1
    if (w.match_tier === 3) cur.n3 += 1
    cur.paid += w.prize_amount
    countsByDraw.set(w.draw_id, cur)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-600/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">Draw history</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Results, prizes & your participation
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <p className="text-sm text-gray-600">
          Retro match counts use your <span className="font-semibold text-gray-900">current</span> last five scores
          against each draw&apos;s winning numbers (for reference only).
        </p>

        {!draws?.length ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-sm">
            No published draws yet. Check back after the first draw runs.
          </div>
        ) : (
          <ul className="space-y-6">
            {draws.map((d) => {
              const nums = Array.isArray(d.winning_numbers) ? (d.winning_numbers as number[]) : []
              const c = countsByDraw.get(d.id) ?? { n5: 0, n4: 0, n3: 0, paid: 0 }
              const win = winsByDraw.get(d.id)
              const matches = countMatches(userNums, nums)
              const jackpotHit = c.n5 > 0
              const rolledOut = !jackpotHit && (d.jackpot_rollover ?? 0) > 0

              return (
                <li
                  key={d.id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Draw date
                      </p>
                      <p className="text-lg font-black text-gray-900">
                        {new Date(d.draw_date).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 sm:text-right space-y-1">
                      <p>
                        <span className="font-semibold text-gray-900">Jackpot: </span>
                        {jackpotHit
                          ? `${c.n5} winner${c.n5 === 1 ? '' : 's'}`
                          : rolledOut
                            ? `Rolled ${formatPrizeCurrency(d.jackpot_rollover ?? 0)} forward`
                            : 'No rollover recorded'}
                      </p>
                      {rolledOut && (
                        <p className="text-amber-800 font-medium">No 5-match winner this month</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {nums.length === 5 ? (
                      nums.map((n) => (
                        <span
                          key={n}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-black text-white shadow-md shadow-green-600/25"
                        >
                          {n}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Winning numbers unavailable</span>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase text-gray-400">5-match pool paid</p>
                      <p className="mt-1 text-xl font-black text-gray-900">{c.n5} winners</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase text-gray-400">4-match pool paid</p>
                      <p className="mt-1 text-xl font-black text-gray-900">{c.n4} winners</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-bold uppercase text-gray-400">3-match pool paid</p>
                      <p className="mt-1 text-xl font-black text-gray-900">{c.n3} winners</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Prize pools (recorded)</p>
                      <p className="text-sm font-semibold text-gray-800">
                        J {formatPrizeCurrency(d.prize_pool_5)} · 4 {formatPrizeCurrency(d.prize_pool_4)} · 3{' '}
                        {formatPrizeCurrency(d.prize_pool_3)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Total paid (this draw)</p>
                      <p className="text-sm font-semibold text-gray-800">{formatPrizeCurrency(c.paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Your row</p>
                      {win ? (
                        <p className="text-sm font-bold text-green-700">
                          {win.match_tier}-match · {formatPrizeCurrency(win.prize_amount)} · {win.status}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-700">
                          No prize on file · retro {matches} match{matches === 1 ? '' : 'es'}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
