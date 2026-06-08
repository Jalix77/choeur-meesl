import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SongSheet from '@/components/SongSheet'
import AudioList from '@/components/AudioList'
import type { Profile, SongFile } from '@/lib/database.types'

export default async function SongPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams
  const initialTranspose = t ? parseInt(t) : 0

  const supabase = await createClient()

  const { data: song } = await supabase.from('songs').select('*').eq('id', id).single()
  if (!song) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = (profile as Pick<Profile, 'role'> | null)?.role === 'admin'

  const { data: songFiles } = await supabase
    .from('song_files')
    .select('*')
    .eq('song_id', id)
    .order('created_at')

  // Generate signed URLs for audio files
  const filesWithUrls = await Promise.all(
    (songFiles ?? []).map(async (file: SongFile) => {
      const { data } = await supabase.storage.from('media').createSignedUrl(file.storage_path, 3600)
      return { ...file, signedUrl: data?.signedUrl ?? '' }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/chants" className="text-xs text-[#B87333] hover:underline">← Retour aux chants</Link>
          <h1 className="font-cinzel text-2xl font-bold text-[#5A3318] mt-1">{song.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/chants/${id}/imprimer?t=${initialTranspose}`}
            className="border border-[#B87333] text-[#B87333] hover:bg-[#B87333] hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            🖨 Imprimer / PDF
          </Link>
          {isAdmin && (
            <Link
              href={`/chants/${id}/modifier`}
              className="bg-[#B87333] hover:bg-[#5A3318] text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Song sheet */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
        <SongSheet song={song} initialTranspose={initialTranspose} />
      </div>

      {/* Audio files */}
      <AudioList files={filesWithUrls} />
    </div>
  )
}
