'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Song, SongFile } from '@/lib/database.types'
import { songFileBucket } from '@/lib/database.types'

interface SongsListProps {
  songs: Song[]
  canEdit: boolean
  searchQuery?: string
}

export default function SongsList({ songs: initialSongs, canEdit, searchQuery }: SongsListProps) {
  const supabase = createClient()

  const [songs,     setSongs]     = useState<Song[]>(initialSongs)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  async function handleDelete(song: Song) {
    if (!confirm(`Êtes-vous certain de vouloir supprimer "${song.title}" ?\n\nCette action est irréversible.`)) return

    setDeleting(song.id)
    setError('')
    setSuccess('')

    // Remove any linked storage files first (audio / playback / partition) — YouTube links have no storage object
    const { data: files } = await supabase
      .from('song_files')
      .select('kind, storage_path')
      .eq('song_id', song.id)

    const mediaPaths: string[] = []
    const audioPaths: string[] = []
    for (const f of (files ?? []) as Pick<SongFile, 'kind' | 'storage_path'>[]) {
      if (f.kind === 'youtube' || !f.storage_path) continue
      const bucket = songFileBucket(f)
      if (bucket === 'media') mediaPaths.push(f.storage_path)
      else audioPaths.push(f.storage_path)
    }
    if (mediaPaths.length) await supabase.storage.from('media').remove(mediaPaths)
    if (audioPaths.length) await supabase.storage.from('song-audios').remove(audioPaths)

    // Deleting the song cascades to rehearsal_songs and song_files rows
    const { error: dbErr } = await supabase.from('songs').delete().eq('id', song.id)

    if (dbErr) {
      setError(`Erreur lors de la suppression : ${dbErr.message}`)
      setDeleting(null)
      return
    }

    setSongs(s => s.filter(x => x.id !== song.id))
    setSuccess(`"${song.title}" a été supprimé avec succès.`)
    setDeleting(null)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ✕ {error}
        </div>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          ✓ {success}
        </p>
      )}

      {songs.length > 0 ? (
        <div className="grid gap-2">
          {songs.map(song => (
            <div key={song.id}
              className="flex items-center justify-between bg-white/60 border border-[#E2B36A]/40 rounded-xl px-3 sm:px-4 py-3 hover:border-[#B87333]/50 transition-colors gap-2">
              <div className="flex-1 min-w-0">
                <Link href={`/chants/${song.id}`}
                  className="font-semibold text-[#5A3318] hover:text-[#B87333] transition-colors text-sm sm:text-base line-clamp-1">
                  {song.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  {song.key_signature && <span className="text-xs text-[#B87333]">Ton : {song.key_signature}</span>}
                  {song.tempo && <span className="text-xs text-[#7A4A20]">♩ {song.tempo}</span>}
                  {song.author && <span className="text-xs text-[#7A4A20] truncate max-w-[120px]">{song.author}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/chants/${song.id}`} className="text-xs text-[#B87333] hover:underline">Voir</Link>
                {canEdit && (
                  <>
                    <Link href={`/chants/${song.id}/modifier`} className="text-xs text-[#7A4A20] hover:underline hidden sm:inline">Modifier</Link>
                    <button
                      onClick={() => handleDelete(song)}
                      disabled={deleting === song.id}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {deleting === song.id ? '…' : 'Supprimer'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#B87333]/70 italic">
          {searchQuery ? `Aucun résultat pour « ${searchQuery} »` : 'Aucun chant pour l\'instant.'}
        </div>
      )}
    </div>
  )
}
