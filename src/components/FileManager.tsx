'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SongFile } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

interface FileManagerProps {
  songId: string
  files: SongFile[]
}

const LABEL_PRESETS = [
  'Version répétition',
  'Playback',
  'Voix soprano',
  'Voix alto',
  'Voix ténor',
  'Voix basse',
  'Voix lead',
  'Piano',
  'Guitare',
  'Piste complète',
]

const KIND_OPTIONS = [
  { value: 'audio',    label: '🎵 Audio' },
  { value: 'playback', label: '🎹 Playback' },
  { value: 'sheet',    label: '📄 Partition' },
]

const ACCEPT = 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/x-m4a,audio/ogg,audio/webm'
const MAX_BYTES = 50 * 1024 * 1024  // 50 MB

function formatBytes(n: number | null | undefined): string {
  if (!n) return ''
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_')
}

export default function FileManager({ songId, files: initialFiles }: FileManagerProps) {
  const router  = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [files,     setFiles]     = useState<SongFile[]>(initialFiles)
  const [label,     setLabel]     = useState('')
  const [customLabel, setCustom]  = useState('')
  const [kind,      setKind]      = useState<'audio' | 'playback' | 'sheet'>('audio')
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState<string>('')
  const [success,   setSuccess]   = useState('')
  const [error,     setError]     = useState('')

  const effectiveLabel = label === '__custom__' ? customLabel : label

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    if (!effectiveLabel.trim()) { setError('Veuillez saisir un label.'); return }

    // Client-side size guard
    if (file.size > MAX_BYTES) {
      setError(`Fichier trop volumineux. Maximum : 50 Mo (fichier : ${formatBytes(file.size)}).`)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')
    setProgress('Téléversement…')

    const timestamp = Date.now()
    const path = `${songId}/${timestamp}-${safeName(file.name)}`

    const { error: uploadErr } = await supabase.storage
      .from('song-audios')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      setProgress('')
      return
    }

    setProgress('Enregistrement des métadonnées…')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: row, error: dbErr } = await supabase
      .from('song_files')
      .insert({
        song_id:      songId,
        label:        effectiveLabel.trim(),
        kind,
        storage_path: path,
        file_name:    file.name,
        mime_type:    file.type,
        size_bytes:   file.size,
        uploaded_by:  user?.id ?? null,
      })
      .select()
      .single()

    if (dbErr) {
      // Roll back storage upload
      await supabase.storage.from('song-audios').remove([path])
      setError(dbErr.message)
      setUploading(false)
      setProgress('')
      return
    }

    setFiles(f => [...f, row])
    setSuccess(`"${effectiveLabel.trim()}" téléversé avec succès.`)
    setLabel('')
    setCustom('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    setProgress('')
    router.refresh()
  }

  async function handleDelete(fileId: string, storagePath: string) {
    if (!confirm('Supprimer ce fichier définitivement ?')) return
    // Determine bucket: legacy files are in 'media', new ones in 'song-audios'
    const bucket = storagePath.startsWith('songs/') ? 'media' : 'song-audios'
    await supabase.storage.from(bucket).remove([storagePath])
    await supabase.from('song_files').delete().eq('id', fileId)
    setFiles(f => f.filter(x => x.id !== fileId))
    router.refresh()
  }

  const inputCls = "w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40 text-sm"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🎵</span>
        <h3 className="font-cinzel font-bold text-[#5A3318]">Audio / Playback</h3>
      </div>

      {/* Existing files */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map(file => (
            <li key={file.id}
              className="flex items-center justify-between gap-3 bg-[#FBF6EC] border border-[#E2B36A]/40 rounded-lg px-3 py-2.5">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#B87333] uppercase mr-1.5">[{file.kind}]</span>
                <span className="text-sm text-[#5A3318] font-medium">{file.label}</span>
                {file.file_name && (
                  <span className="text-xs text-[#B87333]/50 ml-2 truncate hidden sm:inline">{file.file_name}</span>
                )}
                {file.size_bytes && (
                  <span className="text-xs text-[#B87333]/50 ml-1">· {formatBytes(file.size_bytes)}</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(file.id, file.storage_path)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors flex-shrink-0"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload form */}
      <form onSubmit={handleUpload} className="border border-[#E2B36A]/40 rounded-xl p-4 bg-[#FBF6EC]/40 space-y-3">
        <p className="text-xs font-semibold text-[#5A3318] uppercase tracking-wide">Ajouter un fichier</p>

        {/* Kind */}
        <div className="grid grid-cols-3 gap-2">
          {KIND_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setKind(o.value as 'audio' | 'playback' | 'sheet')}
              className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                kind === o.value
                  ? 'bg-[#B87333] border-[#B87333] text-white font-semibold'
                  : 'border-[#E2B36A]/60 text-[#5A3318] hover:bg-[#E2B36A]/20'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Label *</label>
          <select className={inputCls} value={label} onChange={e => { setLabel(e.target.value); setError('') }} required={label !== '__custom__'}>
            <option value="">— Choisir un label —</option>
            {LABEL_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="__custom__">Autre (saisir manuellement)</option>
          </select>
          {label === '__custom__' && (
            <input
              className={`${inputCls} mt-2`}
              placeholder="Label personnalisé"
              value={customLabel}
              onChange={e => setCustom(e.target.value)}
              required
            />
          )}
        </div>

        {/* File picker */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">
            Fichier audio <span className="font-normal text-[#B87333]/60">(mp3, wav, m4a, ogg, webm — max 50 Mo)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className={inputCls}
            required
            onChange={() => setError('')}
          />
        </div>

        {/* Feedback */}
        {progress && <p className="text-xs text-[#B87333] animate-pulse">{progress}</p>}
        {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ {success}</p>}

        <button
          type="submit"
          disabled={uploading || !label}
          className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Téléversement…
            </>
          ) : '⬆ Téléverser'}
        </button>
      </form>
    </div>
  )
}
