'use client'

import { useState } from 'react'
import { Clock, Play, Square } from 'lucide-react'
import { formatDateTime, formatDuration } from '@/lib/utils/dates'
import { useTimerStore } from '@/lib/stores/timerStore'

interface Props {
  entries: any[]
}

export function TimesheetsClient({ entries }: Props) {
  const { activeTaskId, activeTaskTitle, startedAt, stopTimer, getElapsedSeconds } = useTimerStore()
  const [elapsed, setElapsed] = useState(0)

  // Update elapsed every second if timer is running
  useState(() => {
    if (!activeTaskId) return
    const interval = setInterval(() => setElapsed(getElapsedSeconds()), 1000)
    return () => clearInterval(interval)
  })

  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0)

  // Group by date
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.started_at).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-500 mt-1">Last 30 days • Total: {formatDuration(totalSeconds)}</p>
        </div>

        {/* Active timer display */}
        {activeTaskId && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-xs text-green-600 font-medium">Timer running</p>
              <p className="text-sm font-bold text-green-800">{formatDuration(elapsed)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dayEntries]) => {
          const dayTotal = (dayEntries as any[]).reduce((sum, e) => sum + (e.duration ?? 0), 0)
          return (
            <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">{date}</span>
                <span className="text-sm text-gray-500">{formatDuration(dayTotal)}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {(dayEntries as any[]).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.task?.title ?? 'Unknown task'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {entry.task?.lists?.projects?.name} / {entry.task?.lists?.name}
                      </p>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-500 truncate max-w-48">{entry.description}</p>
                    )}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.duration ? formatDuration(entry.duration) : 'Running...'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {entry.ended_at && ` — ${new Date(entry.ended_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {entries.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No time entries in the last 30 days</p>
            <p className="text-sm text-gray-400 mt-1">Start tracking time from a task detail view</p>
          </div>
        )}
      </div>
    </div>
  )
}
