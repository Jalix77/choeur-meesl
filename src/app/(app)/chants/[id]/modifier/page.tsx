import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SongForm from '@/components/SongForm';
import FileManager from '@/components/FileManager';

async function updateSong(id: string, data: FormData): Promise<{ error?: string }> {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Accès refusé' };

  const { error } = await supabase.from('songs').update({
    title: data.get('title') as string,
    key_signature: (data.get('key_signature') as string) || null,
    tempo: data.get('tempo') ? Number(data.get('tempo')) : null,
    time_signature: (data.get('time_signature') as string) || null,
    author: (data.get('author') as string) || null,
    notation: (data.get('notation') as 'latin' | 'anglo') ?? 'latin',
    body: data.get('body') as string,
    notes: (data.get('notes') as string) || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: error.message };
  redirect(`/chants/${id}`);
}

export default async function ModifierChantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect(`/chants/${id}`);

  const { data: song } = await supabase.from('songs').select('*').eq('id', id).single();
  if (!song) notFound();

  const { data: files } = await supabase
    .from('song_files')
    .select('id, label, kind, storage_path')
    .eq('song_id', id)
    .order('created_at');

  const boundUpdate = updateSong.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318]">Modifier : {song.title}</h2>
        <div className="h-0.5 bg-[#E2B36A] w-16 mt-1" />
      </div>
      <div className="bg-white/50 border border-[#E2B36A]/40 rounded-xl shadow-sm p-6">
        <SongForm song={song} action={boundUpdate} />
      </div>
      <div className="bg-white/50 border border-[#E2B36A]/40 rounded-xl shadow-sm p-6">
        <FileManager songId={id} initialFiles={files ?? []} />
      </div>
    </div>
  );
}
