'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Trophy, Upload, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function WinningsPage() {
  const [winnings, setWinnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
    fetchWinnings()
  }, [])

  async function fetchWinnings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('winners')
      .select('*, draws(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setWinnings(data)
    setLoading(false)
  }

  const handleUploadProof = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${winnerId}-${Math.random()}.${fileExt}`
      const filePath = `proofs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath)

      await supabase
        .from('winners')
        .update({ proof_url: publicUrl, status: 'pending' })
        .eq('id', winnerId)

      await fetchWinnings()
      alert('Proof uploaded successfully! Admin will review it shortly.')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-8 h-8 text-yellow-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900">Your Winnings</h1>
          <p className="text-gray-500 mt-2">Track your prizes and upload proof for verification.</p>
        </header>

        {loading ? (
          <div className="text-center py-12">Loading your winnings...</div>
        ) : (
          <div className="space-y-6">
            {winnings.map((win) => (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center font-bold text-green-700">
                    {win.match_tier}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{win.match_tier}-Match Prize</h3>
                    <p className="text-sm text-gray-500">Draw Date: {isMounted ? new Date(win.draws.draw_date).toLocaleDateString() : '---'}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ${isMounted ? win.prize_amount.toLocaleString() : win.prize_amount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    {win.status === 'verified' && (
                      <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    )}
                    {win.status === 'pending' && win.proof_url && (
                      <span className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" /> Under Review
                      </span>
                    )}
                    {win.status === 'pending' && !win.proof_url && (
                      <span className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <AlertTriangle className="w-4 h-4" /> Proof Required
                      </span>
                    )}
                    {win.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4" /> Rejected
                      </span>
                    )}
                  </div>

                  {!win.proof_url && win.status !== 'verified' && (
                    <div className="relative">
                      <input
                        type="file"
                        id={`upload-${win.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadProof(win.id, file)
                        }}
                      />
                      <Button
                        asChild
                        disabled={uploading === win.id}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <label htmlFor={`upload-${win.id}`} className="cursor-pointer flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {uploading === win.id ? 'Uploading...' : 'Upload Proof'}
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {winnings.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No winnings found yet. Good luck in the next draw!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
