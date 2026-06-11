'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { Profile, Role } from '@/lib/database.types'
import { formatBirthdayDisplay } from '@/lib/database.types'
import { ROLE_OPTIONS, ROLE_LABELS } from '@/lib/roles'

interface Props {
  profiles: Profile[]
  currentUserId: string
  callerRole: Role
}

const BLANK_CREATE = { email: '', password: '', full_name: '', role: 'member' as Role, phone: '', date_naissance: '' }
const BLANK_EDIT   = { full_name: '', phone: '', date_naissance: '' }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Avatar component ──────────────────────────────────────────────────────────
function Avatar({ url, name, size = 'sm' }: { url?: string | null; name: string; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-9 h-9 text-xs'
  return (
    <div className={`${dim} rounded-full overflow-hidden border-2 border-[#E2B36A]/50 flex-shrink-0 bg-[#FBF6EC] flex items-center justify-center font-bold text-[#B87333]`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

// ── Photo modal ───────────────────────────────────────────────────────────────
interface PhotoModalProps {
  profileId: string
  profileName: string
  currentUrl: string | null
  onSaved: (newUrl: string | null) => void
  onClose: () => void
}

function PhotoModal({ profileId, profileName, currentUrl, onSaved, onClose }: PhotoModalProps) {
  const [preview, setPreview]     = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop grand — maximum 5 Mo.')
      return
    }

    setUploading(true); setError('')
    // Immediate local preview
    setPreview(URL.createObjectURL(file))

    const supabase = supabaseClient()
    // Always store at profiles/{userId}.jpg regardless of input extension
    const path = `profiles/${profileId}.jpg`

    const { error: uploadErr } = await supabase.storage
      .from('member-photos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadErr) {
      setError('Erreur upload : ' + uploadErr.message)
      setPreview(currentUrl)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('member-photos')
      .getPublicUrl(path)

    // Cache-bust URL
    const finalUrl = `${publicUrl}?t=${Date.now()}`

    // Save to profiles.avatar_url
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profileId, avatar_url: finalUrl }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur sauvegarde'); setUploading(false); return }

    setPreview(finalUrl)
    onSaved(finalUrl)
    setUploading(false)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer la photo de ${profileName} ?`)) return
    setUploading(true); setError('')

    const supabase = supabaseClient()
    await supabase.storage.from('member-photos').remove([`profiles/${profileId}.jpg`])

    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profileId, avatar_url: null }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur suppression'); setUploading(false); return }

    setPreview(null)
    onSaved(null)
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-cinzel font-bold text-[#5A3318] text-base">Photo de profil</h3>
          <button onClick={onClose} className="text-[#B87333] hover:text-[#5A3318] text-lg leading-none">✕</button>
        </div>

        {/* Current photo / preview */}
        <div className="flex flex-col items-center gap-4 mb-5">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#E2B36A]/60 bg-[#FBF6EC] flex items-center justify-center shadow-inner">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={profileName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#B87333] text-4xl font-bold font-cinzel">{getInitials(profileName)}</span>
            )}
          </div>
          <p className="font-semibold text-[#5A3318] text-sm">{profileName}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Choose / Change photo */}
          <button
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-semibold disabled:opacity-60"
          >
            {uploading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Envoi en cours…</>
            ) : preview ? (
              '🔄 Changer la photo'
            ) : (
              '📷 Ajouter une photo'
            )}
          </button>

          {/* Delete photo — only shown when there's a photo */}
          {preview && !uploading && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-500 hover:bg-red-50 text-sm px-4 py-2.5 rounded-xl transition-colors font-semibold"
            >
              🗑 Supprimer la photo
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full text-sm text-[#B87333]/70 hover:text-[#5A3318] py-1.5 transition-colors"
          >
            Fermer
          </button>
        </div>

        {/* Format hint */}
        <p className="text-center text-[10px] text-[#B87333]/50 mt-3">JPG · PNG · WebP — max 5 Mo</p>

        {/* Error */}
        {error && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{error}</p>
        )}

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MemberManager({ profiles: initialProfiles, currentUserId, callerRole }: Props) {
  const isCallerAdmin = callerRole === 'admin'
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)

  // Add member form
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState(BLANK_CREATE)

  // Edit profile modal
  const [editId, setEditId]         = useState<string | null>(null)
  const [editForm, setEditForm]     = useState(BLANK_EDIT)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError]   = useState('')

  // Photo modal
  const [photoProfile, setPhotoProfile] = useState<Profile | null>(null)

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // ── Create ──────────────────────────────────────────────────────────────────
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
    // Patch optional fields
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
    setShowAdd(false); setForm(BLANK_CREATE); setLoading(false)
    router.refresh()
  }

  // ── Toggle active ───────────────────────────────────────────────────────────
  async function handleToggleActive(id: string, active: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    setProfiles(p => p.map(x => x.id === id ? { ...x, active: !active } : x))
  }

  // ── Role change ─────────────────────────────────────────────────────────────
  async function handleRoleChange(id: string, role: Role) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    setProfiles(p => p.map(x => x.id === id ? { ...x, role } : x))
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Supprimer définitivement ce compte ?')) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setProfiles(p => p.filter(x => x.id !== id)); router.refresh() }
  }

  // ── Edit profile ────────────────────────────────────────────────────────────
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
    setEditId(null); setEditSaving(false)
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  return (
    <div className="space-y-4">

      {/* ── Photo modal ───────────────────────────────────────────────────── */}
      {photoProfile && (
        <PhotoModal
          profileId={photoProfile.id}
          profileName={photoProfile.full_name}
          currentUrl={photoProfile.avatar_url ?? null}
          onSaved={(newUrl) => {
            setProfiles(p => p.map(x => x.id === photoProfile.id ? { ...x, avatar_url: newUrl } : x))
            setPhotoProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null)
          }}
          onClose={() => setPhotoProfile(null)}
        />
      )}

      {/* ── Edit profile modal ────────────────────────────────────────────── */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel font-bold text-[#5A3318]">Modifier le profil</h3>
              <button onClick={() => setEditId(null)} className="text-[#B87333] hover:text-[#5A3318] text-lg">✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              {isCallerAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-[#5A3318] mb-1">Nom complet *</label>
                  <input className={inputCls} required value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
              )}
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

      {/* ── Add member button / form — admin only ─────────────────────────── */}
      {isCallerAdmin && (!showAdd ? (
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
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
      ))}

      {/* ── Members table ─────────────────────────────────────────────────── */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#5A3318] text-white">
            <tr>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Membre</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal hidden md:table-cell">Anniversaire</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal">Rôle</th>
              <th className="text-left px-4 py-3 font-cinzel font-normal hidden sm:table-cell">Statut</th>
              <th className="px-4 py-3 font-cinzel font-normal text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <tr key={p.id} className={`border-t border-[#E2B36A]/30 ${i % 2 === 0 ? '' : 'bg-[#FBF6EC]/40'}`}>

                {/* Nom + avatar */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar url={p.avatar_url} name={p.full_name} />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#5A3318] leading-tight truncate">
                        {p.full_name}
                        {p.id === currentUserId && <span className="ml-1 text-xs text-[#B87333] font-normal">(vous)</span>}
                      </p>
                      {p.phone && <p className="text-xs text-[#B87333]/60 mt-0.5">{p.phone}</p>}
                    </div>
                  </div>
                </td>

                {/* Anniversaire */}
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.date_naissance ? (
                    <span className="text-xs text-[#5A3318]">🎂 {formatBirthdayDisplay(p.date_naissance)}</span>
                  ) : (
                    <span className="text-xs text-[#B87333]/30">—</span>
                  )}
                </td>

                {/* Rôle */}
                <td className="px-4 py-3">
                  {isCallerAdmin && p.id !== currentUserId ? (
                    <select value={p.role}
                      onChange={e => handleRoleChange(p.id, e.target.value as Role)}
                      className="border border-[#E2B36A]/50 rounded px-2 py-1 text-xs bg-[#FBF6EC] text-[#5A3318]">
                      {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-[#B87333] font-semibold">{ROLE_LABELS[p.role]}</span>
                  )}
                </td>

                {/* Statut */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                  }`}>
                    {p.active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">

                    {/* ✏️ Edit profil */}
                    <button onClick={() => openEdit(p)} title="Modifier le profil"
                      className="text-xs border border-[#E2B36A]/60 text-[#5A3318] px-2 py-1.5 rounded-lg hover:bg-[#E2B36A]/20 transition-colors">
                      ✏️
                    </button>

                    {/* 📷 Photo */}
                    <button onClick={() => setPhotoProfile(p)} title={p.avatar_url ? 'Changer/supprimer la photo' : 'Ajouter une photo'}
                      className={`text-xs px-2 py-1.5 rounded-lg transition-colors border ${
                        p.avatar_url
                          ? 'border-[#B87333]/50 bg-[#B87333]/10 text-[#5A3318] hover:bg-[#B87333]/20'
                          : 'border-[#E2B36A]/60 text-[#B87333]/60 hover:bg-[#E2B36A]/20'
                      }`}>
                      {p.avatar_url ? '🖼' : '📷'}
                    </button>

                    {/* Admin only */}
                    {isCallerAdmin && p.id !== currentUserId && (
                      <>
                        <button onClick={() => handleToggleActive(p.id, p.active)}
                          className="text-xs border border-[#B87333]/40 text-[#B87333] px-2 py-1.5 rounded-lg hover:bg-[#B87333]/10 transition-colors">
                          {p.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="text-xs border border-red-300 text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
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
