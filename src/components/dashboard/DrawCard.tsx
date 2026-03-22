"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Timer, Trophy, ArrowRight, Sparkles, Calendar, Radio } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DrawCardProps {
  nextDrawDate: string
  /** Shown under the timer — full localized schedule line */
  nextDrawAtLabel: string
  /** Short system context, e.g. published draws count + last draw */
  drawStatusLine: string
  currentNumbers?: number[]
  lastWinners?: Array<{ label: string; prize: number }>
  yourNumbersBadge?: string
  drawRevealSlot?: ReactNode
  className?: string
}

export function DrawCard({
  nextDrawDate,
  nextDrawAtLabel,
  drawStatusLine,
  currentNumbers = [],
  lastWinners = [],
  yourNumbersBadge,
  drawRevealSlot,
  className,
}: DrawCardProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const target = new Date(nextDrawDate).getTime()

    const tick = () => {
      const distance = target - Date.now()
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setEnded(true)
        return false
      }
      setEnded(false)
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
      return true
    }

    tick()
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [nextDrawDate])

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 border-green-600/25 shadow-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white ring-1 ring-white/10",
        className
      )}
    >
      <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between space-y-0">
        <div>
          <CardTitle className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Timer className="w-7 h-7 text-green-400 shrink-0" />
            Next draw countdown
          </CardTitle>
          <p className="mt-2 text-sm font-medium leading-snug text-gray-300 max-w-xl">
            {nextDrawAtLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-300 bg-green-500/15 px-3 py-1.5 rounded-full border border-green-500/30">
            <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            Monthly draw
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-2">
        <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-medium text-gray-300">
          <Calendar className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          <span>{drawStatusLine}</span>
        </p>

        {/* Countdown — large, high contrast */}
        {ended ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-center">
            <p className="text-lg font-black text-amber-100">Draw time reached</p>
            <p className="mt-2 text-sm text-amber-100/80">
              Results are published after the live draw is run. Check{" "}
              <Link href="/draws" className="font-bold text-white underline underline-offset-2">
                draw history
              </Link>{" "}
              for the latest numbers and prizes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <motion.div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-black/40 px-3 py-4 sm:py-5 text-center backdrop-blur-sm"
                animate={item.label === "Seconds" ? { opacity: [1, 0.88, 1] } : undefined}
                transition={
                  item.label === "Seconds"
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums text-white leading-none">
                  {String(item.value).padStart(2, "0")}
                </div>
                <div className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 gap-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
              Your draw numbers (Stableford 1–45)
            </p>
            {yourNumbersBadge ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 px-2 py-0.5 rounded-full bg-yellow-400/10 max-w-[14rem] truncate">
                {yourNumbersBadge}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {currentNumbers.length > 0 ? (
              currentNumbers.map((num, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center font-black text-lg shadow-lg shadow-green-600/25"
                >
                  {num}
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic text-center w-full">
                Add up to five scores — those Stableford points become your numbers for the next draw.
              </p>
            )}
          </div>
        </div>

        {drawRevealSlot && <div className="border-t border-white/10 pt-6">{drawRevealSlot}</div>}

        {lastWinners.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent prizes (platform)</p>
            <div className="space-y-2">
              {lastWinners.map((winner, i) => (
                <div key={i} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="font-medium text-gray-300 truncate">{winner.label}</span>
                  </div>
                  <span className="font-bold text-green-400 shrink-0">
                    +{isMounted ? `$${winner.prize.toLocaleString()}` : `$${winner.prize}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          asChild
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl group text-base"
        >
          <Link href="/draws">
            Full draw history &amp; your stats
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
