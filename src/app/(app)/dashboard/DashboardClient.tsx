'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, FolderOpen, Plus } from 'lucide-react'
import { formatDate, isOverdue } from '@/lib/utils/dates'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils/constants'
import { useUIStore } from '@/lib/stores/uiStore'
import type { Task, UserProfile, Workspace } from '@/types/app.types'

interface Props {
  profile: UserProfile | null
  myTasks: any[]
  overdueTasks: any[]
  workspaces: Workspace[]
}

export function DashboardClient({ profile, myTasks, overdueTasks, workspaces }: Props) {
  const { setCreateProjectModalOpen, setCreateWorkspaceModalOpen } = useUIStore()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myTasks.length}</p>
              <p className="text-sm text-gray-500">My open tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
              <p className="text-sm text-gray-500">Overdue tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
              <p className="text-sm text-gray-500">Workspaces</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Tasks</h2>
            <Link href="/my-work" className="text-sm text-purple-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {myTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No open tasks assigned to you</p>
              </div>
            ) : (
              myTasks.map((task: any) => {
                const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
                const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
                const overdue = isOverdue(task.due_date)
                return (
                  <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {task.lists?.projects?.workspaces?.name} / {task.lists?.projects?.name} / {task.lists?.name}
                      </p>
                    </div>
                    {task.due_date && (
                      <span className={`text-xs flex-shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityCfg.bgColor} ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Workspaces */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Workspaces</h2>
            <button
              onClick={() => setCreateWorkspaceModalOpen(true)}
              className="text-sm text-purple-600 hover:underline"
            >
              New
            </button>
          </div>
          <div className="p-3 space-y-1">
            {workspaces.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 mb-3">No workspaces yet</p>
                <button
                  onClick={() => setCreateWorkspaceModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create workspace
                </button>
              </div>
            ) : (
              workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: ws.color ?? '#7C3AED' }}
                  >
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                    {ws.description && (
                      <p className="text-xs text-gray-400 truncate">{ws.description}</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overdue tasks alert */}
      {overdueTasks.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-medium text-red-800 text-sm">
              {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}
            </h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 text-sm">
                <span className="text-red-700 font-medium flex-1 truncate">{task.title}</span>
                <span className="text-red-500 text-xs flex-shrink-0">{formatDate(task.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
