'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ExternalLink, User, Trophy } from 'lucide-react'

export default function AdminWinnersPage() {
  const [pendingWinners, setPendingWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingWinners()
  }, [])

  async function fetchPendingWinners() {
    const { data } = await supabase
      .from('winners')
      .select('*, profiles(*), draws(*)')
      .eq('status', 'pending')
      .not('proof_url', 'is', null)
      .order('created_at', { ascending: false })

    if (data) setPendingWinners(data)
    setLoading(false)
  }

  const handleVerify = async (winnerId: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('winners')
      .update({ status })
      .eq('id', winnerId)

    if (!error) {
      alert(`Winner ${status} successfully!`)
      fetchPendingWinners()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Winner Verification</h1>
          <p className="text-gray-500 mt-2">Review uploaded proof and verify winners.</p>
        </header>

        {loading ? (
          <div className="text-center py-12">Loading pending winners...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pendingWinners.map((win) => (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{win.profiles.full_name}</p>
                      <p className="text-sm text-gray-500">{win.profiles.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{win.match_tier}-Match</p>
                    <p className="text-xl font-bold text-green-600">${win.prize_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Proof of Winner</p>
                  {win.proof_url ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden group border border-gray-200">
                      <img
                        src={win.proof_url}
                        alt="Proof"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <a
                        href={win.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="flex items-center gap-2 text-white font-bold">
                          <ExternalLink className="w-4 h-4" /> View Full Image
                        </span>
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No proof uploaded yet.</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleVerify(win.id, 'verified')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify
                  </Button>
                  <Button
                    onClick={() => handleVerify(win.id, 'rejected')}
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}

            {pendingWinners.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No pending verifications at this time.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
