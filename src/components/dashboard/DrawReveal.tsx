"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPrizeCurrency } from "@/lib/prize-pool"

type RevealPhase = "idle" | "running" | "complete"

function randomBallNumber(): number {
  return Math.floor(Math.random() * 45) + 1
}

export interface DrawRevealProps {
  drawId: string
  winningNumbers: number[]
  userNumbers: number[]
  /** Rollover from the prior month included in this draw's jackpot (for notice + display math) */
  rolloverFromLastMonth: number
  /** Full jackpot pool for this draw (40% slice + rollover), used for copy when user hits 5 */
  jackpotPoolTotal: number
  /** Estimated or actual per-winner amounts for copy */
  estimatedPrize5: number
  estimatedPrize4: number
  estimatedPrize3: number
  /** User's recorded prize from DB if they won */
  userPrizeAmount?: number | null
  className?: string
}

function countMatches(user: number[], winning: number[]): number {
  const winSet = new Set(winning)
  return user.filter((n) => winSet.has(n)).length
}

export function DrawReveal({
  drawId,
  winningNumbers,
  userNumbers,
  rolloverFromLastMonth,
  jackpotPoolTotal,
  estimatedPrize5,
  estimatedPrize4,
  estimatedPrize3,
  userPrizeAmount,
  className,
}: DrawRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>("idle")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [revealed, setRevealed] = useState<(number | null)[]>([null, null, null, null, null])
  const [spinDisplay, setSpinDisplay] = useState<number | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const spinTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const revealInitRef = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (spinTickRef.current) {
      clearInterval(spinTickRef.current)
      spinTickRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const runReveal = useCallback(() => {
    clearTimers()
    setPhase("running")
    setShowBanner(false)
    setRevealed([null, null, null, null, null])
    setActiveIndex(-1)
    setSpinDisplay(null)

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms)
      timersRef.current.push(t)
    }

    const revealBall = (index: number) => {
      if (index >= 5) {
        setActiveIndex(-1)
        setSpinDisplay(null)
        setPhase("complete")
        schedule(() => setShowBanner(true), 400)
        try {
          localStorage.setItem(`golfimpact-draw-reveal-seen-${drawId}`, "1")
        } catch {
          /* ignore */
        }
        return
      }

      setActiveIndex(index)
      const final = winningNumbers[index]
      const spinMs = 1000 + Math.random() * 1000
      const tickMs = 50
      let elapsed = 0

      spinTickRef.current = setInterval(() => {
        elapsed += tickMs
        setSpinDisplay(randomBallNumber())
        if (elapsed >= spinMs) {
          if (spinTickRef.current) {
            clearInterval(spinTickRef.current)
            spinTickRef.current = null
          }
          setSpinDisplay(final)
          setRevealed((prev) => {
            const next = [...prev]
            next[index] = final
            return next
          })
          schedule(() => revealBall(index + 1), 450)
        }
      }, tickMs)
    }

    schedule(() => revealBall(0), 250)
  }, [clearTimers, drawId, winningNumbers])

  useEffect(() => {
    revealInitRef.current = false
  }, [drawId])

  useEffect(() => {
    if (winningNumbers.length !== 5) return
    if (revealInitRef.current) return
    revealInitRef.current = true

    let alreadySeen = false
    try {
      alreadySeen = !!localStorage.getItem(`golfimpact-draw-reveal-seen-${drawId}`)
    } catch {
      alreadySeen = false
    }

    if (alreadySeen) {
      setRevealed([...winningNumbers])
      setPhase("complete")
      setShowBanner(true)
      setActiveIndex(-1)
      setSpinDisplay(null)
      return
    }

    runReveal()
  }, [drawId, winningNumbers, runReveal])

  const matchesAfterComplete =
    phase === "complete" && revealed.every((v) => v !== null)
      ? countMatches(userNumbers, revealed as number[])
      : 0

  const displayMatches = showBanner ? matchesAfterComplete : 0

  const prizeForBanner = (() => {
    if (userPrizeAmount != null && userPrizeAmount > 0) return userPrizeAmount
    if (displayMatches === 5) return estimatedPrize5
    if (displayMatches === 4) return estimatedPrize4
    if (displayMatches === 3) return estimatedPrize3
    return 0
  })()

  const bannerContent = (() => {
    if (!showBanner) return null
    if (displayMatches === 5) {
      return (
        <p className="text-center text-lg sm:text-xl font-black text-amber-200">
          🏆 JACKPOT! You win {formatPrizeCurrency(prizeForBanner)}!
        </p>
      )
    }
    if (displayMatches === 4) {
      return (
        <p className="text-center text-base sm:text-lg font-bold text-amber-100/95">
          ★ 4 numbers matched — you win a share of {formatPrizeCurrency(prizeForBanner)}!
        </p>
      )
    }
    if (displayMatches === 3) {
      return (
        <p className="text-center text-base sm:text-lg font-bold text-green-100/90">
          ✓ 3 numbers matched — you win a share of {formatPrizeCurrency(prizeForBanner)}!
        </p>
      )
    }
    return (
      <p className="text-center text-base font-semibold text-gray-300">
        No match this time. Better luck next draw!
      </p>
    )
  })()

  if (winningNumbers.length !== 5) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-black/30 p-6 text-center", className)}>
        <p className="text-sm text-gray-400">
          Winning numbers will appear here after the draw is published.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-bold flex items-center gap-2 text-white">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Draw reveal
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={runReveal}
          disabled={phase === "running"}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <Play className="w-3.5 h-3.5 mr-2" />
          {phase === "running" ? "Revealing…" : "Play reveal again"}
        </Button>
      </div>

      {rolloverFromLastMonth > 0 && (
        <p className="text-xs font-medium text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
          This month&apos;s jackpot includes a {formatPrizeCurrency(rolloverFromLastMonth)} rollover from last
          month.
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4].map((i) => {
          const locked = revealed[i] !== null
          const isSpinning = phase === "running" && activeIndex === i && !locked
          const value = locked ? revealed[i]! : isSpinning ? spinDisplay : null
          const isMatch = locked && userNumbers.includes(revealed[i]!)

          return (
            <motion.div
              key={i}
              className={cn(
                "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg sm:text-xl font-black border-2 transition-colors",
                !locked && !isSpinning && "border-dashed border-white/35 text-white/50 bg-white/5",
                isSpinning && "border-white/40 bg-white/10 text-white",
                locked &&
                  !isMatch &&
                  "border-green-500/60 bg-green-600 text-white shadow-lg shadow-green-900/40",
                locked && isMatch && "border-amber-300 bg-gradient-to-br from-amber-400 to-amber-600 text-gray-900"
              )}
              animate={
                locked && isMatch
                  ? { scale: [1, 1.12, 1], boxShadow: ["0 0 0 0 rgba(251,191,36,0.5)", "0 0 0 12px rgba(251,191,36,0)", "0 0 0 0 rgba(251,191,36,0.5)"] }
                  : locked
                    ? { scale: [1, 1.08, 1] }
                    : {}
              }
              transition={
                locked && isMatch
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 420, damping: 18 }
              }
            >
              <AnimatePresence mode="wait">
                {value == null ? (
                  <motion.span
                    key="q"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xl"
                  >
                    ?
                  </motion.span>
                ) : (
                  <motion.span
                    key={`${i}-${locked ? "f" : "s"}-${value}`}
                    initial={{ scale: 0.6, opacity: 0.5, rotate: locked ? -18 : 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    {value}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-r from-gray-900/90 to-gray-800/90 px-4 py-5"
          >
            {bannerContent}
            <p className="text-center text-[11px] text-gray-500 mt-3 font-medium">
              Jackpot pool this draw {formatPrizeCurrency(jackpotPoolTotal)} · Based on active subscribers × fee ×
              40% / 35% / 25% tiers
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
