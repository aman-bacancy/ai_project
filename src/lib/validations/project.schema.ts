import { z } from 'zod'

export const createProjectSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  is_private: z.boolean().default(false),
})

export const updateProjectSchema = createProjectSchema.partial().omit({ workspace_id: true })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
