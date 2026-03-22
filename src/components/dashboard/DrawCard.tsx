"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Timer, Trophy, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DrawCardProps {
  nextDrawDate: string
  currentNumbers?: number[]
  lastWinners?: Array<{ name: string; prize: number }>
  eligibilityTier: number
  className?: string
}

export function DrawCard({
  nextDrawDate,
  currentNumbers = [],
  lastWinners = [],
  eligibilityTier,
  className,
}: DrawCardProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setIsMounted(true)
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = new Date(nextDrawDate).getTime() - now

      if (distance < 0) {
        clearInterval(timer)
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [nextDrawDate])

  return (
    <Card className={cn("overflow-hidden border-none shadow-xl bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Timer className="w-5 h-5 text-green-400" />
          Next Draw Countdown
        </CardTitle>
        <span className="text-xs font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
          Live Draw
        </span>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-4 py-4">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-black mb-1">{String(item.value).padStart(2, "0")}</div>
              <div className="text-[10px] font-bold uppercase tracking-tighter text-gray-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Draw Eligibility */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Your Draw Numbers
            </p>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 px-2 py-0.5 rounded-full bg-yellow-400/10">
              {eligibilityTier}-Match Tier
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            {currentNumbers.length > 0 ? (
              currentNumbers.map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-green-600/20"
                >
                  {num}
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">Complete your profile to get numbers</p>
            )}
          </div>
        </div>

        {/* Last Winners */}
        {lastWinners.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Winners</p>
            <div className="space-y-2">
              {lastWinners.map((winner, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="font-medium text-gray-300">{winner.name}</span>
                  </div>
                  <span className="font-bold text-green-400">
                    +${isMounted ? winner.prize.toLocaleString() : winner.prize}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl group">
          View Draw Details
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
