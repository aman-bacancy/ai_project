export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type OrgRole = 'owner' | 'admin' | 'member' | 'guest'

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  timezone: string
  preferences: Record<string, unknown>
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  member_role?: WorkspaceRole
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'on_hold'
  color: string | null
  icon: string | null
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  project_id: string
  name: string
  description: string | null
  color: string | null
  position: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  workspace_id: string
  name: string
  color: string | null
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  due_date: string | null
  status: 'open' | 'completed'
  created_at: string
}

export interface Task {
  id: string
  list_id: string
  parent_task_id: string | null
  milestone_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  position: number
  assignee_id: string | null
  created_by: string
  due_date: string | null
  start_date: string | null
  estimated_hours: number | null
  time_tracked: number
  is_archived: boolean
  created_at: string
  updated_at: string
  // Joined fields
  assignee?: UserProfile
  tags?: Tag[]
  subtasks?: Task[]
  custom_field_values?: CustomFieldValue[]
  _count?: {
    subtasks: number
    comments: number
    attachments: number
  }
}

export interface Comment {
  id: string
  task_id: string
  author_id: string
  body: string
  is_edited: boolean
  created_at: string
  updated_at: string
  author?: UserProfile
}

export interface Attachment {
  id: string
  task_id: string
  uploaded_by: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  created_at: string
  uploader?: UserProfile
}

export interface TimeEntry {
  id: string
  task_id: string
  user_id: string
  description: string | null
  started_at: string
  ended_at: string | null
  duration: number | null
  is_billable: boolean
  created_at: string
  updated_at: string
  user?: UserProfile
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown' | 'url' | 'email'

export interface CustomFieldDefinition {
  id: string
  project_id: string
  name: string
  field_type: CustomFieldType
  position: number
  is_required: boolean
  config: {
    options?: { id: string; label: string; color: string }[]
    format?: 'integer' | 'decimal' | 'percent' | 'currency'
    unit?: string
    include_time?: boolean
  }
  created_at: string
}

export interface CustomFieldValue {
  id: string
  field_id: string
  task_id: string
  value_text: string | null
  value_number: number | null
  value_date: string | null
  value_bool: boolean | null
  value_json: unknown
  updated_at: string
  field?: CustomFieldDefinition
}

export interface Notification {
  id: string
  recipient_id: string
  actor_id: string | null
  type: 'task.assigned' | 'task.comment' | 'task.mentioned' | 'task.due_soon' | 'task.status_changed'
  entity_type: string
  entity_id: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
  actor?: UserProfile
}

export interface ActivityLog {
  id: string
  task_id: string | null
  project_id: string | null
  actor_id: string
  action: string
  old_value: unknown
  new_value: unknown
  created_at: string
  actor?: UserProfile
}

export interface FilterState {
  assignees: string[]
  statuses: TaskStatus[]
  priorities: Priority[]
  tags: string[]
  dueDateFrom: string | null
  dueDateTo: string | null
  search: string
}
