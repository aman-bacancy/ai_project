'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderOpen, List, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/stores/uiStore'
import type { Project, List as ListType } from '@/types/app.types'

interface Props {
  workspaceId: string
  workspaceSlug: string
}

export function SidebarProjectTree({ workspaceId, workspaceSlug }: Props) {
  const pathname = usePathname()
  const { setCreateProjectModalOpen } = useUIStore()
  const [projects, setProjects] = useState<(Project & { lists: ListType[] })[]>([])
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('projects')
      .select('*, lists(*)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        if (data) setProjects(data as any)
      })
  }, [workspaceId])

  function toggleProject(projectId: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  return (
    <div className="ml-4 border-l border-slate-700">
      {projects.map((project) => {
        const projectHref = `/workspace/${workspaceSlug}/project/${project.id}`
        const isActive = pathname.startsWith(projectHref)
        const isExpanded = expandedProjects.has(project.id)

        return (
          <div key={project.id}>
            <div className="flex items-center group">
              <button
                onClick={() => toggleProject(project.id)}
                className={cn(
                  'flex-1 flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: project.color ?? '#3B82F6' }}
                />
                <span className="truncate text-left">{project.name}</span>
              </button>
            </div>

            {isExpanded && project.lists
              .filter((l) => !l.is_archived)
              .sort((a, b) => a.position - b.position)
              .map((list) => {
                const listHref = `/workspace/${workspaceSlug}/project/${project.id}/list/${list.id}`
                return (
                  <Link
                    key={list.id}
                    href={listHref}
                    className={cn(
                      'flex items-center gap-2 px-4 py-1 text-xs transition-colors ml-2',
                      pathname === listHref
                        ? 'text-purple-400'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <List className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{list.name}</span>
                  </Link>
                )
              })}
          </div>
        )
      })}

      <button
        onClick={() => setCreateProjectModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
      >
        <Plus className="w-3 h-3" />
        <span>Add project</span>
      </button>
    </div>
  )
}
