'use client'

import { useState, useEffect } from 'react'
import {
  X, Clock, Calendar, User, Flag, AlignLeft, MessageSquare,
  Paperclip, ChevronDown, Check, Trash2, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import { STATUS_CONFIG, PRIORITY_CONFIG, ALL_STATUSES, ALL_PRIORITIES } from '@/lib/utils/constants'
import { formatRelative, formatDateTime } from '@/lib/utils/dates'
import type { Task, Comment, CustomFieldDefinition } from '@/types/app.types'
import toast from 'react-hot-toast'

interface Props {
  taskId: string
  members: any[]
  customFields: CustomFieldDefinition[]
  currentUserId: string
  onClose: () => void
  onUpdate: (task: Partial<Task>) => void
}

export function TaskDetailDrawer({ taskId, members, customFields, currentUserId, onClose, onUpdate }: Props) {
  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('tasks')
      .select('*, task_tags(tags(*))')
      .eq('id', taskId)
      .single()
      .then(async ({ data, error }) => {
        if (error) { console.error('Task fetch error:', error); return }
        if (data) {
          // Fetch assignee profile separately to avoid broken FK join
          let assignee = null
          if (data.assignee_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.assignee_id)
              .maybeSingle()
            assignee = profile
          }
          setTask({ ...data, assignee, tags: data.task_tags?.map((tt: any) => tt.tags) ?? [] })
          setTitle(data.title)
        }
      })

    supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at')
      .then(async ({ data }) => {
        if (!data) return
        // Fetch author profiles separately
        const authorIds = [...new Set(data.map((c: any) => c.author_id))]
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', authorIds)
        const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
        setComments(data.map((c: any) => ({ ...c, author: profileMap[c.author_id] ?? null })))
      })

    // Realtime for comments
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, (payload) => {
        supabase
          .from('comments')
          .select('*')
          .eq('id', payload.new.id)
          .single()
          .then(async ({ data }) => {
            if (!data) return
            const { data: profile } = await supabase
              .from('user_profiles').select('*').eq('id', data.author_id).maybeSingle()
            setComments((prev) => [...prev, { ...data, author: profile }])
          })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [taskId])

  async function updateTask(updates: Partial<Task>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (!error && data) {
      setTask((prev: any) => ({ ...prev, ...data }))
      onUpdate(data)
    }
  }

  async function saveTitle() {
    if (!title.trim() || title === task?.title) {
      setEditingTitle(false)
      return
    }
    await updateTask({ title: title.trim() })
    setEditingTitle(false)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmittingComment(true)

    const supabase = createClient()
    await supabase.from('comments').insert({
      task_id: taskId,
      author_id: currentUserId,
      body: newComment.trim(),
    })

    setNewComment('')
    setSubmittingComment(false)
  }

  async function deleteComment(commentId: string) {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1" onClick={onClose} />
        <div className="w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
  const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          {/* Status */}
          <select
            value={task.status}
            onChange={(e) => updateTask({ status: e.target.value as any })}
            className={cn('text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500', statusCfg.bgColor, statusCfg.color)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>

          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Title */}
            {editingTitle ? (
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() } }}
                className="w-full text-xl font-bold text-gray-900 resize-none border-0 outline-none focus:ring-0 p-0 -mx-0"
                rows={2}
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-bold text-gray-900 cursor-text hover:bg-gray-50 rounded px-1 -mx-1 py-1"
                onClick={() => setEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}

            {/* Properties */}
            <div className="mt-6 space-y-3">
              {/* Priority */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </span>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask({ priority: e.target.value as any })}
                  className={cn('text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none', priorityCfg.bgColor, priorityCfg.color)}
                >
                  {ALL_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Assignee
                </span>
                <select
                  value={task.assignee_id ?? ''}
                  onChange={(e) => updateTask({ assignee_id: e.target.value || null })}
                  className="text-sm bg-transparent border-0 text-gray-700 cursor-pointer focus:outline-none focus:ring-0"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user?.full_name ?? m.user_id}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Due date
                </span>
                <input
                  type="date"
                  value={task.due_date ? task.due_date.split('T')[0] : ''}
                  onChange={(e) => updateTask({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="text-sm bg-transparent border-0 text-gray-700 cursor-pointer focus:outline-none"
                />
              </div>

              {/* Time tracked */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Time tracked
                </span>
                <span className="text-sm text-gray-700">
                  {task.time_tracked > 0 ? `${Math.round(task.time_tracked * 10) / 10}h` : '—'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Description</span>
              </div>
              <textarea
                value={task.description ?? ''}
                onChange={(e) => setTask((prev: any) => ({ ...prev, description: e.target.value }))}
                onBlur={(e) => updateTask({ description: e.target.value || null })}
                placeholder="Add a description..."
                rows={4}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Activity ({comments.length})</span>
            </div>

            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-xs text-purple-700 font-bold flex-shrink-0">
                    {comment.author?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{comment.author?.full_name}</span>
                      <span className="text-xs text-gray-400">{formatRelative(comment.created_at)}</span>
                      {comment.author_id === currentUserId && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="ml-auto p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-300 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitComment} className="flex gap-3">
              <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="mt-2 px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Comment'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
