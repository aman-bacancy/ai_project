'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react'
import { STATUS_CONFIG, PRIORITY_CONFIG, ALL_STATUSES } from '@/lib/utils/constants'
import { formatDate, isOverdue } from '@/lib/utils/dates'
import type { TaskStatus } from '@/types/app.types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tasks: any[]
}

export function MyWorkClient({ tasks: initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all')

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'all') return true
    return t.status === activeFilter
  })

  const grouped = ALL_STATUSES.reduce((acc, status) => {
    const statusTasks = filteredTasks.filter((t) => t.status === status)
    if (statusTasks.length > 0) acc[status] = statusTasks
    return acc
  }, {} as Record<string, any[]>)

  async function updateStatus(taskId: string, status: TaskStatus) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
        <p className="text-gray-500 mt-1">All tasks assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', ...ALL_STATUSES] as const).map((status) => {
          const cfg = status === 'all' ? null : STATUS_CONFIG[status]
          const count = status === 'all' ? tasks.length : tasks.filter((t) => t.status === status).length
          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cfg ? cfg.label : 'All'} ({count})
            </button>
          )
        })}
      </div>

      {/* Tasks grouped by status */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ALL_STATUSES.filter((s) => grouped[s]).map((status) => {
            const statusCfg = STATUS_CONFIG[status]
            return (
              <div key={status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dotColor}`} />
                  <span className="text-sm font-semibold text-gray-700">{statusCfg.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    {grouped[status].length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {grouped[status].map((task: any) => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
                    const overdue = isOverdue(task.due_date)
                    return (
                      <div key={task.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                        <button
                          onClick={() => {
                            const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
                            updateStatus(task.id, nextStatus)
                          }}
                          className="flex-shrink-0"
                        >
                          {task.status === 'done'
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'} truncate`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {task.lists?.projects?.workspaces?.name} / {task.lists?.projects?.name} / {task.lists?.name}
                          </p>
                        </div>
                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                            {overdue && <AlertTriangle className="w-3 h-3" />}
                            <Clock className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${priorityCfg.bgColor} ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
