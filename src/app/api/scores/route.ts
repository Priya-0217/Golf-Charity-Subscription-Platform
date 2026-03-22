import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { score, date } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 0. Ensure profile exists (Self-healing mechanism using admin client to bypass RLS)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      console.log('[SCORES_POST] Profile missing, creating one via Admin client for', user.email)
      const adminClient = createAdminClient()
      const { error: createError } = await adminClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || 'Golfer',
          subscription_status: 'inactive'
        })
      
      if (createError) {
        console.error('[SCORES_POST_PROFILE_CREATE_ERROR]', createError)
        return new NextResponse(JSON.stringify({ error: "Could not create user profile" }), { status: 500 })
      }
    }

    // 1. Insert the new score
    const { error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        score,
        date,
      })

    if (insertError) {
      console.error('[SCORES_INSERT_ERROR]', insertError)
      return new NextResponse(JSON.stringify({ error: insertError.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. Fetch all scores for the user ordered by date descending
    const { data: userScores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    // 3. Keep only the latest 5
    if (userScores && userScores.length > 5) {
      const idsToDelete = userScores.slice(5).map(s => s.id)
      await supabase
        .from('scores')
        .delete()
        .in('id', idsToDelete)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[SCORES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: scores, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json(scores)
  } catch (error: any) {
    console.error('[SCORES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
