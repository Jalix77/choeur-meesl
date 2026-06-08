'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';

type Song = Database['public']['Tables']['songs']['Row'];

interface SongFormProps {
  song?: Song;
  action: (data: FormData) => Promise<{ error?: string }>;
}

export default function SongForm({ song, action }: SongFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(data);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/chants');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Titre *</label>
          <input name="title" defaultValue={song?.title} required
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Tonalité</label>
          <input name="key_signature" defaultValue={song?.key_signature ?? ''}
            placeholder="Ex : Do, Ré mineur, G"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Tempo (BPM)</label>
          <input name="tempo" type="number" min="40" max="300" defaultValue={song?.tempo ?? ''}
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Mesure</label>
          <input name="time_signature" defaultValue={song?.time_signature ?? ''}
            placeholder="Ex : 4/4, 3/4"
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Auteur / Source</label>
          <input name="author" defaultValue={song?.author ?? ''}
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#5A3318] mb-1">Notation par défaut</label>
          <select name="notation" defaultValue={song?.notation ?? 'latin'}
            className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50">
            <option value="latin">Latine (Do Ré Mi)</option>
            <option value="anglo">Anglo (C D E)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5A3318] mb-1">Corps du chant *</label>
        <p className="text-xs text-[#B87333]/70 mb-1">
          <code className="bg-[#E2B36A]/20 px-1 rounded"># Refrain</code> = section,{' '}
          <code className="bg-[#E2B36A]/20 px-1 rounded">[Do]</code> = accord avant la syllabe
        </p>
        <textarea name="body" defaultValue={song?.body} required rows={16}
          className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B87333]/50 resize-y" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5A3318] mb-1">Notes internes</label>
        <textarea name="notes" defaultValue={song?.notes ?? ''} rows={3}
          className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50 resize-y" />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending}
          className="bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60">
          {isPending ? 'Enregistrement…' : (song ? 'Enregistrer' : 'Créer le chant')}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-[#E2B36A] text-[#5A3318] hover:bg-[#E2B36A]/20 text-sm transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}
