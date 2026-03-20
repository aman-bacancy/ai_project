import { createClient } from '@/lib/supabase/server'
import { MyWorkClient } from './MyWorkClient'

export default async function MyWorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, lists(name, projects(name, color, workspaces(name, slug))), assignee:user_profiles!tasks_assignee_id_fkey(*)')
    .eq('assignee_id', user!.id)
    .eq('is_archived', false)
    .order('due_date', { ascending: true, nullsFirst: false })

  return <MyWorkClient tasks={tasks ?? []} />
}
