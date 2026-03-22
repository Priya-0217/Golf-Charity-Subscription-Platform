'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { BadgeCheck, CreditCard, ChevronRight } from 'lucide-react'

export function SubscriptionStatus({ status, planType }: { status: string; planType?: string }) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (priceId: string) => {
    setLoading(true)
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    })
    const { url } = await response.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  const isActive = status === 'active'

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isActive ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
          <BadgeCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Membership</p>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {isActive ? `${planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : 'Pro'} Member` : 'Free Account'}
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <p className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {status}
            </p>
          </div>
          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {isActive && planType && (
          <div className="p-4 bg-green-50/30 rounded-2xl border border-green-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Active Plan</p>
            <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {planType === 'yearly' ? 'Yearly Billing' : 'Monthly Billing'}
            </p>
          </div>
        )}

        {!isActive && (
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => handleSubscribe('price_1TDgnICjCqYNHI0m0G8xc1Io')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-green-600/20 flex items-center justify-between px-6 transition-all active:scale-95"
            >
              <span>Monthly ($10/mo)</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubscribe('price_1TDgpDCjCqYNHI0muleBt9jH')}
              disabled={loading}
              className="w-full border-green-600 text-green-600 hover:bg-green-50 h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-between px-6 transition-all active:scale-95"
            >
              <span>Yearly ($100/yr)</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5">!</div>
              <p className="text-[10px] font-bold text-yellow-700 leading-tight">
                Participate in draws and win prizes by upgrading to a Pro Member.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
