'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { formatBirthdayDisplay } from '@/lib/database.types'

interface Props {
  profiles: Profile[]
  currentUserId: string
}

const BLANK_CREATE = { email: '', password: '', full_name: '', role: 'member' as 'admin' | 'member', phone: '', date_naissance: '' }
const BLANK_EDIT   = { full_name: '', phone: '', date_naissance: '' }

export default function MemberManager({ profiles: initialProfiles, currentUserId }: Props) {
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [showAdd, setShowAdd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState(BLANK_CREATE)

  // Edit modal
  const [editId, setEditId]     = useState<string | null>(null)
  const [editForm, setEditForm] = useState(BLANK_EDIT)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur'); setLoading(false); return }
    // After create, patch phone + date_naissance if provided
    if ((form.phone || form.date_naissance) && json.user?.id) {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: json.user.id,
          ...(form.phone && { phone: form.phone }),
          ...(form.date_naissance && { date_naissance: form.date_naissance }),
        }),
      })
    }
    setShowAdd(false)
    setForm(BLANK_CREATE)
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
    if (!confirm('Supprimer définitivement ce compte ?')) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setProfiles(p => p.filter(x => x.id !== id)); router.refresh() }
  }

  function openEdit(p: Profile) {
    setEditId(p.id)
    setEditForm({ full_name: p.full_name, phone: p.phone ?? '', date_naissance: p.date_naissance ?? '' })
    setEditError('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setEditSaving(true); setEditError('')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editId,
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        date_naissance: editForm.date_naissance || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setEditError(json.error ?? 'Erreur'); setEditSaving(false); return }
    setProfiles(p => p.map(x => x.id === editId
      ? { ...x, full_name: editForm.full_name, phone: editForm.phone || null, date_naissance: editForm.date_naissance || null }
      : x))
    setEditId(null)
    setEditSaving(false)
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  return (
    <div className="space-y-4">
      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">Modifier le profil</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Nom complet *</label>
                <input className={inputCls} required value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Téléphone</label>
                <input className={inputCls} type="tel" value={editForm.phone} placeholder="+509 xxxx xxxx"
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Date de naissance</label>
                <input className={inputCls} type="date" value={editForm.date_naissance}
                  onChange={e => setEditForm(f => ({ ...f, date_naissance: e.target.value }))} />
              </div>
              {editError && <p className="text-red-600 text-sm">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={editSaving}
                  className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60 flex-1">
                  {editSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setEditId(null)}
                  className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add button / form */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
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
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Rôle</label>
                <select className={inputCls} value={form.role} onChange={e => setField('role', e.target.value)}>
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Téléphone</label>
                <input className={inputCls} type="tel" value={form.phone} placeholder="+509 xxxx xxxx" onChange={e => setField('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A3318] mb-1">Date de naissance</label>
                <input type="date" className={inputCls} value={form.date_naissance} onChange={e => setField('date_naissance', e.target.value)} />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
                {loading ? 'Création…' : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2 rounded-lg hover:bg-[#E2B36A]/20">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members table */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#5A3318] text-white">
            <tr>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Nom</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal hidden md:table-cell">Anniversaire</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Rôle</th>
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
                  {p.phone && <p className="text-xs text-[#B87333]/60 mt-0.5">{p.phone}</p>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.date_naissance ? (
                    <span className="text-xs text-[#5A3318]">
                      🎂 {formatBirthdayDisplay(p.date_naissance)}
                    </span>
                  ) : (
                    <span className="text-xs text-[#B87333]/40">—</span>
                  )}
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
                    {p.active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs border border-[#E2B36A]/60 text-[#5A3318] px-2 py-1 rounded hover:bg-[#E2B36A]/20"
                    >
                      ✏️
                    </button>
                    {p.id !== currentUserId && (
                      <>
                        <button
                          onClick={() => handleToggleActive(p.id, p.active)}
                          className="text-xs border border-[#B87333]/40 text-[#B87333] px-2 py-1 rounded hover:bg-[#B87333]/10"
                        >
                          {p.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-xs border border-red-300 text-red-500 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
