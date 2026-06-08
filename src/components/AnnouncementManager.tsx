'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Announcement } from '@/lib/database.types'

interface Props {
  announcement?: Announcement
  editMode?: boolean
}

export default function AnnouncementManager({ announcement, editMode }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: announcement?.title ?? '',
    content: announcement?.content ?? '',
    pinned: announcement?.pinned ?? false,
  })

  function set(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      pinned: form.pinned,
      updated_at: new Date().toISOString(),
    }

    if (announcement) {
      const { error: err } = await supabase.from('announcements').update(payload).eq('id', announcement.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('announcements').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!announcement || !confirm('Supprimer cette annonce ?')) return
    await supabase.from('announcements').delete().eq('id', announcement.id)
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  if (!open) {
    if (editMode) {
      return (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="text-xs border border-[#B87333]/40 text-[#B87333] px-2 py-1 rounded hover:bg-[#B87333]/10">Modifier</button>
          <button onClick={handleDelete} className="text-xs border border-red-300 text-red-500 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
        </div>
      )
    }
    return (
      <button onClick={() => setOpen(true)} className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
        + Nouvelle annonce
      </button>
    )
  }

  return (
    <div className="bg-white/80 border border-[#E2B36A]/60 rounded-xl p-5 shadow mb-4">
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">{announcement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Titre *</label>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Contenu *</label>
          <textarea className={`${inputCls} h-28 resize-y`} value={form.content} onChange={e => set('content', e.target.value)} required />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} className="accent-[#9C3D6E]" />
          <span className="text-[#5A3318]">Épingler cette annonce</span>
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
