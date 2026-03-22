import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, LayoutDashboard, Heart, Trophy, CheckCircle } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch some stats
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: charityCount } = await supabase.from('charities').select('*', { count: 'exact', head: true })
  const { count: pendingWinners } = await supabase.from('winners').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  const stats = [
    { name: 'Total Users', value: userCount || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Charities', value: charityCount || 0, icon: Heart, color: 'bg-red-500' },
    { name: 'Pending Verifications', value: pendingWinners || 0, icon: CheckCircle, color: 'bg-yellow-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage the platform and its monthly draws.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-xl text-white ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/draws"
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <Trophy className="w-8 h-8 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900">Manage Draws</h3>
            <p className="text-sm text-gray-500 mt-1">Run monthly draws and prize pools.</p>
          </Link>

          <Link
            href="/admin/charities"
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <Heart className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900">Manage Charities</h3>
            <p className="text-sm text-gray-500 mt-1">Add, edit, or remove charities.</p>
          </Link>

          <Link
            href="/admin/winners"
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <CheckCircle className="w-8 h-8 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900">Verify Winners</h3>
            <p className="text-sm text-gray-500 mt-1">Review proof and approve payouts.</p>
          </Link>

          <Link
            href="/admin/users"
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <Users className="w-8 h-8 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-500 mt-1">View user list and subscriptions.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
