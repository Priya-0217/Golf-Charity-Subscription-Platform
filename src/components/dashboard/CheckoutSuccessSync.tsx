'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * After Checkout, Stripe redirects with ?success=true. Webhooks may lag (especially locally).
 * This one-shot sync pulls the active subscription from Stripe into Supabase.
 */
export function CheckoutSuccessSync() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') !== 'true') return
    ran.current = true

    void (async () => {
      try {
        await fetch('/api/stripe/sync-subscription', { method: 'POST' })
      } finally {
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        const q = url.searchParams.toString()
        router.replace(url.pathname + (q ? `?${q}` : ''))
        router.refresh()
      }
    })()
  }, [router])

  return null
}
