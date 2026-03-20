import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  activeTaskId: string | null
  createTaskModalOpen: boolean
  createTaskListId: string | null
  createProjectModalOpen: boolean
  createWorkspaceModalOpen: boolean

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setActiveTaskId: (id: string | null) => void
  openCreateTask: (listId: string) => void
  closeCreateTask: () => void
  setCreateProjectModalOpen: (open: boolean) => void
  setCreateWorkspaceModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTaskId: null,
  createTaskModalOpen: false,
  createTaskListId: null,
  createProjectModalOpen: false,
  createWorkspaceModalOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
  openCreateTask: (listId) => set({ createTaskModalOpen: true, createTaskListId: listId }),
  closeCreateTask: () => set({ createTaskModalOpen: false, createTaskListId: null }),
  setCreateProjectModalOpen: (open) => set({ createProjectModalOpen: open }),
  setCreateWorkspaceModalOpen: (open) => set({ createWorkspaceModalOpen: open }),
}))
