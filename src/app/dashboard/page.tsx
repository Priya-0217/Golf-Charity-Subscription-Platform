import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/DashboardOverview'
import { ScoreEntry } from '@/components/ScoreEntry'
import { CharitySummary } from '@/components/CharitySummary'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { DrawCard } from '@/components/dashboard/DrawCard'
import { CharityImpactCard } from '@/components/dashboard/CharityImpactCard'
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown'
import { Trophy, Users, TrendingUp, DollarSign } from 'lucide-react'

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

  // Determine effective status (prefer active subscription from table)
  const effectiveStatus = subscription?.status === 'active' 
    ? 'active' 
    : (profile?.subscription_status || 'inactive')

  const totalWinnings = winnings?.reduce((acc, w) => acc + w.prize_amount, 0) || 0
  const avgScore = scores && scores.length > 0 
    ? (scores.reduce((acc, s) => acc + s.score, 0) / scores.length).toFixed(1)
    : 0

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
            <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-gray-600">Next Draw: March 31</span>
            </div>
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
            title="Draws Entered"
            value={winnings?.length || 0}
            description="Monthly participation"
            icon="trophy"
            iconClassName="bg-green-50 text-green-600"
          />
          <StatsCard
            title="Community"
            value="12.4k"
            description="Active golfers"
            icon="users"
            iconClassName="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Draw Experience */}
            <DrawCard
              nextDrawDate="2026-03-31T20:00:00"
              currentNumbers={[12, 24, 35, 42, 7]}
              eligibilityTier={5}
              lastWinners={[
                { name: "Alex M.", prize: 1250 },
                { name: "Sarah K.", prize: 450 }
              ]}
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
