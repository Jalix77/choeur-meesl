'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SongFile } from '@/lib/database.types'
import { songFileBucket } from '@/lib/database.types'

interface AudioListProps {
  files: (SongFile & { signedUrl: string })[]
  canDelete?: boolean
}

const KIND_LABEL: Record<string, string> = {
  audio:    'Audio',
  playback: 'Playback',
  sheet:    'Partition',
}

const KIND_ICON: Record<string, string> = {
  audio:    '🎵',
  playback: '🎹',
  sheet:    '📄',
}

function formatBytes(n: number | null | undefined): string {
  if (!n) return ''
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

export default function AudioList({ files, canDelete = false }: AudioListProps) {
  const router   = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  const audioFiles = files.filter(f => f.kind === 'audio' || f.kind === 'playback')
  if (audioFiles.length === 0) return null

  async function handleDelete(file: SongFile) {
    if (!confirm(`Supprimer "${file.label}" ?`)) return
    setDeleting(file.id)
    const bucket = songFileBucket(file)
    await supabase.storage.from(bucket).remove([file.storage_path])
    await supabase.from('song_files').delete().eq('id', file.id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#5A3318] px-4 py-2.5 flex items-center gap-2">
        <span className="text-[#E2B36A]">🎵</span>
        <h3 className="font-cinzel text-white text-sm font-semibold tracking-wide">
          Audio disponible
        </h3>
        <span className="ml-auto text-xs text-[#E2B36A]/70">{audioFiles.length} fichier{audioFiles.length > 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-[#E2B36A]/20">
        {audioFiles.map(file => (
          <div key={file.id} className="p-4 space-y-2">
            {/* File info row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base flex-shrink-0">{KIND_ICON[file.kind] ?? '🎵'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#5A3318] leading-tight">{file.label}</p>
                  <p className="text-xs text-[#B87333]/60 mt-0.5 flex items-center gap-1.5">
                    <span className="bg-[#E2B36A]/30 text-[#B87333] px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide">
                      {KIND_LABEL[file.kind] ?? file.kind}
                    </span>
                    {file.file_name && <span className="truncate hidden sm:inline">{file.file_name}</span>}
                    {file.size_bytes ? <span>· {formatBytes(file.size_bytes)}</span> : null}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Download */}
                <a
                  href={file.signedUrl}
                  download={file.file_name ?? file.label}
                  className="text-xs border border-[#E2B36A]/60 text-[#B87333] px-2 py-1 rounded hover:bg-[#E2B36A]/20 transition-colors"
                  title="Télécharger"
                >
                  ⬇
                </a>

                {/* Delete (admin only) */}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(file)}
                    disabled={deleting === file.id}
                    className="text-xs border border-red-200 text-red-500 hover:border-red-400 hover:text-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deleting === file.id ? '…' : '✕'}
                  </button>
                )}
              </div>
            </div>

            {/* Audio player */}
            <audio
              controls
              className="w-full h-9"
              preload="none"
              src={file.signedUrl}
            >
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        ))}
      </div>
    </div>
  )
}
