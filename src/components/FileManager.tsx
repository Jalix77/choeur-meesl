'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FileRecord {
  id: string;
  label: string;
  kind: string;
  storage_path: string;
}

export default function FileManager({
  songId,
  initialFiles,
}: {
  songId: string;
  initialFiles: FileRecord[];
}) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const labelRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<HTMLSelectElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const label = labelRef.current?.value.trim();
    const kind = kindRef.current?.value as 'audio' | 'playback' | 'sheet';
    const file = fileRef.current?.files?.[0];
    if (!label || !file) { setError('Label et fichier requis.'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const uuid = crypto.randomUUID();
    const path = `songs/${songId}/${uuid}-${file.name}`;

    const { error: upErr } = await supabase.storage.from('media').upload(path, file);
    if (upErr) { setError(upErr.message); setUploading(false); return; }

    const { data: row, error: dbErr } = await supabase
      .from('song_files')
      .insert({ song_id: songId, label, kind, storage_path: path })
      .select()
      .single();

    if (dbErr) { setError(dbErr.message); setUploading(false); return; }

    setFiles(f => [...f, row as FileRecord]);
    if (labelRef.current) labelRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
  }

  async function handleDelete(file: FileRecord) {
    if (!confirm(`Supprimer « ${file.label} » ?`)) return;
    await supabase.storage.from('media').remove([file.storage_path]);
    await supabase.from('song_files').delete().eq('id', file.id);
    setFiles(f => f.filter(x => x.id !== file.id));
  }

  return (
    <div className="space-y-4">
      <h3 className="font-cinzel text-xs uppercase tracking-widest text-[#B87333]">
        Fichiers audio / playbacks
      </h3>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-3 bg-[#FBF6EC] border border-[#E2B36A]/40 rounded-lg px-3 py-2">
              <span className="text-sm flex-1 text-[#5A3318]">{f.label}</span>
              <span className="text-xs text-[#B87333]/60">{f.kind}</span>
              <button
                onClick={() => handleDelete(f)}
                className="text-xs text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#5A3318]/50">Aucun fichier.</p>
      )}

      <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <input
          ref={labelRef}
          placeholder="Label (ex : Playback A)"
          className="border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50"
        />
        <select
          ref={kindRef}
          defaultValue="audio"
          className="border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50"
        >
          <option value="audio">Audio</option>
          <option value="playback">Playback</option>
          <option value="sheet">Partition</option>
        </select>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.pdf"
          className="text-sm text-[#5A3318] file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#B87333]/20 file:text-[#5A3318] hover:file:bg-[#B87333]/30 file:text-xs"
        />
        <div className="sm:col-span-3 flex gap-3 items-center">
          <button
            type="submit"
            disabled={uploading}
            className="bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg hover:bg-[#3d2010] transition-colors disabled:opacity-60"
          >
            {uploading ? 'Envoi…' : 'Ajouter le fichier'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
}
