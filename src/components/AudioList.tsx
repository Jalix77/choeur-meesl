'use client'

import type { SongFile } from '@/lib/database.types'

interface AudioListProps {
  files: (SongFile & { signedUrl: string })[]
}

const kindLabel: Record<string, string> = {
  audio: 'Audio',
  playback: 'Playback',
  sheet: 'Partition',
}

export default function AudioList({ files }: AudioListProps) {
  const audioFiles = files.filter(f => f.kind === 'audio' || f.kind === 'playback')
  if (audioFiles.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-3">Fichiers audio</h3>
      <div className="space-y-3">
        {audioFiles.map(file => (
          <div key={file.id} className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-3">
            <p className="text-sm font-semibold text-[#5A3318] mb-2">
              <span className="text-xs text-[#B87333] mr-1">[{kindLabel[file.kind] ?? file.kind}]</span>
              {file.label}
            </p>
            <audio controls className="w-full h-8" src={file.signedUrl}>
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        ))}
      </div>
    </div>
  )
}
