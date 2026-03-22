"use client"

import { motion } from "framer-motion"
import { LucideIcon, Trophy, Users, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const iconMap = {
  trophy: Trophy,
  users: Users,
  trend: TrendingUp,
  dollar: DollarSign,
}

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: keyof typeof iconMap
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  iconClassName?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  iconClassName,
}: StatsCardProps) {
  const Icon = iconMap[icon]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("overflow-hidden border-none shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {title}
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {value}
              </h2>
              {description && (
                <p className="text-xs text-gray-400 font-medium">{description}</p>
              )}
            </div>
            <div className={cn("p-3 rounded-2xl bg-gray-50 text-gray-900", iconClassName)}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          {trend && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  trend.isPositive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-400 font-medium">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
