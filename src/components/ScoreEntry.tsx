'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trophy, Calendar } from 'lucide-react'

interface Score {
  id: string
  score: number
  date: string
}

export function ScoreEntry({ initialScores }: { initialScores: Score[] }) {
  const [scores, setScores] = useState<Score[]>(initialScores)
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(newScore, 10)
    if (!newScore || Number.isNaN(parsed) || parsed < 1 || parsed > 45) {
      alert('Score must be between 1 and 45')
      return
    }

    const played = new Date(newDate + 'T12:00:00')
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    if (played > endOfToday) {
      alert('Date cannot be in the future')
      return
    }

    setLoading(true)
    const response = await fetch('/api/scores', {
      method: 'POST',
      body: JSON.stringify({ score: parseInt(newScore), date: newDate }),
    })

    if (response.ok) {
      // Refresh scores
      const res = await fetch('/api/scores')
      const data = await res.json()
      setScores(data)
      setNewScore('')
    } else {
      const errorData = await response.json()
      alert(`Error: ${errorData.error || 'Failed to add score'}`)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-600" />
          Last 5 Scores
        </h2>
        <p className="text-sm text-gray-500 max-w-[16rem] sm:max-w-none text-right sm:text-left">
          Only your latest 5 scores count toward the draw
        </p>
      </div>

      <form onSubmit={handleAddScore} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 items-end">
        <div className="space-y-2">
          <Label htmlFor="score" className="text-xs font-bold uppercase tracking-widest text-gray-400">Stableford Score</Label>
          <Input
            id="score"
            type="number"
            min="1"
            max="45"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            placeholder="1-45"
            className="h-12 rounded-xl border-gray-100 focus:ring-green-600"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-gray-400">Date</Label>
          <Input
            id="date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-12 rounded-xl border-gray-100 focus:ring-green-600"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95"
        >
          {loading ? 'Adding...' : 'Add Score'}
        </Button>
      </form>

      {scores.length > 0 && (
        <p className="mb-4 text-sm font-semibold text-green-700">
          Average (last {scores.length}):{' '}
          {(scores.reduce((a, s) => a + s.score, 0) / scores.length).toFixed(1)} pts
        </p>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {scores.map((s, idx) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28, delay: idx * 0.02 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  {s.score}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Stableford Points</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {isMounted ? new Date(s.date).toLocaleDateString() : '---'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {scores.length === 0 && (
          <p className="text-center py-8 text-gray-500">No scores yet. Add your first one!</p>
        )}
      </div>
    </div>
  )
}
