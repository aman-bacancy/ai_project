import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ListViewPage } from './ListViewPage'

export default async function ListPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; listId: string }>
}) {
  const { workspaceSlug, projectId, listId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: list }, { data: project }, { data: customFields }] = await Promise.all([
    supabase.from('lists').select('*').eq('id', listId).single(),
    supabase.from('projects').select('*, lists(*), workspaces(id)').eq('id', projectId).single(),
    supabase.from('custom_field_definitions').select('*').eq('project_id', projectId).order('position'),
  ])

  const workspaceId = (project as any)?.workspaces?.id ?? (project as any)?.workspace_id
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role, user:user_profiles(*)')
    .eq('workspace_id', workspaceId ?? '')
    .limit(50)

  if (!list || !project) notFound()

  return (
    <ListViewPage
      list={list}
      project={project}
      workspaceSlug={workspaceSlug}
      members={members ?? []}
      customFields={customFields ?? []}
      currentUserId={user!.id}
    />
  )
}
