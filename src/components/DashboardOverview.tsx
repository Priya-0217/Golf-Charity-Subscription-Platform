'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Calendar, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Winning {
  id: string
  match_tier: number
  prize_amount: number
  status: string
  draws: {
    draw_date: string
  }
}

export function DashboardOverview({ winnings }: { winnings: Winning[] }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const totalWinnings = winnings.reduce((acc, w) => acc + w.prize_amount, 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Winnings Overview */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600 border border-yellow-100">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Winnings</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">
              ${isMounted ? totalWinnings.toLocaleString() : totalWinnings}
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {winnings.length > 0 ? (
            winnings.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm font-black text-sm">
                    {w.match_tier}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{w.match_tier}-Match Prize</p>
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {isMounted ? new Date(w.draws.draw_date).toLocaleDateString() : '---'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600 text-sm">
                    +${isMounted ? w.prize_amount.toLocaleString() : w.prize_amount}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{w.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-sm font-bold text-gray-400 mb-4">No winnings yet. Keep playing!</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-green-600 hover:text-green-700"
              >
                View next draw
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Participation Overview */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Participation</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">{winnings.length} Draws</h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Your Performance</h4>
            <p className="text-xs font-medium text-gray-500 leading-relaxed">
              You have participated in {winnings.length} monthly draws. Keep your scores updated to stay eligible!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Match</p>
              <p className="text-xl font-black text-gray-900">
                {(winnings.reduce((acc, w) => acc + w.match_tier, 0) / (winnings.length || 1)).toFixed(1)}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rank</p>
              <p className="text-xl font-black text-gray-900">Top 10%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
