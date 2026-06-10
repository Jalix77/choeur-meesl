'use client';

import { useState } from 'react';
import type { Role } from '@/lib/database.types';
import { ROLE_OPTIONS, ROLE_LABELS } from '@/lib/roles';

interface Profile {
  id: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

interface Props {
  profiles: Profile[];
  callerRole?: Role;
}

export default function MembresManager({ profiles: initial, callerRole = 'member' }: Props) {
  const isCallerAdmin = callerRole === 'admin';
  const [profiles, setProfiles] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'member' as Role });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function createMember() {
    setSaving(true); setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? 'Erreur'); setSaving(false); return; }
    setProfiles(p => [...p, json.profile as Profile].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setShowForm(false);
    setForm({ full_name: '', email: '', password: '', role: 'member' });
    setSaving(false);
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Supprimer le compte de « ${name} » ? Cette action est irréversible.`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setProfiles(p => p.filter(x => x.id !== id));
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    if (res.ok) setProfiles(p => p.map(x => x.id === id ? { ...x, active: !active } : x));
  }

  async function changeRole(id: string, role: Role) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) setProfiles(p => p.map(x => x.id === id ? { ...x, role } : x));
  }

  return (
    <div className="space-y-4">
      {isCallerAdmin && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter un membre
        </button>
      )}

      {isCallerAdmin && showForm && (
        <div className="bg-white/60 border border-[#E2B36A]/50 rounded-xl p-5 space-y-4 max-w-md">
          <h3 className="font-cinzel text-sm font-semibold text-[#5A3318]">Nouveau membre</h3>
          <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Nom complet"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Adresse email"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Mot de passe provisoire"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50">
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={createMember} disabled={saving || !form.full_name || !form.email || !form.password}
              className="bg-[#B87333] text-white font-cinzel text-sm px-4 py-2 rounded-lg disabled:opacity-60">
              {saving ? 'Création…' : 'Créer le compte'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-sm text-[#5A3318] border border-[#E2B36A] px-4 py-2 rounded-lg hover:bg-[#E2B36A]/20">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2B36A]/40">
              <th className="text-left py-2 px-3 font-cinzel text-xs uppercase tracking-widest text-[#B87333]">Nom</th>
              <th className="text-left py-2 px-3 font-cinzel text-xs uppercase tracking-widest text-[#B87333]">Rôle</th>
              <th className="text-left py-2 px-3 font-cinzel text-xs uppercase tracking-widest text-[#B87333]">Statut</th>
              {isCallerAdmin && (
                <th className="text-left py-2 px-3 font-cinzel text-xs uppercase tracking-widest text-[#B87333]">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-[#E2B36A]/20 hover:bg-white/30 transition-colors">
                <td className="py-2.5 px-3 text-[#5A3318] font-medium">{p.full_name}</td>
                <td className="py-2.5 px-3">
                  {isCallerAdmin ? (
                    <select value={p.role} onChange={e => changeRole(p.id, e.target.value as Role)}
                      className="text-xs border border-[#E2B36A]/50 rounded px-2 py-1 bg-[#FBF6EC] text-[#5A3318] focus:outline-none">
                      {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-[#B87333] font-semibold">{ROLE_LABELS[p.role]}</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-xs font-cinzel px-2 py-0.5 rounded uppercase tracking-wider ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {p.active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                {isCallerAdmin && (
                  <td className="py-2.5 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(p.id, p.active)}
                        className="text-xs border border-[#E2B36A] text-[#5A3318] px-2 py-1 rounded hover:bg-[#E2B36A]/20">
                        {p.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => deleteMember(p.id, p.full_name)}
                        className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">
                        Supprimer
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
