import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AdminContext = {
  userId: string
  email: string | undefined
  fullName: string | null
}

/**
 * Server-only: require authenticated user with profiles.role === 'admin'.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: profile.full_name,
  }
}
