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

    try {
      // Get existing org or create one — use maybeSingle to avoid error on no rows
      let orgId: string
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (existingMember) {
        orgId = existingMember.organization_id
      } else {
        // Generate org ID client-side to avoid RLS read-back issue
        const { data: newId } = await supabase.rpc('gen_random_uuid').single() as any
        orgId = newId ?? crypto.randomUUID()

        const emailSlug = user.email?.split('@')[0] ?? 'user'
        const { error: orgError } = await supabase
          .from('organizations')
          .insert({ id: orgId, name: `${emailSlug}'s Organization`, slug: `${emailSlug}-org-${Date.now()}` })

        if (orgError) throw new Error('org: ' + orgError.message)

        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({ organization_id: orgId, user_id: user.id, role: 'owner' })

        if (memberError) throw new Error('org_member: ' + memberError.message)
      }

      // Generate workspace ID client-side
      const workspaceId = crypto.randomUUID()
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

      const { error: wsError } = await supabase
        .from('workspaces')
        .insert({
          id: workspaceId,
          organization_id: orgId,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          color,
          created_by: user.id,
        })

      if (wsError) throw new Error('workspace: ' + wsError.message)

      const { error: wsMemberError } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: user.id, role: 'owner' })

      if (wsMemberError) throw new Error('ws_member: ' + wsMemberError.message)

      toast.success('Workspace created!')
      setCreateWorkspaceModalOpen(false)
      setName('')
      setDescription('')
      window.location.href = `/workspace/${slug}`
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to create workspace: ' + err.message)
    } finally {
      setLoading(false)
    }
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
