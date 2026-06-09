'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VOCAL_ROLES, type VocalRole, type RehearsalChorister } from '@/lib/database.types'

interface Song { id: string; title: string }
interface ChoristerProfile { id: string; full_name: string; email?: string | null; phone?: string | null }

interface Rehearsal {
  id: string
  starts_at: string
  location: string | null
  notes: string | null
  title?: string | null
  notify_selected?: boolean
  rehearsal_songs?: { songs: Song; order_index: number }[]
}

interface Props {
  songs: Song[]
  choristers: ChoristerProfile[]
  rehearsal?: Rehearsal
  initialChoristers?: RehearsalChorister[]
  editMode?: boolean
}

type ChoristerSelection = { profile_id: string; vocal_role: VocalRole }

export default function RehearsalManager({ songs, choristers, rehearsal, initialChoristers, editMode }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: rehearsal?.title ?? '',
    starts_at: rehearsal?.starts_at?.slice(0, 16) ?? '',
    location: rehearsal?.location ?? '',
    notes: rehearsal?.notes ?? '',
    notify_selected: rehearsal?.notify_selected ?? false,
  })

  const [selectedSongs, setSelectedSongs] = useState<string[]>(
    rehearsal?.rehearsal_songs?.map(rs => rs.songs.id) ?? []
  )

  const [selectedChoristers, setSelectedChoristers] = useState<ChoristerSelection[]>(
    initialChoristers?.map(rc => ({ profile_id: rc.profile_id, vocal_role: rc.vocal_role as VocalRole })) ?? []
  )

  function setField(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  function toggleChorister(id: string) {
    setSelectedChoristers(prev => {
      if (prev.find(c => c.profile_id === id)) return prev.filter(c => c.profile_id !== id)
      return [...prev, { profile_id: id, vocal_role: 'Autre' }]
    })
  }

  function setChoristerRole(id: string, role: VocalRole) {
    setSelectedChoristers(prev => prev.map(c => c.profile_id === id ? { ...c, vocal_role: role } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title: form.title || null,
      starts_at: new Date(form.starts_at).toISOString(),
      location: form.location || null,
      notes: form.notes || null,
      notify_selected: form.notify_selected,
    }

    let rehearsalId = rehearsal?.id

    if (rehearsal) {
      const { error: err } = await supabase.from('rehearsals').update(payload).eq('id', rehearsal.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data, error: err } = await supabase.from('rehearsals').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      rehearsalId = data.id
    }

    if (rehearsalId) {
      // Songs
      await supabase.from('rehearsal_songs').delete().eq('rehearsal_id', rehearsalId)
      if (selectedSongs.length > 0) {
        await supabase.from('rehearsal_songs').insert(
          selectedSongs.map((sid, i) => ({ rehearsal_id: rehearsalId!, song_id: sid, order_index: i }))
        )
      }

      // Choristers
      await supabase.from('rehearsal_choristers').delete().eq('rehearsal_id', rehearsalId)
      if (selectedChoristers.length > 0) {
        await supabase.from('rehearsal_choristers').insert(
          selectedChoristers.map(c => ({
            rehearsal_id: rehearsalId!,
            profile_id: c.profile_id,
            vocal_role: c.vocal_role,
          }))
        )
      }

      // Send notifications if requested
      if (form.notify_selected && selectedChoristers.length > 0) {
        await fetch('/api/rehearsals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rehearsal_id: rehearsalId }),
        })
      }
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!rehearsal || !confirm('Supprimer cette repetition ?')) return
    await supabase.from('rehearsals').delete().eq('id', rehearsal.id)
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"
  const selectCls = "border border-[#E2B36A]/50 rounded px-2 py-1 text-xs bg-[#FBF6EC] text-[#5A3318]"

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
        + Nouvelle repetition
      </button>
    )
  }

  return (
    <div className={`bg-white/80 border border-[#E2B36A]/60 rounded-xl p-5 shadow ${editMode ? '' : 'mb-4'}`}>
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">
        {rehearsal ? 'Modifier la repetition' : 'Nouvelle repetition'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Titre (optionnel)</label>
          <input className={inputCls} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="ex: Repetition generale, Culte du dimanche..." />
        </div>

        {/* Date + lieu */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">Date et heure *</label>
            <input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => setField('starts_at', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">Lieu</label>
            <input className={inputCls} value={form.location} onChange={e => setField('location', e.target.value)} placeholder="ex: Salle de repetition" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Notes</label>
          <textarea className={`${inputCls} h-16 resize-none`} value={form.notes} onChange={e => setField('notes', e.target.value)} />
        </div>

        {/* Chants */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-2">
            Chants ({selectedSongs.length} selectionne{selectedSongs.length > 1 ? 's' : ''})
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1 border border-[#E2B36A]/40 rounded-lg p-2 bg-[#FBF6EC]/50">
            {songs.length === 0 && <p className="text-xs text-[#B87333]/60 italic px-2">Aucun chant disponible</p>}
            {songs.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[#E2B36A]/10 px-2 py-1 rounded">
                <input type="checkbox" checked={selectedSongs.includes(s.id)}
                  onChange={() => setSelectedSongs(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                  className="accent-[#B87333]" />
                <span className="text-[#5A3318]">{s.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Choristes en service ── */}
        <div className="border border-[#E2B36A]/50 rounded-xl overflow-hidden">
          <div className="bg-[#5A3318] px-4 py-2.5">
            <h4 className="font-cinzel text-white text-sm tracking-wide">Choristes en service</h4>
            <p className="text-[#E2B36A]/80 text-xs mt-0.5">
              Selectionnez les choristes qui seront en service pour ce culte ou cette repetition.
            </p>
          </div>

          <div className="p-3 bg-[#FBF6EC]/40">
            {choristers.length === 0 && (
              <p className="text-xs text-[#B87333]/60 italic">Aucun membre actif trouve.</p>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {choristers.map(c => {
                const sel = selectedChoristers.find(x => x.profile_id === c.id)
                const isChecked = !!sel
                return (
                  <div key={c.id} className={`rounded-lg border transition-colors ${isChecked ? 'border-[#B87333]/60 bg-[#B87333]/5' : 'border-[#E2B36A]/30 bg-white/50'}`}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleChorister(c.id)} className="accent-[#B87333] w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#5A3318]">{c.full_name}</span>
                        {c.phone && <span className="text-xs text-[#B87333]/70 ml-2">{c.phone}</span>}
                      </div>
                      {isChecked && (
                        <select
                          value={sel.vocal_role}
                          onChange={e => setChoristerRole(c.id, e.target.value as VocalRole)}
                          onClick={e => e.stopPropagation()}
                          className={selectCls}
                        >
                          {VOCAL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>

            {/* Notify checkbox */}
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.notify_selected}
                onChange={e => setField('notify_selected', e.target.checked)}
                className="accent-[#9C3D6E] w-4 h-4"
              />
              <span className="text-sm text-[#5A3318]">
                Envoyer une notification email aux choristes selectionnes
              </span>
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
