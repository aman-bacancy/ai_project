import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: myTasks }, { data: overdueTasks }, { data: workspaces }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('tasks')
      .select('*, lists(name, projects(name, workspaces(name, slug)))')
      .eq('assignee_id', user!.id)
      .not('status', 'in', '("done","cancelled")')
      .order('due_date', { ascending: true })
      .limit(10),
    supabase
      .from('tasks')
      .select('*, lists(name, projects(name, workspaces(name, slug)))')
      .eq('assignee_id', user!.id)
      .lt('due_date', new Date().toISOString())
      .not('status', 'in', '("done","cancelled")')
      .limit(5),
    supabase.from('workspaces').select('*').limit(10),
  ])

  return (
    <DashboardClient
      profile={profile}
      myTasks={myTasks ?? []}
      overdueTasks={overdueTasks ?? []}
      workspaces={workspaces ?? []}
    />
  )
}
