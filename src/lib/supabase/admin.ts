import { createClient } from '@supabase/supabase-js'

/** Service-role client: omit strict generated schema so inserts match live Supabase tables during iteration. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
