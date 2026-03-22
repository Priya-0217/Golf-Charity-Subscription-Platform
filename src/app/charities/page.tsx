'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Search, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Charity = Database['public']['Tables']['charities']['Row']

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCharities() {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching charities:', error)
      }
      if (data) setCharities(data)
      setLoading(false)
    }
    fetchCharities()
  }, [supabase])

  const filteredCharities = charities.filter((charity) =>
    charity.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectCharity = async (charityId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: charityId })
      .eq('id', user.id)

    if (!error) {
      alert('Charity selected successfully!')
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl"
          >
            Choose Your Impact
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-gray-600"
          >
            Select a charity that resonates with you. A portion of your subscription goes directly to them.
          </motion.p>
        </div>

        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search charities..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading charities...</p>
          </div>
        ) : filteredCharities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity, index) => (
              <motion.div
                key={charity.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {charity.logo_url && (
                  <img
                    src={charity.logo_url}
                    alt={charity.name}
                    className="w-16 h-16 rounded-lg mb-4 object-contain"
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{charity.name}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3">{charity.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-current" />
                    Raised: ${charity.total_raised.toLocaleString()}
                  </span>
                  <Button
                    onClick={() => handleSelectCharity(charity.id)}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Select
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No charities found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              We couldn't find any charities matching your search or there are no active charities at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
