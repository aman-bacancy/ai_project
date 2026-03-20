import { createClient } from '@/lib/supabase/server'
import { TimesheetsClient } from './TimesheetsClient'

export default async function TimesheetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, task:tasks(id, title, list_id, lists(name, projects(name))), user:user_profiles(*)')
    .eq('user_id', user!.id)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: false })

  return <TimesheetsClient entries={entries ?? []} />
}
