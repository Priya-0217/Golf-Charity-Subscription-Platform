import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/DashboardOverview'
import { ScoreEntry } from '@/components/ScoreEntry'
import { CharitySummary } from '@/components/CharitySummary'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { DrawCard } from '@/components/dashboard/DrawCard'
import { DrawReveal } from '@/components/dashboard/DrawReveal'
import { CharityImpactCard } from '@/components/dashboard/CharityImpactCard'
import { CheckoutSuccessSync } from '@/components/dashboard/CheckoutSuccessSync'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'
import { calculatePoolsFromSubscribers } from '@/lib/prize-pool'
import { computeNextDrawDate, formatNextDrawLong } from '@/lib/draw-schedule'
import Link from 'next/link'
import { Trophy, TrendingUp } from 'lucide-react'

function winnerTierCopy(matchTier: number) {
  if (matchTier === 5) return 'Jackpot tier winner'
  if (matchTier === 4) return '4-match tier winner'
  return '3-match tier winner'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(*)')
    .eq('id', user.id)
    .maybeSingle()

  // If no profile exists, create one using admin client (bypass RLS)
  if (!profile) {
    const adminClient = createAdminClient()
    await adminClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || 'Golfer',
        subscription_status: 'inactive'
      })
    
    // Fetch it again now that it's created
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*, charities(*)')
      .eq('id', user.id)
      .maybeSingle()
    
    profile = newProfile
  }

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5)

  const { data: winnings } = await supabase
    .from('winners')
    .select('*, draws(*)')
    .eq('user_id', user.id)

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const { count: activeSubscriberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { data: recentPublishedDraws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12)

  const latestDraw = recentPublishedDraws?.[0]
  const previousPublishedDraw = recentPublishedDraws?.[1]
  const rolloverFromLastMonth = previousPublishedDraw?.jackpot_rollover ?? 0

  const livePools = calculatePoolsFromSubscribers(activeSubscriberCount ?? 0)

  let drawWinnersForLatest: { match_tier: number; prize_amount: number; user_id: string }[] = []
  if (latestDraw?.id) {
    const { data: w } = await supabase
      .from('winners')
      .select('match_tier, prize_amount, user_id')
      .eq('draw_id', latestDraw.id)
    drawWinnersForLatest = w ?? []
  }

  const winners5 = drawWinnersForLatest.filter((w) => w.match_tier === 5).length
  const winners4 = drawWinnersForLatest.filter((w) => w.match_tier === 4).length
  const winners3 = drawWinnersForLatest.filter((w) => w.match_tier === 3).length

  const prizePool5Base = latestDraw?.prize_pool_5 ?? livePools.pool5
  const prizePool4Base = latestDraw?.prize_pool_4 ?? livePools.pool4
  const prizePool3Base = latestDraw?.prize_pool_3 ?? livePools.pool3
  const jackpotPoolTotal = prizePool5Base + rolloverFromLastMonth

  const estimatedPrize5 = winners5 > 0 ? jackpotPoolTotal / winners5 : jackpotPoolTotal
  const estimatedPrize4 = winners4 > 0 ? prizePool4Base / winners4 : prizePool4Base
  const estimatedPrize3 = winners3 > 0 ? prizePool3Base / winners3 : prizePool3Base

  const myWinForLatestDraw = drawWinnersForLatest.find((w) => w.user_id === user.id)

  const winningNumbers = Array.isArray(latestDraw?.winning_numbers)
    ? (latestDraw!.winning_numbers as number[])
    : []
  const userDrawNumbers = (scores ?? []).map((s) => s.score)
  const countMatches = (u: number[], w: number[]) => {
    if (w.length !== 5) return 0
    const ws = new Set(w)
    return u.filter((n) => ws.has(n)).length
  }
  const userMatchCount =
    winningNumbers.length === 5 ? countMatches(userDrawNumbers, winningNumbers) : 0

  const subscriptionRowActive = subscription?.status === 'active'
  const profileMarkedActive = profile?.subscription_status === 'active'
  const effectiveStatus =
    subscriptionRowActive || profileMarkedActive
      ? 'active'
      : profile?.subscription_status || 'inactive'

  const totalWinnings = winnings?.reduce((acc, w) => acc + w.prize_amount, 0) || 0
  const avgScore = scores && scores.length > 0 
    ? (scores.reduce((acc, s) => acc + s.score, 0) / scores.length).toFixed(1)
    : 0

  const publishedDrawCount = recentPublishedDraws?.length ?? 0
  const nextDrawInstant = computeNextDrawDate(latestDraw?.draw_date ?? null)
  const nextDrawDate = nextDrawInstant.toISOString()
  const nextDrawAtLabel = `Next live draw: ${formatNextDrawLong(nextDrawInstant)}`
  const lastDrawDateLabel = latestDraw?.draw_date
    ? new Date(latestDraw.draw_date as string).toLocaleDateString(undefined, { dateStyle: 'long' })
    : null
  const drawStatusLine = lastDrawDateLabel
    ? `Published draws: ${publishedDrawCount}. Latest results: ${lastDrawDateLabel}. Your last five Stableford scores (1–45) are your numbers for the next draw.`
    : `Published draws: ${publishedDrawCount}. When the first draw is published, results and replays appear here and below.`

  const adminForWinners = createAdminClient()
  const { data: platformWinners } = await adminForWinners
    .from('winners')
    .select('prize_amount, match_tier')
    .order('created_at', { ascending: false })
    .limit(5)

  const lastWinnersForCard =
    platformWinners?.map((w) => ({
      label: winnerTierCopy(Number(w.match_tier)),
      prize: Number(w.prize_amount),
    })) ?? []

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation / Header */}
      <nav className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-600/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">GolfImpact</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/draws"
                className="hidden text-sm font-bold text-green-700 hover:text-green-800 sm:inline"
              >
                Draw history
              </Link>
              <NotificationDropdown />
              <div className="h-10 w-px bg-gray-100 mx-2" />
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900 leading-none">{profile?.full_name}</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
                    {effectiveStatus === 'active' ? `${subscription?.plan_type || 'Pro'} Member` : 'Free Plan'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-gray-400">
                  {profile?.full_name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <CheckoutSuccessSync />
        {/* Welcome Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
              Welcome back, <span className="text-green-600">{profile?.full_name?.split(' ')[0]}</span>!
            </h2>
            <p className="text-gray-500 font-medium mt-2">
              You've raised <span className="text-gray-900 font-bold">$124.50</span> for charity this year. Keep it up!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/draws"
              className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-green-200 transition-colors max-w-md"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-sm font-bold text-gray-700 line-clamp-2">
                Next draw: {formatNextDrawLong(nextDrawInstant)}
              </span>
            </Link>
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard
            title="Total Winnings"
            value={`$${totalWinnings.toLocaleString()}`}
            icon="dollar"
            trend={{ value: 12, isPositive: true }}
            iconClassName="bg-yellow-50 text-yellow-600"
          />
          <StatsCard
            title="Average Score"
            value={avgScore}
            description="Last 5 rounds"
            icon="trend"
            trend={{ value: 4, isPositive: true }}
            iconClassName="bg-blue-50 text-blue-600"
          />
          <StatsCard
            title="Published draws"
            value={publishedDrawCount}
            description="Completed monthly runs"
            icon="trophy"
            iconClassName="bg-green-50 text-green-600"
          />
          <StatsCard
            title="Your prizes"
            value={winnings?.length || 0}
            description="Recorded wins"
            icon="trophy"
            iconClassName="bg-emerald-50 text-emerald-700"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Draw Experience */}
            <DrawCard
              nextDrawDate={nextDrawDate}
              nextDrawAtLabel={nextDrawAtLabel}
              drawStatusLine={drawStatusLine}
              currentNumbers={userDrawNumbers}
              yourNumbersBadge={
                winningNumbers.length === 5
                  ? `${userDrawNumbers.length}/5 scores · ${userMatchCount} match${userMatchCount === 1 ? "" : "es"} latest`
                  : `${userDrawNumbers.length}/5 scores`
              }
              lastWinners={lastWinnersForCard}
              drawRevealSlot={
                latestDraw && winningNumbers.length === 5 ? (
                  <DrawReveal
                    drawId={latestDraw.id}
                    winningNumbers={winningNumbers}
                    userNumbers={userDrawNumbers}
                    rolloverFromLastMonth={rolloverFromLastMonth}
                    jackpotPoolTotal={jackpotPoolTotal}
                    estimatedPrize5={estimatedPrize5}
                    estimatedPrize4={estimatedPrize4}
                    estimatedPrize3={estimatedPrize3}
                    userPrizeAmount={myWinForLatestDraw?.prize_amount ?? null}
                  />
                ) : null
              }
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <ScoreEntry initialScores={scores || []} />
               <DashboardOverview winnings={winnings || []} />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <SubscriptionStatus 
              status={effectiveStatus} 
              planType={subscription?.plan_type}
            />
            
            <CharityImpactCard
              userTotalDonated={124.50}
              platformTotalDonated={342500}
              currentCharity={profile?.charities as any}
            />

            <CharitySummary
              charity={profile?.charities as any}
              percent={profile?.contribution_percent || 10}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
