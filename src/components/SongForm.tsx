'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Song } from '@/lib/database.types'

interface SongFormProps {
  song?: Song
}

export default function SongForm({ song }: SongFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: song?.title ?? '',
    key_signature: song?.key_signature ?? '',
    tempo: song?.tempo?.toString() ?? '',
    time_signature: song?.time_signature ?? '',
    author: song?.author ?? '',
    notation: song?.notation ?? 'latin' as 'latin' | 'anglo',
    body: song?.body ?? '',
    notes: song?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      key_signature: form.key_signature || null,
      tempo: form.tempo ? parseInt(form.tempo) : null,
      time_signature: form.time_signature || null,
      author: form.author || null,
      notation: form.notation,
      body: form.body,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (song) {
      const { error: err } = await supabase.from('songs').update(payload).eq('id', song.id)
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/chants/${song.id}`)
    } else {
      const { data, error: err } = await supabase.from('songs').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/chants/${data.id}`)
    }
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
  const labelCls = "block text-sm font-semibold text-[#5A3318] mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Titre *</label>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Tonalité</label>
          <input className={inputCls} value={form.key_signature} onChange={e => set('key_signature', e.target.value)} placeholder="ex: Do, Sol, Ré…" />
        </div>
        <div>
          <label className={labelCls}>Tempo (bpm)</label>
          <input type="number" className={inputCls} value={form.tempo} onChange={e => set('tempo', e.target.value)} placeholder="ex: 120" />
        </div>
        <div>
          <label className={labelCls}>Mesure</label>
          <input className={inputCls} value={form.time_signature} onChange={e => set('time_signature', e.target.value)} placeholder="ex: 4/4, 3/4" />
        </div>
        <div>
          <label className={labelCls}>Auteur / Source</label>
          <input className={inputCls} value={form.author} onChange={e => set('author', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Notation des accords</label>
          <select className={inputCls} value={form.notation} onChange={e => set('notation', e.target.value as 'latin' | 'anglo')}>
            <option value="latin">Latine (Do Ré Mi…)</option>
            <option value="anglo">Anglo (C D E…)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Corps du chant *</label>
        <p className="text-xs text-[#B87333] mb-1">
          Syntaxe : <code className="bg-[#E2B36A]/20 px-1 rounded"># Refrain</code> = section,{' '}
          <code className="bg-[#E2B36A]/20 px-1 rounded">[Do]</code> = accord avant la syllabe
        </p>
        <textarea
          className={`${inputCls} h-64 font-mono text-sm resize-y`}
          value={form.body}
          onChange={e => set('body', e.target.value)}
          required
          placeholder={`# Couplet 1\n[Do]Au com[Sol]mence[La m]ment...\n\n# Refrain\n[Fa]Gloire à [Do]Dieu...`}
        />
      </div>

      <div>
        <label className={labelCls}>Notes internes</label>
        <textarea className={`${inputCls} h-20 resize-y`} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Enregistrement…' : song ? 'Mettre à jour' : 'Créer le chant'}
        </button>
        <button type="button" onClick={() => router.back()} className="border border-[#E2B36A] text-[#B87333] px-4 py-2 rounded-lg hover:bg-[#E2B36A]/20 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}
