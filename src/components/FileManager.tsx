'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SongFile } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

interface FileManagerProps {
  songId: string
  files: SongFile[]
}

const kindOptions = [
  { value: 'audio', label: 'Audio' },
  { value: 'playback', label: 'Playback' },
  { value: 'sheet', label: 'Partition' },
]

export default function FileManager({ songId, files: initialFiles }: FileManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [files, setFiles] = useState(initialFiles)
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<'audio' | 'playback' | 'sheet'>('audio')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file || !label) return
    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const uuid = crypto.randomUUID()
    const path = `songs/${songId}/${uuid}-${file.name}`

    const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
    if (uploadErr) { setError(uploadErr.message); setUploading(false); return }

    const { data, error: dbErr } = await supabase.from('song_files').insert({
      song_id: songId, label, kind, storage_path: path,
    }).select().single()
    if (dbErr) { setError(dbErr.message); setUploading(false); return }

    setFiles(f => [...f, data])
    setLabel('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    router.refresh()
  }

  async function handleDelete(fileId: string, storagePath: string) {
    if (!confirm('Supprimer ce fichier ?')) return
    await supabase.storage.from('media').remove([storagePath])
    await supabase.from('song_files').delete().eq('id', fileId)
    setFiles(f => f.filter(x => x.id !== fileId))
    router.refresh()
  }

  const inputCls = "border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"

  return (
    <div>
      <h3 className="font-cinzel font-bold text-[#5A3318] mb-4">Fichiers audio / playbacks</h3>

      {/* Existing files */}
      {files.length > 0 && (
        <ul className="space-y-2 mb-4">
          {files.map(file => (
            <li key={file.id} className="flex items-center justify-between bg-[#E2B36A]/10 rounded-lg px-3 py-2 text-sm">
              <span className="text-[#5A3318]">
                <span className="text-[#B87333] text-xs mr-1">[{file.kind}]</span>{file.label}
              </span>
              <button onClick={() => handleDelete(file.id, file.storage_path)} className="text-red-500 hover:text-red-700 text-xs">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload form */}
      <form onSubmit={handleUpload} className="space-y-3">
        <p className="text-sm font-semibold text-[#5A3318]">Ajouter un fichier</p>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Label (ex: Soprano, piste 1)" value={label} onChange={e => setLabel(e.target.value)} required />
          <select className={inputCls} value={kind} onChange={e => setKind(e.target.value as 'audio' | 'playback' | 'sheet')}>
            {kindOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <input ref={fileRef} type="file" accept="audio/*,application/pdf" className={`${inputCls} w-full`} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={uploading} className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
          {uploading ? 'Upload…' : 'Téléverser'}
        </button>
      </form>
    </div>
  )
}
