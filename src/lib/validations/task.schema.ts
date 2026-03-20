import { z } from 'zod'

export const createTaskSchema = z.object({
  list_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).default('none'),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  estimated_hours: z.number().min(0).optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
  milestone_id: z.string().uuid().optional().nullable(),
})

export const updateTaskSchema = createTaskSchema.partial().omit({ list_id: true })

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
