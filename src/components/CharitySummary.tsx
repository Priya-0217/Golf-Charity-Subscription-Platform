'use client'

import { motion } from 'framer-motion'
import { Heart, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Charity {
  id: string
  name: string
  logo_url: string | null
  total_raised: number
}

export function CharitySummary({ charity, percent }: { charity: Charity | null, percent: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-red-100">
          <Heart className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Your Impact</h3>
      </div>

      <div className="space-y-4">
        {charity ? (
          <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              {charity.logo_url && (
                <img
                  src={charity.logo_url}
                  alt={charity.name}
                  className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-red-100"
                />
              )}
              <h4 className="font-bold text-gray-900">{charity.name}</h4>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>Contribution %</p>
              <p className="font-bold text-red-600">{percent}%</p>
            </div>
            <Link
              href="/charities"
              className="mt-4 flex items-center justify-between p-3 bg-white rounded-lg text-sm text-gray-900 hover:bg-gray-50 border border-red-100 transition-colors"
            >
              <span>Change Charity</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">You haven't selected a charity yet.</p>
            <Link
              href="/charities"
              className="inline-flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700"
            >
              Choose a charity
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
