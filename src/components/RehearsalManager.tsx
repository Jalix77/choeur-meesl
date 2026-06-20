'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VOCAL_ROLES, type VocalRole, type RehearsalChorister } from '@/lib/database.types'
import { buildWhatsAppLinks, type WhatsAppLink } from '@/lib/whatsapp'
import { haitiInputToISO, isoToHaitiInput } from '@/lib/rehearsal-time'

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

  // Form fields
  const [form, setForm] = useState({
    title: rehearsal?.title ?? '',
    starts_at: rehearsal?.starts_at ? isoToHaitiInput(rehearsal.starts_at) : '',
    location: rehearsal?.location ?? '',
    notes: rehearsal?.notes ?? '',
    notify_email: rehearsal?.notify_selected ?? false,
    notify_whatsapp: false,
  })

  const [selectedSongs, setSelectedSongs] = useState<string[]>(
    rehearsal?.rehearsal_songs?.map(rs => rs.songs.id) ?? []
  )

  const [selectedChoristers, setSelectedChoristers] = useState<ChoristerSelection[]>(
    initialChoristers?.map(rc => ({ profile_id: rc.profile_id, vocal_role: rc.vocal_role as VocalRole })) ?? []
  )

  // WhatsApp panel — shown after save when notify_whatsapp was checked
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLink[] | null>(null)

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
    setWhatsappLinks(null)

    const payload = {
      title: form.title || null,
      starts_at: haitiInputToISO(form.starts_at),
      location: form.location || null,
      notes: form.notes || null,
      notify_selected: form.notify_email,
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
        const { error: songsErr } = await supabase.from('rehearsal_songs').insert(
          selectedSongs.map((sid, i) => ({ rehearsal_id: rehearsalId!, song_id: sid, order_index: i }))
        )
        if (songsErr) {
          setError(`Erreur chants : ${songsErr.message} (code: ${songsErr.code})`)
          setLoading(false)
          return
        }
      }

      // Choristers
      await supabase.from('rehearsal_choristers').delete().eq('rehearsal_id', rehearsalId)
      if (selectedChoristers.length > 0) {
        const { error: choristersErr } = await supabase.from('rehearsal_choristers').insert(
          selectedChoristers.map(c => ({
            rehearsal_id: rehearsalId!,
            profile_id: c.profile_id,
            vocal_role: c.vocal_role,
          }))
        )
        if (choristersErr) {
          setError(`Erreur choristes : ${choristersErr.message} (code: ${choristersErr.code})`)
          setLoading(false)
          return
        }
      }

      // Email notifications
      if (form.notify_email && selectedChoristers.length > 0) {
        await fetch('/api/rehearsals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rehearsal_id: rehearsalId }),
        })
      }

      // WhatsApp links — build and show panel instead of closing
      if (form.notify_whatsapp && selectedChoristers.length > 0) {
        const songList = selectedSongs.map((sid, i) => {
          const song = songs.find(s => s.id === sid)
          return { title: song?.title ?? '?', order_index: i }
        })
        const targets = selectedChoristers.map(sel => {
          const profile = choristers.find(c => c.id === sel.profile_id)
          return {
            profile_id: sel.profile_id,
            full_name: profile?.full_name ?? sel.profile_id,
            phone: profile?.phone,
            vocal_role: sel.vocal_role,
          }
        })
        const links = buildWhatsAppLinks({
          targets,
          starts_at: payload.starts_at,
          location: payload.location,
          notes: payload.notes,
          songs: songList,
        })
        setWhatsappLinks(links)
        setLoading(false)
        router.refresh()
        return  // stay open to show the WhatsApp panel
      }
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!rehearsal || !confirm('Supprimer cette répétition ?')) return
    await supabase.from('rehearsals').delete().eq('id', rehearsal.id)
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"
  const selectCls = "border border-[#E2B36A]/50 rounded px-2 py-1 text-xs bg-[#FBF6EC] text-[#5A3318]"

  // ── Collapsed states ──────────────────────────────────────────────────────────
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

  // ── WhatsApp panel (post-save) ────────────────────────────────────────────────
  if (whatsappLinks) {
    const missing = whatsappLinks.filter(l => l.missingPhone)
    const ready   = whatsappLinks.filter(l => !l.missingPhone)

    return (
      <div className="bg-white/90 border border-[#E2B36A]/60 rounded-xl p-5 shadow">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-600 text-lg">✓</span>
          <h3 className="font-cinzel font-bold text-[#5A3318]">Répétition enregistrée</h3>
        </div>

        <div className="border border-green-200 bg-green-50 rounded-xl overflow-hidden">
          <div className="bg-[#25D366] px-4 py-2.5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="font-cinzel text-white text-sm font-semibold tracking-wide">
              Notifications WhatsApp ({ready.length})
            </span>
          </div>

          <div className="p-3 space-y-2">
            {ready.map(link => (
              <a
                key={link.profile_id}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 bg-white border border-green-200 rounded-lg px-3 py-2.5 hover:bg-green-50 transition-colors group"
              >
                <div>
                  <span className="text-sm font-semibold text-[#5A3318]">{link.full_name}</span>
                  <span className="text-xs text-[#B87333]/70 ml-2">{link.vocal_role}</span>
                  <span className="text-xs text-gray-400 ml-2">{link.phone}</span>
                </div>
                <span className="text-xs font-semibold text-[#25D366] group-hover:underline whitespace-nowrap">
                  Envoyer WhatsApp →
                </span>
              </a>
            ))}

            {missing.length > 0 && (
              <div className="mt-2 border-t border-green-100 pt-2 space-y-1">
                <p className="text-xs font-semibold text-amber-600 mb-1">⚠ Numéro manquant</p>
                {missing.map(link => (
                  <div key={link.profile_id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-xs text-amber-700">
                      Aucun numéro WhatsApp pour <strong>{link.full_name}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => { setWhatsappLinks(null); setOpen(false) }}
          className="mt-4 w-full border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20"
        >
          Terminer
        </button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  return (
    <div className={`bg-white/80 border border-[#E2B36A]/60 rounded-xl p-5 shadow ${editMode ? '' : 'mb-4'}`}>
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">
        {rehearsal ? 'Modifier la répétition' : 'Nouvelle répétition'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Titre (optionnel)</label>
          <input className={inputCls} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="ex: Répétition générale, Culte du dimanche..." />
        </div>

        {/* Date + lieu */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">Date et heure *</label>
            <input type="datetime-local" className={inputCls} value={form.starts_at} onChange={e => setField('starts_at', e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">Lieu</label>
            <input className={inputCls} value={form.location} onChange={e => setField('location', e.target.value)} placeholder="ex: Salle de répétition" />
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
            Chants ({selectedSongs.length} sélectionné{selectedSongs.length > 1 ? 's' : ''})
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
              Sélectionnez les choristes qui seront en service pour ce culte ou cette répétition.
            </p>
          </div>

          <div className="p-3 bg-[#FBF6EC]/40">
            {choristers.length === 0 && (
              <p className="text-xs text-[#B87333]/60 italic">Aucun membre actif trouvé.</p>
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
                        {c.phone
                          ? <span className="text-xs text-[#B87333]/60 ml-2">{c.phone}</span>
                          : isChecked && <span className="text-xs text-amber-500 ml-2 italic">pas de tél.</span>
                        }
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

            {/* Notification checkboxes */}
            <div className="mt-3 space-y-2 border-t border-[#E2B36A]/30 pt-3">
              {/* Email */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.notify_email}
                  onChange={e => setField('notify_email', e.target.checked)}
                  className="accent-[#9C3D6E] w-4 h-4"
                />
                <span className="text-sm text-[#5A3318] flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9C3D6E]">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Envoyer une notification email aux choristes sélectionnés
                </span>
              </label>

              {/* WhatsApp */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.notify_whatsapp}
                  onChange={e => setField('notify_whatsapp', e.target.checked)}
                  className="accent-[#25D366] w-4 h-4"
                />
                <span className="text-sm text-[#5A3318] flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Envoyer une notification WhatsApp aux choristes sélectionnés
                </span>
              </label>
            </div>
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
