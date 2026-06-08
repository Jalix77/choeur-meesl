'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Song { id: string; title: string }
interface Rehearsal {
  id: string
  starts_at: string
  location: string | null
  notes: string | null
  rehearsal_songs?: { songs: Song; order_index: number }[]
}

interface Props {
  songs: Song[]
  rehearsal?: Rehearsal
  editMode?: boolean
}

export default function RehearsalManager({ songs, rehearsal, editMode }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    starts_at: rehearsal?.starts_at?.slice(0, 16) ?? '',
    location: rehearsal?.location ?? '',
    notes: rehearsal?.notes ?? '',
  })
  const [selectedSongs, setSelectedSongs] = useState<string[]>(
    rehearsal?.rehearsal_songs?.map(rs => rs.songs.id) ?? []
  )

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      starts_at: new Date(form.starts_at).toISOString(),
      location: form.location || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    let rehearsalId = rehearsal?.id
    if (rehearsal) {
      await supabase.from('rehearsals').update(payload).eq('id', rehearsal.id)
    } else {
      const { data, error: err } = await supabase.from('rehearsals').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      rehearsalId = data.id
    }

    // Update songs
    if (rehearsalId) {
      await supabase.from('rehearsal_songs').delete().eq('rehearsal_id', rehearsalId)
      if (selectedSongs.length > 0) {
        await supabase.from('rehearsal_songs').insert(
          selectedSongs.map((sid, i) => ({ rehearsal_id: rehearsalId!, song_id: sid, order_index: i }))
        )
      }
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!rehearsal || !confirm('Supprimer cette répétition ?')) return
    await supabase.from('rehearsals').delete().eq('id', rehearsal.id)
    router.refresh()
  }

  function toggleSong(id: string) {
    setSelectedSongs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  if (editMode && !open) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setOpen(true)} className="text-xs border border-[#B87333]/40 text-[#B87333] px-2 py-1 rounded hover:bg-[#B87333]/10">Modifier</button>
        <button onClick={handleDelete} className="text-xs border border-red-300 text-red-500 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
      </div>
    )
  }

  if (!editMode && !open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
        + Nouvelle répétition
      </button>
    )
  }

  return (
    <div className={`bg-white/80 border border-[#E2B36A]/60 rounded-xl p-5 shadow ${editMode ? '' : 'mb-4'}`}>
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">{rehearsal ? 'Modifier la répétition' : 'Nouvelle répétition'}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Date et heure *</label>
          <input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => set('starts_at', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Lieu</label>
          <input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="ex: Salle de répétition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Notes</label>
          <textarea className={`${inputCls} h-16 resize-none`} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-2">Chants ({selectedSongs.length} sélectionné{selectedSongs.length > 1 ? 's' : ''})</label>
          <div className="max-h-36 overflow-y-auto space-y-1 border border-[#E2B36A]/40 rounded-lg p-2">
            {songs.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[#E2B36A]/10 px-2 py-1 rounded">
                <input type="checkbox" checked={selectedSongs.includes(s.id)} onChange={() => toggleSong(s.id)} className="accent-[#B87333]" />
                <span className="text-[#5A3318]">{s.title}</span>
              </label>
            ))}
          </div>
        </div>
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
