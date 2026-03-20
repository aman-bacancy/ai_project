import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createTaskSchema } from '@/lib/validations/task.schema'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const listId = searchParams.get('list_id')

  let query = supabase
    .from('tasks')
    .select('*, assignee:user_profiles!tasks_assignee_id_fkey(*)')
    .eq('is_archived', false)
    .order('position')

  if (listId) query = query.eq('list_id', listId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...parsed.data, created_by: user.id, position: Date.now() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('activity_log').insert({
    task_id: data.id,
    actor_id: user.id,
    action: 'task.created',
    new_value: { title: data.title },
  })

  return NextResponse.json(data, { status: 201 })
}
