import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, Plus, Users } from 'lucide-react'

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*, projects(*, lists(count))')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) notFound()

  const projects = workspace.projects ?? []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-gray-500 mt-1">{workspace.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/${workspaceSlug}/members`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            Members
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.filter((p: any) => p.status === 'active').map((project: any) => (
          <Link
            key={project.id}
            href={`/workspace/${workspaceSlug}/project/${project.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: project.color ?? '#3B82F6' }}
              />
              <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{project.lists?.[0]?.count ?? 0} lists</span>
            </div>
          </Link>
        ))}

        {projects.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No projects yet in this workspace</p>
            <p className="text-sm text-gray-400">Create your first project to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
