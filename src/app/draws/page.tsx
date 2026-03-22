import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatPrizeCurrency } from '@/lib/prize-pool'
import { computeNextDrawDate, formatNextDrawLong } from '@/lib/draw-schedule'
import {
  Trophy,
  ArrowLeft,
  Target,
  TrendingUp,
  Coins,
  Info,
  ChevronRight,
} from 'lucide-react'

function countMatches(userNums: number[], winning: number[]) {
  if (winning.length !== 5) return 0
  const w = new Set(winning)
  return userNums.filter((n) => w.has(n)).length
}

function tierLabel(tier: number) {
  if (tier === 5) return 'Jackpot (5★)'
  if (tier === 4) return '4-match'
  return '3-match'
}

export default async function DrawsHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const scoreRows = myScores ?? []
  const userNums = scoreRows.map((s) => s.score)
  const stablefordTotal = userNums.reduce((a, n) => a + n, 0)
  const stablefordAvg = userNums.length ? (stablefordTotal / userNums.length).toFixed(1) : '—'

  type MyWin = {
    draw_id: string
    match_tier: number
    prize_amount: number
    status: string
  }

  const { data: myWinsRaw } =
    drawIds.length > 0
      ? await supabase
          .from('winners')
          .select('draw_id, match_tier, prize_amount, status')
          .eq('user_id', user.id)
          .in('draw_id', drawIds)
      : { data: null as MyWin[] | null }

  const myWins: MyWin[] = myWinsRaw ?? []

  /** Aggregates per draw (admin — RLS hides other users’ rows from the anon client). */
  const admin = createAdminClient()
  const { data: allWinnersAgg } =
    drawIds.length > 0
      ? await admin.from('winners').select('draw_id, match_tier, prize_amount').in('draw_id', drawIds)
      : { data: [] as { draw_id: string; match_tier: number; prize_amount: number }[] }

  const winsByDraw = new Map<string, MyWin>()
  for (const w of myWins) {
    winsByDraw.set(w.draw_id, w)
  }

  const countsByDraw = new Map<string, { n5: number; n4: number; n3: number; paid: number }>()
  for (const w of allWinnersAgg ?? []) {
    const cur = countsByDraw.get(w.draw_id) ?? { n5: 0, n4: 0, n3: 0, paid: 0 }
    if (w.match_tier === 5) cur.n5 += 1
    if (w.match_tier === 4) cur.n4 += 1
    if (w.match_tier === 3) cur.n3 += 1
    cur.paid += Number(w.prize_amount)
    countsByDraw.set(w.draw_id, cur)
  }

  const totalUserWinnings = myWins.reduce((a, w) => a + Number(w.prize_amount), 0)
  const drawsWithRetro = draws?.map((d) => {
    const nums = Array.isArray(d.winning_numbers) ? (d.winning_numbers as number[]) : []
    return { id: d.id, matches: countMatches(userNums, nums) }
  }) ?? []
  const retroMatchesList = drawsWithRetro.map((x) => x.matches)
  const avgRetroMatches =
    retroMatchesList.length > 0
      ? (retroMatchesList.reduce((a, b) => a + b, 0) / retroMatchesList.length).toFixed(2)
      : '—'
  const bestRetroMatches = retroMatchesList.length > 0 ? Math.max(...retroMatchesList) : 0

  const latestDrawDate = draws?.[0]?.draw_date
  const nextDraw = computeNextDrawDate(latestDrawDate ?? null)
  const nextDrawLine = formatNextDrawLong(nextDraw)

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="hidden h-6 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/25">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900">Draw history</h1>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Results, Stableford entry &amp; your performance
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800"
          >
            Back to dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 pb-16">
        {/* Schedule callout */}
        <section className="overflow-hidden rounded-3xl border border-green-600/20 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-400">Upcoming</p>
              <p className="mt-1 text-lg font-black sm:text-xl">{nextDrawLine}</p>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Draws run monthly. Your last five Stableford scores (1–45) are your numbers for matching
                winning balls.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Published draws</p>
                <p className="text-2xl font-black">{draws?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Your recorded wins</p>
                <p className="text-2xl font-black">{myWins.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Your stats */}
        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500">Your draw performance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Total winnings</span>
              </div>
              <p className="mt-2 text-3xl font-black text-gray-900">{formatPrizeCurrency(totalUserWinnings)}</p>
              <p className="mt-1 text-xs text-gray-500">From official prize records tied to your account</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Avg retro matches</span>
              </div>
              <p className="mt-2 text-3xl font-black text-gray-900">{avgRetroMatches}</p>
              <p className="mt-1 text-xs text-gray-500">Per published draw vs your current five scores</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Best match streak</span>
              </div>
              <p className="mt-2 text-3xl font-black text-gray-900">{bestRetroMatches} / 5</p>
              <p className="mt-1 text-xs text-gray-500">Best single-draw overlap (retrospective)</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Trophy className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Stableford (entry)</span>
              </div>
              <p className="mt-2 text-3xl font-black text-gray-900">{stablefordAvg}</p>
              <p className="mt-1 text-xs text-gray-500">
                Avg of your last {userNums.length || 0} scores · Sum {stablefordTotal || '—'}
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-950">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <p>
            <span className="font-bold">Retro match counts</span> compare your{" "}
            <strong>current</strong> last five Stableford points to each past draw&apos;s winning numbers — useful
            for tracking, not an official historical snapshot. Official prizes show only when you have a winner
            record for that draw.
          </p>
        </div>

        {/* Current Stableford row */}
        {scoreRows.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Your current entry (Stableford)</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {scoreRows.map((s) => (
                <div
                  key={`${s.date}-${s.score}`}
                  className="flex min-w-[7rem] flex-col rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <span className="text-2xl font-black text-green-700">{s.score}</span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500">Past draws</h2>

          {!draws?.length ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-12 text-center">
              <p className="text-lg font-bold text-gray-700">No published draws yet</p>
              <p className="mt-2 text-sm text-gray-500">
                When the first draw is published, full results and community prize breakdowns will appear here.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-6 border-l-2 border-green-600/25 pl-6 sm:pl-8">
              {draws.map((d, idx) => {
                const nums = Array.isArray(d.winning_numbers) ? (d.winning_numbers as number[]) : []
                const c = countsByDraw.get(d.id) ?? { n5: 0, n4: 0, n3: 0, paid: 0 }
                const win = winsByDraw.get(d.id)
                const matches = countMatches(userNums, nums)
                const jackpotHit = c.n5 > 0
                const rolledOut = !jackpotHit && (d.jackpot_rollover ?? 0) > 0
                const winSet = new Set(nums)

                return (
                  <li key={d.id} className="relative">
                    <span
                      className="absolute -left-[calc(1rem+4px)] top-6 flex h-4 w-4 -translate-x-1/2 rounded-full border-4 border-[#F0F4F8] bg-green-600 sm:-left-[calc(1.25rem+4px)]"
                      aria-hidden
                    />
                    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg">
                      <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Draw #{draws.length - idx}
                          </p>
                          <p className="text-xl font-black text-gray-900">
                            {new Date(d.draw_date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {jackpotHit ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                              Jackpot hit · {c.n5} winner{c.n5 === 1 ? '' : 's'}
                            </span>
                          ) : rolledOut ? (
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900">
                              Jackpot rolled · {formatPrizeCurrency(d.jackpot_rollover ?? 0)} forward
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700">
                              No rollover
                            </span>
                          )}
                          {win ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                              You: {tierLabel(win.match_tier)} · {formatPrizeCurrency(win.prize_amount)}
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                              Retro matches: {matches}/5
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-6 p-5 lg:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Winning numbers</h4>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {nums.length === 5 ? (
                              nums.map((n) => (
                                <span
                                  key={n}
                                  className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-base font-black text-white shadow-md shadow-green-600/30"
                                >
                                  {n}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">Not available</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">
                            Your Stableford vs this draw
                          </h4>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {userNums.length === 0 ? (
                              <p className="text-sm text-gray-500">No scores on file — add rounds on the dashboard.</p>
                            ) : (
                              userNums.map((n, i) => (
                                <span
                                  key={i}
                                  className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-black shadow-sm ${
                                    winSet.has(n)
                                      ? 'bg-amber-400 text-gray-900 ring-2 ring-amber-600'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                  title={winSet.has(n) ? 'Matched a winning number' : 'No match'}
                                >
                                  {n}
                                </span>
                              ))
                            )}
                          </div>
                          <p className="mt-3 text-sm text-gray-600">
                            <span className="font-bold text-gray-900">{matches}</span> of your current five points
                            appear in this draw&apos;s results.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">5★ winners (community)</p>
                          <p className="text-lg font-black text-gray-900">{c.n5}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">4★ winners</p>
                          <p className="text-lg font-black text-gray-900">{c.n4}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">3★ winners</p>
                          <p className="text-lg font-black text-gray-900">{c.n3}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">Prizes paid (draw)</p>
                          <p className="text-lg font-black text-green-700">{formatPrizeCurrency(c.paid)}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-between">
                        <div className="text-xs text-gray-500">
                          Pools (recorded): J {formatPrizeCurrency(d.prize_pool_5)} · 4{' '}
                          {formatPrizeCurrency(d.prize_pool_4)} · 3 {formatPrizeCurrency(d.prize_pool_3)}
                        </div>
                        {win && (
                          <div className="text-sm font-bold text-gray-800">
                            Your prize status: <span className="text-green-700">{win.status}</span>
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  )
}
