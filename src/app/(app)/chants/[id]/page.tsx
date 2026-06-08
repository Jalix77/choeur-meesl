import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SongSheet from '@/components/SongSheet';
import SongHeader from '@/components/SongHeader';
import AudioList from '@/components/AudioList';
import type { Notation } from '@/lib/chords';

export default async function SongPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const supabase = await createClient();

  const { data: song } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (!song) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single();

  // Signed URLs for audio files
  const { data: files } = await supabase
    .from('song_files')
    .select('id, label, kind, storage_path')
    .eq('song_id', id)
    .order('created_at');

  const audioFiles = await Promise.all(
    (files ?? []).map(async f => {
      const { data } = await supabase.storage
        .from('media')
        .createSignedUrl(f.storage_path, 3600);
      return { ...f, signedUrl: data?.signedUrl ?? '' };
    })
  );

  const defaultTranspose = t ? parseInt(t, 10) || 0 : 0;

  return (
    <div className="space-y-6">
      {/* Admin actions */}
      {profile?.role === 'admin' && (
        <div className="no-print flex gap-3">
          <Link
            href={`/chants/${id}/modifier`}
            className="text-sm bg-[#5A3318] text-white px-4 py-2 rounded-lg font-cinzel hover:bg-[#3d2010] transition-colors"
          >
            Modifier
          </Link>
          <Link
            href={`/chants/${id}/imprimer?t=${defaultTranspose}`}
            target="_blank"
            className="text-sm border border-[#B87333] text-[#B87333] px-4 py-2 rounded-lg font-cinzel hover:bg-[#B87333]/10 transition-colors"
          >
            Imprimer / PDF
          </Link>
        </div>
      )}
      {profile?.role !== 'admin' && (
        <div className="no-print flex gap-3">
          <Link
            href={`/chants/${id}/imprimer?t=${defaultTranspose}`}
            target="_blank"
            className="text-sm border border-[#B87333] text-[#B87333] px-4 py-2 rounded-lg font-cinzel hover:bg-[#B87333]/10 transition-colors"
          >
            Imprimer / PDF
          </Link>
        </div>
      )}

      <div className="bg-white/50 border border-[#E2B36A]/40 rounded-xl shadow-sm p-6">
        <SongHeader
          title={song.title}
          keySignature={song.key_signature}
          tempo={song.tempo}
          timeSignature={song.time_signature}
          author={song.author}
        />
        <SongSheet
          body={song.body}
          defaultNotation={song.notation as Notation}
          defaultTranspose={defaultTranspose}
        />
      </div>

      {audioFiles.filter(f => f.signedUrl).length > 0 && (
        <div className="bg-white/50 border border-[#E2B36A]/40 rounded-xl shadow-sm p-6">
          <AudioList files={audioFiles.filter(f => f.signedUrl)} />
        </div>
      )}

      {song.notes && (
        <div className="bg-white/40 border border-[#E2B36A]/30 rounded-xl p-5">
          <p className="font-cinzel text-xs uppercase tracking-widest text-[#B87333] mb-2">Notes</p>
          <p className="text-sm text-[#5A3318]/80 whitespace-pre-wrap">{song.notes}</p>
        </div>
      )}
    </div>
  );
}
