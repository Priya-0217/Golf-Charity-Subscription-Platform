"use client"

import { useEffect, useState } from "react"
import { Heart, Globe, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CharityImpactCardProps {
  userTotalDonated: number
  platformTotalDonated: number
  currentCharity?: {
    name: string
    logo_url?: string | null
  }
  className?: string
}

export function CharityImpactCard({
  userTotalDonated,
  platformTotalDonated,
  currentCharity,
  className,
}: CharityImpactCardProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const impactGoal = 500000 // Platform goal for the year
  const progressPercent = (platformTotalDonated / impactGoal) * 100

  return (
    <Card className={cn("overflow-hidden border-none shadow-xl bg-white text-gray-900", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Impact Overview
        </CardTitle>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-3 py-1 rounded-full">
          Goal: $500k
        </span>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Your Impact</p>
            <h3 className="text-2xl font-black text-gray-900">
              ${isMounted ? userTotalDonated.toLocaleString() : userTotalDonated}
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Raised</p>
            <h3 className="text-2xl font-black text-gray-900">
              ${isMounted ? platformTotalDonated.toLocaleString() : platformTotalDonated}
            </h3>
          </div>
        </div>

        {/* Impact Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>Progress to Goal</span>
            <span className="text-gray-900">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Selected Charity Highlight */}
        {currentCharity ? (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden">
              {currentCharity.logo_url ? (
                <img src={currentCharity.logo_url} alt={currentCharity.name} className="w-10 h-10 object-contain" />
              ) : (
                <Heart className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Cause</p>
              <h4 className="text-sm font-black text-gray-900 line-clamp-1">{currentCharity.name}</h4>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-center">
            <p className="text-xs text-gray-400 italic">No charity selected. Join the cause!</p>
          </div>
        )}

        {/* Global Impact Badge */}
        <div className="flex items-center justify-center gap-8 py-2">
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Growing</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="p-2 rounded-full bg-orange-50 text-orange-600">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impact</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
