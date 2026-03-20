'use client'

import { useUIStore } from '@/lib/stores/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { CreateProjectModal } from './CreateProjectModal'
import { cn } from '@/lib/utils/cn'

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-200',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <CreateWorkspaceModal />
      <CreateProjectModal />
    </div>
  )
}
