'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/stores/uiStore'
import { PROJECT_COLORS } from '@/lib/utils/constants'
import toast from 'react-hot-toast'
import type { Workspace } from '@/types/app.types'

export function CreateProjectModal() {
  const { createProjectModalOpen, setCreateProjectModalOpen } = useUIStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [workspaceId, setWorkspaceId] = useState('')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!createProjectModalOpen) return
    const supabase = createClient()
    supabase.from('workspaces').select('*').then(({ data }) => {
      if (data) {
        setWorkspaces(data)
        if (data.length > 0 && !workspaceId) setWorkspaceId(data[0].id)
      }
    })
  }, [createProjectModalOpen])

  if (!createProjectModalOpen) return null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !workspaceId) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description.trim() || null,
        color,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create project')
      setLoading(false)
      return
    }

    // Create a default list
    await supabase.from('lists').insert({
      project_id: project.id,
      name: 'Tasks',
      position: 0,
    })

    toast.success('Project created!')
    setCreateProjectModalOpen(false)
    setName('')
    setDescription('')
    setLoading(false)

    const ws = workspaces.find((w) => w.id === workspaceId)
    if (ws) {
      window.location.href = `/workspace/${ws.slug}/project/${project.id}`
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Create project</h2>
          <button onClick={() => setCreateProjectModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workspace *</label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this project about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !workspaceId}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
