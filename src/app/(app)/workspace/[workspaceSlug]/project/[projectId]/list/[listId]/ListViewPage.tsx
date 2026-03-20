'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutList, Columns3, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { STATUS_CONFIG, PRIORITY_CONFIG, ALL_STATUSES } from '@/lib/utils/constants'
import { formatDate, isOverdue } from '@/lib/utils/dates'
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer'
import { TaskQuickCreate } from '@/components/tasks/TaskQuickCreate'
import { BoardView } from '@/components/views/BoardView'
import type { Task, List, Project, CustomFieldDefinition } from '@/types/app.types'

interface Props {
  list: List
  project: Project & { lists: List[] }
  workspaceSlug: string
  members: any[]
  customFields: CustomFieldDefinition[]
  currentUserId: string
}

type ViewMode = 'list' | 'board'

export function ListViewPage({ list, project, workspaceSlug, members, customFields, currentUserId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewMode>('list')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [currentListId, setCurrentListId] = useState(list.id)

  const fetchTasks = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*, task_tags(tags(*)), custom_field_values(*, field:custom_field_definitions(*))')
      .eq('list_id', currentListId)
      .eq('is_archived', false)
      .is('parent_task_id', null)
      .order('position')

    if (data) {
      // Fetch assignee profiles separately (assignee_id → auth.users, not user_profiles directly)
      const assigneeIds = [...new Set(data.map((t: any) => t.assignee_id).filter(Boolean))]
      const profileMap: Record<string, any> = {}
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles').select('*').in('id', assigneeIds)
        ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
      }
      setTasks(data.map((t: any) => ({
        ...t,
        assignee: t.assignee_id ? (profileMap[t.assignee_id] ?? null) : null,
        tags: t.task_tags?.map((tt: any) => tt.tags) ?? [],
        custom_field_values: t.custom_field_values ?? [],
      })))
    }
    setLoading(false)
  }, [currentListId])

  useEffect(() => {
    fetchTasks()

    // Realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks-${currentListId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `list_id=eq.${currentListId}`,
      }, () => fetchTasks())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentListId, fetchTasks])

  async function handleStatusChange(taskId: string, status: string) {
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: status as any } : t))
  }

  async function handleTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task])
    setShowQuickCreate(false)
  }

  const grouped = ALL_STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status)
    return acc
  }, {} as Record<string, Task[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Project header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: project.color ?? '#3B82F6' }} />
          <span>{project.name}</span>
          <span>/</span>
          <span className="font-medium text-gray-900">{list.name}</span>
        </div>

        {/* List tabs */}
        <div className="flex gap-1 ml-4 overflow-x-auto">
          {project.lists.filter((l) => !l.is_archived).map((l) => (
            <button
              key={l.id}
              onClick={() => setCurrentListId(l.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap',
                currentListId === l.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('list')}
              className={cn('p-1.5 rounded-md transition-colors', activeView === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200')}
              title="List view"
            >
              <LayoutList className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setActiveView('board')}
              className={cn('p-1.5 rounded-md transition-colors', activeView === 'board' ? 'bg-white shadow-sm' : 'hover:bg-gray-200')}
              title="Board view"
            >
              <Columns3 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <button
            onClick={() => setShowQuickCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'board' ? (
          <BoardView
            tasks={tasks}
            onTaskClick={setActiveTaskId}
            onStatusChange={handleStatusChange}
            onTaskCreated={handleTaskCreated}
            listId={currentListId}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="p-6">
            {ALL_STATUSES.map((status) => {
              const statusTasks = grouped[status]
              if (statusTasks.length === 0 && status !== 'todo') return null
              const cfg = STATUS_CONFIG[status]

              return (
                <div key={status} className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                    <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-2">
                    {statusTasks.length === 0 ? (
                      <div className="py-4 px-5 text-sm text-gray-400 italic">No tasks</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {statusTasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onClick={() => setActiveTaskId(task.id)}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {status === 'todo' && (
                    <button
                      onClick={() => setShowQuickCreate(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Add task
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task Quick Create Modal */}
      {showQuickCreate && (
        <TaskQuickCreate
          listId={currentListId}
          currentUserId={currentUserId}
          onCreated={handleTaskCreated}
          onClose={() => setShowQuickCreate(false)}
        />
      )}

      {/* Task Detail Drawer */}
      {activeTaskId && (
        <TaskDetailDrawer
          taskId={activeTaskId}
          members={members}
          customFields={customFields}
          currentUserId={currentUserId}
          onClose={() => setActiveTaskId(null)}
          onUpdate={(updated) => setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t))}
        />
      )}
    </div>
  )
}

function TaskRow({ task, onClick, onStatusChange }: {
  task: Task
  onClick: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const statusCfg = STATUS_CONFIG[task.status]
  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date)

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer group"
      onClick={onClick}
    >
      {/* Status dot button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          const statuses = ALL_STATUSES
          const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length]
          onStatusChange(task.id, next)
        }}
        className={`w-3 h-3 rounded-full border-2 border-current flex-shrink-0 ${statusCfg.color} hover:opacity-70`}
        title={`Status: ${statusCfg.label}`}
      />

      {/* Title */}
      <span className={cn(
        'flex-1 text-sm text-gray-900 truncate',
        task.status === 'done' && 'line-through text-gray-400',
        task.status === 'cancelled' && 'line-through text-gray-300'
      )}>
        {task.title}
      </span>

      {/* Priority */}
      <span className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden group-hover:block', priorityCfg.bgColor, priorityCfg.color)}>
        {priorityCfg.label}
      </span>

      {/* Assignee */}
      {task.assignee && (
        <div
          className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs text-purple-700 font-medium flex-shrink-0"
          title={task.assignee.full_name ?? ''}
        >
          {task.assignee.full_name?.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Due date */}
      {task.due_date && (
        <span className={cn('text-xs flex-shrink-0', overdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
          {formatDate(task.due_date)}
        </span>
      )}
    </div>
  )
}
