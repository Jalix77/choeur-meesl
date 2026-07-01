'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SongFile } from '@/lib/database.types'
import { parseYouTubeId, youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/youtube'
import { buildSongYoutubeWAUrl } from '@/lib/whatsapp'

interface YoutubeListProps {
  files: SongFile[]
  songTitle: string
  canDelete?: boolean
}

function WAIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.85.505 3.58 1.383 5.064L2 22l5.064-1.383A9.953 9.953 0 0012 22c5.523 0 10-4.478 10-10S17.523 2 12 2zm0 18.001c-1.71 0-3.318-.469-4.69-1.283l-.335-.196-3.469.949.938-3.42-.219-.351A7.966 7.966 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8.001-8 8.001z"/>
    </svg>
  )
}

export default function YoutubeList({ files, songTitle, canDelete = false }: YoutubeListProps) {
  const router   = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  if (files.length === 0) return null

  async function handleDelete(file: SongFile) {
    if (!confirm(`Supprimer "${file.label}" ?`)) return
    setDeleting(file.id)
    await supabase.from('song_files').delete().eq('id', file.id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#5A3318] px-4 py-2.5 flex items-center gap-2">
        <span className="text-[#E2B36A]">🎥</span>
        <h3 className="font-cinzel text-white text-sm font-semibold tracking-wide">
          Vidéos YouTube
        </h3>
        <span className="ml-auto text-xs text-[#E2B36A]/70">{files.length} lien{files.length > 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-[#E2B36A]/20">
        {files.map(file => {
          const url     = file.video_url ?? ''
          const videoId = parseYouTubeId(url)
          const watchUrl = videoId ? youtubeWatchUrl(videoId) : url
          const waUrl    = buildSongYoutubeWAUrl(songTitle, watchUrl)

          return (
            <div key={file.id} className="p-4 space-y-3">
              {/* Label + actions row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">🎥</span>
                  <p className="text-sm font-semibold text-[#5A3318] leading-tight">{file.label}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-[#E2B36A]/60 text-[#B87333] px-2.5 py-1.5 rounded-lg hover:bg-[#E2B36A]/20 transition-colors whitespace-nowrap"
                  >
                    ▶ Ouvrir YouTube
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs bg-[#25D366] hover:bg-[#1fba59] text-white px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <WAIcon size={12} />
                    <span>Partager</span>
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deleting === file.id}
                      className="text-xs border border-red-200 text-red-500 hover:border-red-400 hover:text-red-700 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleting === file.id ? '…' : '✕'}
                    </button>
                  )}
                </div>
              </div>

              {/* Embedded preview */}
              {videoId && (
                <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={youtubeEmbedUrl(videoId)}
                    title={file.label}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
