'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/stores/uiStore'
import { PROJECT_COLORS } from '@/lib/utils/constants'
import toast from 'react-hot-toast'

export function CreateWorkspaceModal() {
  const { createWorkspaceModalOpen, setCreateWorkspaceModalOpen } = useUIStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#7C3AED')
  const [loading, setLoading] = useState(false)

  if (!createWorkspaceModalOpen) return null

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if org exists for user
    let orgId: string
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existingMember) {
      orgId = existingMember.organization_id
    } else {
      // Create default org
      const slug = user.email?.split('@')[0] ?? 'my-org'
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({ name: `${user.email?.split('@')[0]}'s Organization`, slug: `${slug}-${Date.now()}` })
        .select()
        .single()

      if (error || !org) {
        toast.error('Failed to create organization')
        setLoading(false)
        return
      }

      orgId = org.id
      await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: user.id,
        role: 'owner',
      })
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        slug,
        description: description.trim() || null,
        color,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create workspace')
      setLoading(false)
      return
    }

    // Add creator as owner member
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    })

    toast.success('Workspace created!')
    setCreateWorkspaceModalOpen(false)
    setName('')
    setDescription('')
    setLoading(false)

    // Reload page to show new workspace
    window.location.href = `/workspace/${workspace.slug}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Create workspace</h2>
          <button onClick={() => setCreateWorkspaceModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Workspace"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this workspace for?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {['#7C3AED', ...PROJECT_COLORS].map((c) => (
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
              onClick={() => setCreateWorkspaceModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
