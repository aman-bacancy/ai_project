import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimerState {
  activeTaskId: string | null
  activeTaskTitle: string | null
  startedAt: number | null

  startTimer: (taskId: string, taskTitle: string) => void
  stopTimer: () => { taskId: string; startedAt: number } | null
  getElapsedSeconds: () => number
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeTaskTitle: null,
      startedAt: null,

      startTimer: (taskId, taskTitle) =>
        set({ activeTaskId: taskId, activeTaskTitle: taskTitle, startedAt: Date.now() }),

      stopTimer: () => {
        const { activeTaskId, startedAt } = get()
        if (!activeTaskId || !startedAt) return null
        set({ activeTaskId: null, activeTaskTitle: null, startedAt: null })
        return { taskId: activeTaskId, startedAt }
      },

      getElapsedSeconds: () => {
        const { startedAt } = get()
        if (!startedAt) return 0
        return Math.floor((Date.now() - startedAt) / 1000)
      },
    }),
    { name: 'task-timer' }
  )
)
