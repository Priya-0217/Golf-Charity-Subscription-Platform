import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExternalLink, Heart } from 'lucide-react'

export default async function AdminCharitiesPage() {
  const supabase = await createClient()
  const { data: charities, error } = await supabase
    .from('charities')
    .select('id, name, description, logo_url, total_raised, is_active, website_url')
    .order('name', { ascending: true })

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Charities</h1>
            <p className="mt-2 font-medium text-gray-500">
              All organizations available for member selection. Public directory:{' '}
              <Link href="/charities" className="font-bold text-green-700 hover:underline">
                /charities
              </Link>
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Could not load charities: {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Status</th>
                <th className="px-4 py-3 text-right">Raised</th>
                <th className="px-4 py-3 text-right">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(charities ?? []).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-gray-500 md:max-w-md">
                          {c.description || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">
                    ${Number(c.total_raised || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {c.website_url ? (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-green-700 hover:underline"
                      >
                        Site <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!charities?.length && !error && (
            <p className="p-10 text-center text-gray-500">No charities in the database yet.</p>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          To add or edit records, use the Supabase table editor or run SQL migrations. In-app CRUD can be wired here
          later.
        </p>
      </div>
    </div>
  )
}
