import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, actor:user_profiles!notifications_actor_id_fkey(*)')
    .eq('recipient_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <NotificationsClient notifications={notifications ?? []} />
}
