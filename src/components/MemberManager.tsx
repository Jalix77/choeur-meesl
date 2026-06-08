'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/database.types'

interface Props {
  profiles: Profile[]
  currentUserId: string
}

export default function MemberManager({ profiles: initialProfiles, currentUserId }: Props) {
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'member' as 'admin' | 'member' })

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur'); setLoading(false); return }
    setShowAdd(false)
    setForm({ email: '', password: '', full_name: '', role: 'member' })
    setLoading(false)
    router.refresh()
  }

  async function handleToggleActive(id: string, active: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    setProfiles(p => p.map(x => x.id === id ? { ...x, active: !active } : x))
  }

  async function handleRoleChange(id: string, role: 'admin' | 'member') {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    setProfiles(p => p.map(x => x.id === id ? { ...x, role } : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer definitiement ce compte ?')) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setProfiles(p => p.filter(x => x.id !== id))
      router.refresh()
    }
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
          + Ajouter un membre
        </button>
      ) : (
        <div className="bg-white/80 border border-[#E2B36A]/60 rounded-xl p-5 shadow">
          <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">Nouveau membre</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Nom complet *</label>
                <input className={inputCls} value={form.full_name} onChange={e => setField('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Email *</label>
                <input type="email" className={inputCls} value={form.email} onChange={e => setField('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Mot de passe *</label>
                <input type="password" className={inputCls} value={form.password} onChange={e => setField('password', e.target.value)} required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Role</label>
                <select className={inputCls} value={form.role} onChange={e => setField('role', e.target.value)}>
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
                {loading ? 'Creation...' : 'Creer le compte'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#5A3318] text-white">
            <tr>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Nom</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Role</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Statut</th>
              <th className="px-4 py-3 font-cinzel font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <tr key={p.id} className={`border-t border-[#E2B36A]/30 ${i % 2 === 0 ? '' : 'bg-[#FBF6EC]/50'}`}>
                <td className="px-4 py-3">
                  <span className="font-semibold text-[#5A3318]">{p.full_name}</span>
                  {p.id === currentUserId && <span className="ml-1 text-xs text-[#B87333]">(vous)</span>}
                </td>
                <td className="px-4 py-3">
                  {p.id !== currentUserId ? (
                    <select
                      value={p.role}
                      onChange={e => handleRoleChange(p.id, e.target.value as 'admin' | 'member')}
                      className="border border-[#E2B36A]/50 rounded px-2 py-1 text-xs bg-[#FBF6EC] text-[#5A3318]"
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs text-[#B87333] font-semibold uppercase">{p.role}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {p.active ? 'Actif' : 'Desactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.id !== currentUserId && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleActive(p.id, p.active)}
                        className="text-xs border border-[#B87333]/40 text-[#B87333] px-2 py-1 rounded hover:bg-[#B87333]/10"
                      >
                        {p.active ? 'Desactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs border border-red-300 text-red-500 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
