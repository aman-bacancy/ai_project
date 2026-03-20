import type { Priority, TaskStatus } from '@/types/app.types'

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' },
  high: { label: 'High', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  medium: { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  low: { label: 'Low', color: 'text-blue-500', bgColor: 'bg-blue-100' },
  none: { label: 'None', color: 'text-gray-400', bgColor: 'bg-gray-100' },
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  todo: { label: 'To Do', color: 'text-gray-600', bgColor: 'bg-gray-100', dotColor: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100', dotColor: 'bg-blue-500' },
  in_review: { label: 'In Review', color: 'text-purple-600', bgColor: 'bg-purple-100', dotColor: 'bg-purple-500' },
  done: { label: 'Done', color: 'text-green-600', bgColor: 'bg-green-100', dotColor: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-50', dotColor: 'bg-gray-300' },
}

export const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done', 'cancelled']
export const ALL_PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

export const DEFAULT_WORKSPACE_COLOR = '#7C3AED'
export const PROJECT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#10B981',
]
