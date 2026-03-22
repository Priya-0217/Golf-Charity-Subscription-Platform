'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Trophy, Play, Info, AlertTriangle } from 'lucide-react'

export default function AdminDrawsPage() {
  const [simulation, setSimulation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/draws/simulate')
    const data = await res.json()
    setSimulation(data)
    setLoading(false)
  }

  const handleExecute = async () => {
    if (!confirm('Are you sure you want to execute the monthly draw and publish results?')) return

    setExecuting(true)
    const res = await fetch('/api/admin/draws/execute', { method: 'POST' })
    if (res.ok) {
      alert('Draw executed successfully!')
      setSimulation(null)
    }
    setExecuting(false)
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Monthly Draw Execution</h1>
          <p className="text-gray-500 mt-2">Simulate and publish the monthly draw results.</p>
        </header>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Draw System</h2>
              <p className="text-sm text-gray-500">
                The draw uses the last 5 scores from active subscribers and matches them against 5 winning numbers (1-45).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSimulate}
              disabled={loading || executing}
              className="bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Simulating...' : 'Simulate Draw'}
            </Button>

            {simulation && (
              <Button
                onClick={handleExecute}
                disabled={executing}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                {executing ? 'Executing...' : 'Execute & Publish Results'}
              </Button>
            )}
          </div>
        </div>

        {simulation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Winning Numbers */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Simulated Winning Numbers</h3>
              <div className="flex gap-4">
                {simulation.winningNumbers.map((num: number) => (
                  <div key={num} className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Winners Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { tier: 5, winners: simulation.winners.match_5.length, prize: simulation.prizes.prize5 },
                { tier: 4, winners: simulation.winners.match_4.length, prize: simulation.prizes.prize4 },
                { tier: 3, winners: simulation.winners.match_3.length, prize: simulation.prizes.prize3 },
              ].map((s) => (
                <div key={s.tier} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{s.tier}-Match Winners</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{s.winners}</p>
                  <p className="text-sm text-green-600 font-bold mt-1">${s.prize.toLocaleString()} each</p>
                </div>
              ))}
            </div>

            {/* Pools & Rollover */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Financial Overview</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Prize Pool</p>
                  <p className="text-2xl font-bold text-gray-900">${simulation.pools.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">New Jackpot Rollover</p>
                  <p className="text-2xl font-bold text-red-600">${simulation.newRollover.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
