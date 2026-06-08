'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RehearsalSong {
  id: string;
  order_index: number;
  songs: { id: string; title: string } | null;
}

interface Rehearsal {
  id: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  rehearsal_songs: RehearsalSong[];
}

interface SongOption {
  id: string;
  title: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function RehearsalManager({
  rehearsals: initial,
  allSongs,
  isAdmin,
}: {
  rehearsals: Rehearsal[];
  allSongs: SongOption[];
  isAdmin: boolean;
}) {
  const supabase = createClient();
  const [rehearsals, setRehearsals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rehearsal | null>(null);
  const [form, setForm] = useState({ starts_at: '', ends_at: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openNew() {
    setEditing(null);
    setForm({ starts_at: '', ends_at: '', location: '', notes: '' });
    setShowForm(true);
  }

  function openEdit(r: Rehearsal) {
    setEditing(r);
    setForm({
      starts_at: r.starts_at.slice(0, 16),
      ends_at: r.ends_at?.slice(0, 16) ?? '',
      location: r.location ?? '',
      notes: r.notes ?? '',
    });
    setShowForm(true);
  }

  async function save() {
    setSaving(true); setError('');
    const payload = {
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      location: form.location || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error: e } = await supabase.from('rehearsals').update(payload).eq('id', editing.id);
      if (e) { setError(e.message); setSaving(false); return; }
      setRehearsals(rs => rs.map(r => r.id === editing.id ? { ...r, ...payload } : r));
    } else {
      const { data, error: e } = await supabase.from('rehearsals').insert(payload).select('*, rehearsal_songs(id, order_index, songs(id, title))').single();
      if (e || !data) { setError(e?.message ?? 'Erreur'); setSaving(false); return; }
      setRehearsals(rs => [...rs, data as Rehearsal].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    }
    setShowForm(false); setSaving(false);
  }

  async function deleteRehearsal(id: string) {
    if (!confirm('Supprimer cette répétition ?')) return;
    await supabase.from('rehearsals').delete().eq('id', id);
    setRehearsals(rs => rs.filter(r => r.id !== id));
  }

  async function addSongToRehearsal(rehearsalId: string, songId: string) {
    const rehearsal = rehearsals.find(r => r.id === rehearsalId);
    const orderIndex = (rehearsal?.rehearsal_songs.length ?? 0) + 1;
    const { data, error: e } = await supabase
      .from('rehearsal_songs')
      .insert({ rehearsal_id: rehearsalId, song_id: songId, order_index: orderIndex })
      .select('id, order_index, songs(id, title)')
      .single();
    if (e || !data) return;
    setRehearsals(rs => rs.map(r => r.id === rehearsalId
      ? { ...r, rehearsal_songs: [...r.rehearsal_songs, data as RehearsalSong] }
      : r
    ));
  }

  async function removeSongFromRehearsal(rehearsalId: string, rsId: string) {
    await supabase.from('rehearsal_songs').delete().eq('id', rsId);
    setRehearsals(rs => rs.map(r => r.id === rehearsalId
      ? { ...r, rehearsal_songs: r.rehearsal_songs.filter(s => s.id !== rsId) }
      : r
    ));
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <button
          onClick={openNew}
          className="bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Ajouter une répétition
        </button>
      )}

      {showForm && (
        <div className="bg-white/60 border border-[#E2B36A]/50 rounded-xl p-5 space-y-4">
          <h3 className="font-cinzel text-sm font-semibold text-[#5A3318]">
            {editing ? 'Modifier la répétition' : 'Nouvelle répétition'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#5A3318] mb-1">Début *</label>
              <input type="datetime-local" value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
            </div>
            <div>
              <label className="block text-xs text-[#5A3318] mb-1">Fin</label>
              <input type="datetime-local" value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
            </div>
            <div>
              <label className="block text-xs text-[#5A3318] mb-1">Lieu</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
            </div>
            <div>
              <label className="block text-xs text-[#5A3318] mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.starts_at}
              className="bg-[#B87333] text-white font-cinzel text-sm px-4 py-2 rounded-lg disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-sm text-[#5A3318] border border-[#E2B36A] px-4 py-2 rounded-lg hover:bg-[#E2B36A]/20">
              Annuler
            </button>
          </div>
        </div>
      )}

      {rehearsals.length === 0 ? (
        <div className="bg-white/30 border border-[#E2B36A]/30 rounded-xl p-8 text-center text-sm text-[#5A3318]/60">
          Aucune répétition planifiée.
        </div>
      ) : (
        rehearsals.map(r => (
          <div key={r.id} className="bg-white/50 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-cinzel font-semibold text-[#5A3318] capitalize">{formatDate(r.starts_at)}</p>
                <p className="text-[#B87333] text-sm mt-0.5">
                  {formatTime(r.starts_at)}
                  {r.ends_at && ` – ${formatTime(r.ends_at)}`}
                  {r.location && ` · ${r.location}`}
                </p>
                {r.notes && <p className="text-sm text-[#5A3318]/70 mt-1">{r.notes}</p>}
              </div>
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(r)}
                    className="text-xs border border-[#E2B36A] text-[#5A3318] px-2 py-1 rounded hover:bg-[#E2B36A]/20">
                    Modifier
                  </button>
                  <button onClick={() => deleteRehearsal(r.id)}
                    className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            {/* Songs list */}
            <div className="mt-3 space-y-1">
              <p className="text-xs font-cinzel uppercase tracking-widest text-[#B87333]">Chants</p>
              {r.rehearsal_songs
                .sort((a, b) => a.order_index - b.order_index)
                .map(rs => rs.songs && (
                  <div key={rs.id} className="flex items-center gap-2 text-sm">
                    <span className="text-[#5A3318]/40 text-xs w-5 text-right">{rs.order_index}.</span>
                    <Link href={`/chants/${rs.songs.id}`} className="hover:text-[#B87333] transition-colors">
                      {rs.songs.title}
                    </Link>
                    {isAdmin && (
                      <button onClick={() => removeSongFromRehearsal(r.id, rs.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              {isAdmin && (
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) { addSongToRehearsal(r.id, e.target.value); e.target.value = ''; } }}
                  className="mt-1 text-xs border border-[#E2B36A]/50 rounded px-2 py-1 bg-[#FBF6EC] text-[#5A3318] focus:outline-none"
                >
                  <option value="">+ Ajouter un chant…</option>
                  {allSongs.filter(s => !r.rehearsal_songs.some(rs => rs.songs?.id === s.id))
                    .map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
