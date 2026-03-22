'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function safeNextPath(raw: FormDataEntryValue | null): string {
  if (raw == null || typeof raw !== 'string') return '/dashboard'
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return '/dashboard'
  if (t.includes('://')) return '/dashboard'
  return t
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = safeNextPath(formData.get('next'))

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const q = new URLSearchParams({ error: error.message })
    if (next !== '/dashboard') q.set('next', next)
    redirect(`/login?${q.toString()}`)
  }

  redirect(next)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
