import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, subscription_status, stripe_customer_id, created_at')
    .order('created_at', { ascending: false })
    .limit(250)

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Users</h1>
          <p className="mt-2 font-medium text-gray-500">
            Member profiles and subscription flags. Admins have full read access via RLS.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Could not load users: {error.message}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="hidden px-4 py-3 lg:table-cell">Stripe</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-500">
                        {(p.full_name || p.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">{p.full_name || '—'}</p>
                        <p className="truncate text-xs text-gray-500">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium capitalize text-gray-800">
                    {p.subscription_status || '—'}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-gray-600 lg:table-cell">
                    {p.stripe_customer_id ? (
                      <span className="truncate block max-w-[140px]" title={p.stripe_customer_id}>
                        {p.stripe_customer_id}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profiles?.length && !error && (
            <div className="flex flex-col items-center gap-2 p-12 text-gray-500">
              <Users className="h-10 w-10 text-gray-300" />
              <p>No profiles found.</p>
            </div>
          )}
        </div>

        <p className="mt-6 rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-xs text-amber-950">
          <strong>Grant admin:</strong> in Supabase SQL:{' '}
          <code className="rounded bg-white/80 px-1 py-0.5 font-mono text-[11px]">
            {`update public.profiles set role = 'admin' where email = 'you@example.com';`}
          </code>
        </p>
      </div>
    </div>
  )
}
