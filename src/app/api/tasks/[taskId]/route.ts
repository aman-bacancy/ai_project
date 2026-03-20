import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateTaskSchema } from '@/lib/validations/task.schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:user_profiles!tasks_assignee_id_fkey(*), task_tags(tags(*)), comments(*, author:user_profiles!comments_author_id_fkey(*))')
    .eq('id', taskId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Get old task for activity log
  const { data: oldTask } = await supabase.from('tasks').select('status, priority, assignee_id').eq('id', taskId).single()

  const { data, error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', taskId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log significant changes
  if (oldTask && parsed.data.status && oldTask.status !== parsed.data.status) {
    await supabase.from('activity_log').insert({
      task_id: taskId,
      actor_id: user.id,
      action: 'task.status_changed',
      old_value: { status: oldTask.status },
      new_value: { status: parsed.data.status },
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
