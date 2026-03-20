'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Clock, Bell, Settings,
  ChevronRight, Plus, PanelLeftClose, PanelLeftOpen,
  FolderOpen, Target, Search
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/lib/stores/uiStore'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, Project } from '@/types/app.types'
import { SidebarProjectTree } from './SidebarProjectTree'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-work', label: 'My Work', icon: Briefcase },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setCreateWorkspaceModalOpen } = useUIStore()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('workspaces')
      .select('*, workspace_members(role)')
      .then(({ data }) => {
        if (data) {
          const ws = data.map((w: any) => ({
            ...w,
            member_role: w.workspace_members?.[0]?.role,
          }))
          setWorkspaces(ws)
          if (ws.length > 0) {
            setExpandedWorkspaces(new Set([ws[0].id]))
          }
        }
      })
  }, [])

  function toggleWorkspace(wsId: string) {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev)
      if (next.has(wsId)) next.delete(wsId)
      else next.add(wsId)
      return next
    })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-200 z-40',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm truncate">Command Center</span>
          </Link>
        )}
        {!sidebarOpen && (
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <Target className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors flex-shrink-0',
            !sidebarOpen && 'hidden'
          )}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="p-3 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Main nav */}
        <div className="px-2 mb-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                  active
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                )}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Workspaces */}
        {sidebarOpen && (
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspaces</span>
              <button
                onClick={() => setCreateWorkspaceModalOpen(true)}
                className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                title="New workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {sidebarOpen && workspaces.map((ws) => (
          <div key={ws.id}>
            <button
              onClick={() => toggleWorkspace(ws.id)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: ws.color ?? '#7C3AED' }}
              />
              <span className="flex-1 text-left truncate text-xs font-medium">{ws.name}</span>
              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 text-slate-500 transition-transform',
                  expandedWorkspaces.has(ws.id) && 'rotate-90'
                )}
              />
            </button>
            {expandedWorkspaces.has(ws.id) && (
              <SidebarProjectTree workspaceId={ws.id} workspaceSlug={ws.slug} />
            )}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-slate-700 p-2">
        <Link
          href="/settings/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors',
            pathname.startsWith('/settings') && 'bg-slate-700 text-white'
          )}
          title={!sidebarOpen ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
