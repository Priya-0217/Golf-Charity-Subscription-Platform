"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Trophy, CreditCard, Gift, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: "draw" | "subscription" | "winning" | "info"
  time: string
  isRead: boolean
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Draw Simulation Ready!",
      message: "Check your winning probability for the next draw.",
      type: "draw",
      time: "2h ago",
      isRead: false,
    },
    {
      id: "2",
      title: "Subscription Renewal",
      message: "Your monthly plan will renew in 3 days.",
      type: "subscription",
      time: "1d ago",
      isRead: false,
    },
    {
      id: "3",
      title: "Winning Alert!",
      message: "Congratulations! You won $50 in the last draw.",
      type: "winning",
      time: "2d ago",
      isRead: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "draw":
        return <Trophy className="w-4 h-4 text-green-500" />
      case "subscription":
        return <CreditCard className="w-4 h-4 text-blue-500" />
      case "winning":
        return <Gift className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
      >
        <Bell className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 z-50 origin-top-right"
            >
              <Card className="border-none shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                  <button className="text-[10px] font-black uppercase text-green-600 hover:text-green-700 tracking-widest">
                    Mark all read
                  </button>
                </div>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-4 flex gap-4 transition-colors hover:bg-gray-50",
                            !n.isRead && "bg-green-50/30"
                          )}
                        >
                          <div className="shrink-0 p-2 rounded-xl bg-white border border-gray-100 shadow-sm h-fit">
                            {getIcon(n.type)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 leading-normal">
                              {n.message}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">
                              {n.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 italic text-xs">
                      No notifications yet
                    </div>
                  )}
                </CardContent>
                <div className="p-3 bg-gray-50/50 text-center border-t border-gray-50">
                  <button className="text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 tracking-widest">
                    View All
                  </button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
