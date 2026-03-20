import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function ProjectPage({ params }: { params: Promise<{ workspaceSlug: string; projectId: string }> }) {
  const { workspaceSlug, projectId } = await params
  const supabase = await createClient()

  const { data: lists } = await supabase
    .from('lists')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_archived', false)
    .order('position')
    .limit(1)

  if (lists && lists.length > 0) {
    redirect(`/workspace/${workspaceSlug}/project/${projectId}/list/${lists[0].id}`)
  }

  // No lists - show empty state
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) notFound()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No lists yet</h2>
        <p className="text-gray-500 mb-4">Create your first list to start adding tasks</p>
      </div>
    </div>
  )
}
