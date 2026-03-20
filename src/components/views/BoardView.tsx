'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { STATUS_CONFIG, ALL_STATUSES } from '@/lib/utils/constants'
import { PRIORITY_CONFIG } from '@/lib/utils/constants'
import { formatDate, isOverdue } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/types/app.types'

interface Props {
  tasks: Task[]
  onTaskClick: (taskId: string) => void
  onStatusChange: (taskId: string, status: string) => void
  onTaskCreated: (task: Task) => void
  listId: string
  currentUserId: string
}

export function BoardView({ tasks, onTaskClick, onStatusChange, onTaskCreated, listId, currentUserId }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const columns = ALL_STATUSES.filter((s) => s !== 'cancelled').map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    if (ALL_STATUSES.includes(newStatus)) {
      onStatusChange(taskId, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {columns.map(({ status, tasks: columnTasks }) => {
          const cfg = STATUS_CONFIG[status]
          return (
            <BoardColumn
              key={status}
              status={status}
              label={cfg.label}
              dotColor={cfg.dotColor}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onTaskCreated={onTaskCreated}
              listId={listId}
              currentUserId={currentUserId}
            />
          )
        })}
      </div>
    </DndContext>
  )
}

interface ColumnProps {
  status: TaskStatus
  label: string
  dotColor: string
  tasks: Task[]
  onTaskClick: (id: string) => void
  onTaskCreated: (task: Task) => void
  listId: string
  currentUserId: string
}

function BoardColumn({ status, label, dotColor, tasks, onTaskClick, onTaskCreated, listId, currentUserId }: ColumnProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState(false)
  const { setNodeRef, isOver } = useSortable({ id: status, data: { type: 'column' } })

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setCreating(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .insert({ list_id: listId, title: newTaskTitle.trim(), status, created_by: currentUserId, position: Date.now() })
      .select('*')
      .single()

    if (data) onTaskCreated(data)
    setNewTaskTitle('')
    setAdding(false)
    setCreating(false)
  }

  return (
    <div
      ref={setNodeRef}
      id={status}
      className={cn(
        'flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border-2 transition-colors',
        isOver ? 'border-purple-300 bg-purple-50' : 'border-transparent'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 px-2 pb-2 space-y-2 min-h-16">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </div>
      </SortableContext>

      {/* Quick add */}
      {adding && (
        <form onSubmit={handleAddTask} className="px-2 pb-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
            autoFocus
            onBlur={() => { if (!newTaskTitle.trim()) setAdding(false) }}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg mx-2 mb-2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      )}
    </div>
  )
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs px-1.5 py-0.5 rounded', priorityCfg.bgColor, priorityCfg.color)}>
          {priorityCfg.label}
        </span>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={cn('text-xs', overdue ? 'text-red-500' : 'text-gray-400')}>
              {formatDate(task.due_date)}
            </span>
          )}
          {task.assignee && (
            <div className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-xs text-purple-700 font-medium">
              {task.assignee.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
