import { NextResponse } from 'next/server'
import { executeDraw } from '@/lib/draw-engine'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const result = await executeDraw(false)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[DRAW_EXECUTE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
