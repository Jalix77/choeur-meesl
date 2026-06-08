'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

export default function AnnouncementManager({
  announcements: initial,
  isAdmin,
}: {
  announcements: Announcement[];
  isAdmin: boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', pinned: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openNew() {
    setEditing(null);
    setForm({ title: '', content: '', pinned: false });
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({ title: a.title, content: a.content, pinned: a.pinned });
    setShowForm(true);
  }

  async function save() {
    setSaving(true); setError('');
    const payload = { title: form.title, content: form.content, pinned: form.pinned };
    if (editing) {
      const { error: e } = await supabase.from('announcements').update(payload).eq('id', editing.id);
      if (e) { setError(e.message); setSaving(false); return; }
      setItems(it => it.map(x => x.id === editing.id ? { ...x, ...payload } : x));
    } else {
      const { data, error: e } = await supabase.from('announcements').insert(payload).select().single();
      if (e || !data) { setError(e?.message ?? 'Erreur'); setSaving(false); return; }
      setItems(it => [data as Announcement, ...it].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    }
    setShowForm(false); setSaving(false);
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    setItems(it => it.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <button onClick={openNew}
          className="bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
          + Nouvelle annonce
        </button>
      )}

      {showForm && (
        <div className="bg-white/60 border border-[#E2B36A]/50 rounded-xl p-5 space-y-4">
          <h3 className="font-cinzel text-sm font-semibold text-[#5A3318]">
            {editing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
          </h3>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Titre"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50"
          />
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Contenu"
            rows={4}
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50 resize-y"
          />
          <label className="flex items-center gap-2 text-sm text-[#5A3318] cursor-pointer">
            <input type="checkbox" checked={form.pinned}
              onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
              className="accent-[#B87333]" />
            Épingler cette annonce
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving || !form.title || !form.content}
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

      {items.length === 0 ? (
        <div className="bg-white/30 border border-[#E2B36A]/30 rounded-xl p-8 text-center text-sm text-[#5A3318]/60">
          Aucune annonce.
        </div>
      ) : (
        items.map(a => (
          <div key={a.id} className="bg-white/50 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="text-xs bg-[#B87333]/20 text-[#B87333] font-cinzel px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Épinglé
                    </span>
                  )}
                  <p className="font-cinzel font-semibold text-[#5A3318]">{a.title}</p>
                </div>
                <p className="text-sm text-[#5A3318]/80 mt-2 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-[#B87333]/60 mt-2">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(a)}
                    className="text-xs border border-[#E2B36A] text-[#5A3318] px-2 py-1 rounded hover:bg-[#E2B36A]/20">
                    Modifier
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)}
                    className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50">
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
