'use client'

import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { formatRelative } from '@/lib/utils/dates'
import { createClient } from '@/lib/supabase/client'

interface Props {
  notifications: any[]
}

const TYPE_LABELS: Record<string, string> = {
  'task.assigned': 'assigned you a task',
  'task.comment': 'commented on a task',
  'task.mentioned': 'mentioned you in a comment',
  'task.status_changed': 'updated a task status',
  'task.due_soon': 'task is due soon',
}

export function NotificationsClient({ notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial)

  async function markAllRead() {
    const supabase = createClient()
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notif.is_read ? 'bg-purple-50' : ''
                }`}
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {notif.actor?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{notif.actor?.full_name ?? 'Someone'}</span>
                    {' '}{TYPE_LABELS[notif.type] ?? notif.type}
                  </p>
                  {notif.data?.task_title && (
                    <p className="text-sm text-gray-600 mt-0.5 truncate">"{notif.data.task_title}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
