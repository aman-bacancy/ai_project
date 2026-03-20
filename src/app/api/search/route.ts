import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json({ tasks: [], projects: [] })

  const searchTerm = q.split(' ').filter(Boolean).join(' & ')

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, priority, list_id, lists(name, projects(name, workspaces(name, slug)))')
      .textSearch('title', searchTerm, { type: 'websearch' })
      .eq('is_archived', false)
      .limit(10),
    supabase
      .from('projects')
      .select('id, name, description, color, workspace_id, workspaces(name, slug)')
      .ilike('name', `%${q}%`)
      .limit(5),
  ])

  return NextResponse.json({ tasks: tasks ?? [], projects: projects ?? [] })
}
