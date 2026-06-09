import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SongForm from '@/components/SongForm'
import FileManager from '@/components/FileManager'
import type { Profile, SongFile } from '@/lib/database.types'

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if ((profile as Pick<Profile, 'role'> | null)?.role !== 'admin') redirect('/')

  const { data: song } = await supabase.from('songs').select('*').eq('id', id).single()
  if (!song) notFound()

  const { data: files } = await supabase
    .from('song_files')
    .select('*')
    .eq('song_id', id)
    .order('created_at')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Modifier : {song.title}</h1>
      </div>

      {/* Song metadata + chords */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
        <SongForm song={song} />
      </div>

      {/* Audio / Playback */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
        <FileManager songId={id} files={(files ?? []) as SongFile[]} />
      </div>
    </div>
  )
}
