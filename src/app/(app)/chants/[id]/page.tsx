import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SongSheet from '@/components/SongSheet'
import AudioList from '@/components/AudioList'
import YoutubeList from '@/components/YoutubeList'
import FileManager from '@/components/FileManager'
import type { Profile, SongFile } from '@/lib/database.types'
import { songFileBucket } from '@/lib/database.types'
import { canManageContent } from '@/lib/roles'

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
  const isAdmin = canManageContent((profile as Pick<Profile, 'role'> | null)?.role)

  const { data: songFiles } = await supabase
    .from('song_files')
    .select('*')
    .eq('song_id', id)
    .order('created_at')

  // Generate signed URLs — route to the correct bucket per file (skip YouTube links, no storage object)
  const filesWithUrls = await Promise.all(
    (songFiles ?? [])
      .filter((file: SongFile) => file.kind !== 'youtube' && file.storage_path)
      .map(async (file: SongFile) => {
        const bucket = songFileBucket(file)
        const { data } = await supabase.storage.from(bucket).createSignedUrl(file.storage_path!, 3600)
        return { ...file, signedUrl: data?.signedUrl ?? '' }
      })
  )

  const youtubeFiles = (songFiles ?? []).filter((file: SongFile) => file.kind === 'youtube')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Link href="/chants" className="text-xs text-[#B87333] hover:underline">← Retour aux chants</Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#5A3318] leading-tight">{song.title}</h1>
            {song.author && <p className="text-sm text-[#B87333]/70 mt-0.5">{song.author}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            <Link
              href={`/chants/${id}/imprimer?t=${initialTranspose}`}
              className="border border-[#B87333] text-[#B87333] hover:bg-[#B87333] hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              🖨 Imprimer / PDF
            </Link>
            {isAdmin && (
              <Link
                href={`/chants/${id}/modifier`}
                className="bg-[#B87333] hover:bg-[#5A3318] text-white text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Modifier
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Song sheet */}
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-3 sm:p-5 shadow-sm overflow-x-hidden">
        <SongSheet song={song} initialTranspose={initialTranspose} />
      </div>

      {/* Audio player — visible to all members when files exist */}
      {filesWithUrls.length > 0 && (
        <AudioList files={filesWithUrls} canDelete={isAdmin} />
      )}

      {/* YouTube videos — visible to all members when links exist */}
      {youtubeFiles.length > 0 && (
        <YoutubeList files={youtubeFiles} songTitle={song.title} canDelete={isAdmin} />
      )}

      {/* Audio upload — admin only, always shown so they can add files */}
      {isAdmin && (
        <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
          <FileManager songId={id} files={(songFiles ?? []) as SongFile[]} userRole={profile?.role ?? null} />
        </div>
      )}
    </div>
  )
}
