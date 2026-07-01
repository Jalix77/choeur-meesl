'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SongFile, FileKind } from '@/lib/database.types'
import { songFileBucket } from '@/lib/database.types'
import { isValidYouTubeUrl } from '@/lib/youtube'
import { useRouter } from 'next/navigation'

interface FileManagerProps {
  songId: string
  files: SongFile[]
  userRole?: string | null
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

const YOUTUBE_LABEL_PRESETS = [
  'Version originale',
  'Tutoriel piano',
  'Référence chorale',
  'Playback YouTube',
]

const KIND_OPTIONS: { value: FileKind; label: string }[] = [
  { value: 'audio',    label: '🎵 Audio' },
  { value: 'playback', label: '🎹 Playback' },
  { value: 'sheet',    label: '📄 Partition' },
  { value: 'youtube',  label: '🎥 YouTube' },
]

const ACCEPT = 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/x-m4a,audio/mp4,audio/m4a'
const MAX_BYTES = 20 * 1024 * 1024  // 20 MB

function formatBytes(n: number | null | undefined): string {
  if (!n) return ''
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_')
}

function formatSupabaseError(err: { message?: string; details?: string; hint?: string; code?: string }): string {
  const parts: string[] = []
  if (err.message) parts.push(err.message)
  if (err.details) parts.push(`Détails : ${err.details}`)
  if (err.hint)    parts.push(`Aide : ${err.hint}`)
  if (err.code)    parts.push(`Code : ${err.code}`)
  return parts.join(' — ')
}

export default function FileManager({ songId, files: initialFiles, userRole }: FileManagerProps) {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [files,       setFiles]       = useState<SongFile[]>(initialFiles)
  const [label,       setLabel]       = useState('')
  const [customLabel, setCustom]      = useState('')
  const [kind,        setKind]        = useState<FileKind>('audio')
  const [youtubeUrl,  setYoutubeUrl]  = useState('')
  const [uploading,   setUploading]   = useState(false)
  const [progress,    setProgress]    = useState(0)          // 0–100
  const [progressMsg, setProgressMsg] = useState('')
  const [success,     setSuccess]     = useState('')
  const [error,       setError]       = useState('')
  const [replacing,   setReplacing]   = useState<SongFile | null>(null)

  const effectiveLabel = label === '__custom__' ? customLabel : label
  const canManage = userRole === 'admin' || userRole === 'leader'

  function startReplace(file: SongFile) {
    setReplacing(file)
    if (file.kind === 'youtube' && !YOUTUBE_LABEL_PRESETS.includes(file.label)) {
      setLabel('__custom__')
      setCustom(file.label)
    } else {
      setLabel(file.label)
      setCustom('')
    }
    setKind(file.kind)
    setYoutubeUrl(file.video_url ?? '')
    setError('')
    setSuccess('')
    if (file.kind !== 'youtube') fileRef.current?.click()
  }

  function cancelReplace() {
    setReplacing(null)
    setLabel('')
    setCustom('')
    setYoutubeUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleYoutubeSubmit() {
    if (!effectiveLabel.trim()) { setError('Veuillez saisir un label.'); return }
    const url = youtubeUrl.trim()
    if (!isValidYouTubeUrl(url)) {
      setError('Lien YouTube invalide. Formats acceptés : youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()

    if (replacing) {
      const { error: dbErr } = await supabase
        .from('song_files')
        .update({ label: effectiveLabel.trim(), video_url: url })
        .eq('id', replacing.id)

      if (dbErr) {
        setError(`Erreur BDD (mise à jour) : ${formatSupabaseError(dbErr)}`)
        setUploading(false)
        return
      }

      setFiles(f => f.map(x => x.id === replacing.id ? { ...x, label: effectiveLabel.trim(), video_url: url } : x))
      setSuccess(`"${effectiveLabel.trim()}" mis à jour avec succès.`)
      setReplacing(null)
    } else {
      const { data: row, error: dbErr } = await supabase
        .from('song_files')
        .insert({
          song_id:     songId,
          label:       effectiveLabel.trim(),
          kind:        'youtube',
          video_url:   url,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single()

      if (dbErr) {
        setError(`Erreur BDD (insertion) : ${formatSupabaseError(dbErr)}`)
        setUploading(false)
        return
      }

      setFiles(f => [...f, row])
      setSuccess(`"${effectiveLabel.trim()}" ajouté avec succès.`)
    }

    setLabel('')
    setCustom('')
    setYoutubeUrl('')
    setUploading(false)
    router.refresh()
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!canManage) {
      setError('Permission refusée : vous devez être Admin ou Leader pour gérer les fichiers.')
      return
    }

    if (kind === 'youtube') {
      await handleYoutubeSubmit()
      return
    }

    const file = fileRef.current?.files?.[0]
    if (!file) return
    if (!effectiveLabel.trim()) { setError('Veuillez saisir un label.'); return }

    if (file.size > MAX_BYTES) {
      setError(`Fichier trop volumineux : ${formatBytes(file.size)}. Maximum autorisé : 20 Mo.`)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')
    setProgress(5)
    setProgressMsg('Préparation…')

    const timestamp = Date.now()
    const storagePath = `${songId}/${timestamp}-${safeName(file.name)}`

    // If replacing, delete old storage file first
    if (replacing && replacing.storage_path) {
      await supabase.storage.from(songFileBucket(replacing)).remove([replacing.storage_path])
    }

    setProgress(15)
    setProgressMsg('Téléversement en cours…')

    // Animate progress while uploading (Supabase SDK doesn't expose progress events)
    const progressInterval = simulateProgress(15, 85, setProgress)

    const { error: uploadErr } = await supabase.storage
      .from('song-audios')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    clearInterval(progressInterval)

    if (uploadErr) {
      setProgress(0)
      setProgressMsg('')
      setError(`Erreur storage : ${formatSupabaseError(uploadErr)}`)
      setUploading(false)
      return
    }

    setProgress(88)
    setProgressMsg('Enregistrement des métadonnées…')

    const { data: { user } } = await supabase.auth.getUser()

    if (replacing) {
      // Update existing record
      const { error: dbErr } = await supabase
        .from('song_files')
        .update({
          label:        effectiveLabel.trim(),
          kind,
          storage_path: storagePath,
          file_name:    file.name,
          mime_type:    file.type,
          size_bytes:   file.size,
        })
        .eq('id', replacing.id)

      if (dbErr) {
        await supabase.storage.from('song-audios').remove([storagePath])
        setProgress(0)
        setProgressMsg('')
        setError(`Erreur BDD (mise à jour) : ${formatSupabaseError(dbErr)}`)
        setUploading(false)
        return
      }

      setFiles(f => f.map(x => x.id === replacing.id
        ? { ...x, label: effectiveLabel.trim(), kind, storage_path: storagePath, file_name: file.name, mime_type: file.type, size_bytes: file.size }
        : x
      ))
      setSuccess(`"${effectiveLabel.trim()}" remplacé avec succès.`)
      setReplacing(null)
    } else {
      // Insert new record
      const { data: row, error: dbErr } = await supabase
        .from('song_files')
        .insert({
          song_id:      songId,
          label:        effectiveLabel.trim(),
          kind,
          storage_path: storagePath,
          file_name:    file.name,
          mime_type:    file.type,
          size_bytes:   file.size,
          uploaded_by:  user?.id ?? null,
        })
        .select()
        .single()

      if (dbErr) {
        await supabase.storage.from('song-audios').remove([storagePath])
        setProgress(0)
        setProgressMsg('')
        setError(`Erreur BDD (insertion) : ${formatSupabaseError(dbErr)}`)
        setUploading(false)
        return
      }

      setFiles(f => [...f, row])
      setSuccess(`"${effectiveLabel.trim()}" téléversé avec succès.`)
    }

    setProgress(100)
    setProgressMsg('Terminé !')
    setLabel('')
    setCustom('')
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
    setTimeout(() => { setProgress(0); setProgressMsg('') }, 1500)
    router.refresh()
  }

  async function handleDelete(file: SongFile) {
    if (!confirm('Supprimer ce fichier définitivement ?')) return
    if (file.kind !== 'youtube' && file.storage_path) {
      const { error: storageErr } = await supabase.storage.from(songFileBucket(file)).remove([file.storage_path])
      if (storageErr) {
        alert(`Erreur suppression storage : ${storageErr.message}`)
        return
      }
    }
    const fileId = file.id
    const { error: dbErr } = await supabase.from('song_files').delete().eq('id', fileId)
    if (dbErr) {
      alert(`Erreur suppression BDD : ${formatSupabaseError(dbErr)}`)
      return
    }
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
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#B87333] uppercase mr-1.5">[{file.kind}]</span>
                <span className="text-sm text-[#5A3318] font-medium">{file.label}</span>
                {file.file_name && (
                  <span className="text-xs text-[#B87333]/50 ml-2 truncate hidden sm:inline">{file.file_name}</span>
                )}
                {file.size_bytes && (
                  <span className="text-xs text-[#B87333]/50 ml-1">· {formatBytes(file.size_bytes)}</span>
                )}
                {file.kind === 'youtube' && file.video_url && (
                  <span className="text-xs text-[#B87333]/50 ml-2 truncate hidden sm:inline">{file.video_url}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => startReplace(file)}
                  className="text-xs text-[#B87333] hover:text-[#5A3318] border border-[#E2B36A]/60 hover:border-[#B87333] px-2 py-1 rounded transition-colors"
                  title={file.kind === 'youtube' ? 'Modifier le lien' : 'Remplacer le fichier'}
                >
                  {file.kind === 'youtube' ? '✎ Modifier' : '↺ Remplacer'}
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Replace mode banner */}
      {replacing && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm">
          <span className="text-amber-800">
            {replacing.kind === 'youtube' ? (
              <>✎ Modification de <strong>&quot;{replacing.label}&quot;</strong></>
            ) : (
              <>↺ Remplacement de <strong>&quot;{replacing.label}&quot;</strong> — sélectionnez un nouveau fichier</>
            )}
          </span>
          <button onClick={cancelReplace} className="text-amber-600 hover:text-amber-900 ml-3 text-xs underline">
            Annuler
          </button>
        </div>
      )}

      {/* Upload form */}
      <form onSubmit={handleUpload} className="border border-[#E2B36A]/40 rounded-xl p-4 bg-[#FBF6EC]/40 space-y-3">
        <p className="text-xs font-semibold text-[#5A3318] uppercase tracking-wide">
          {replacing ? (replacing.kind === 'youtube' ? '✎ Modifier le lien YouTube' : '↺ Remplacer le fichier') : 'Ajouter un fichier'}
        </p>

        {/* Kind */}
        {!replacing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {KIND_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { setKind(o.value); setLabel(''); setError('') }}
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
        )}

        {/* Label */}
        {(!replacing || kind === 'youtube') && (
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">Label *</label>
            <select
              className={inputCls}
              value={label}
              onChange={e => { setLabel(e.target.value); setError('') }}
              required={label !== '__custom__'}
            >
              <option value="">— Choisir un label —</option>
              {(kind === 'youtube' ? YOUTUBE_LABEL_PRESETS : LABEL_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
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
        )}

        {/* File picker (audio / playback / sheet) */}
        {kind !== 'youtube' && (
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">
              Fichier audio{' '}
              <span className="font-normal text-[#B87333]/60">(mp3, wav, m4a — max 20 Mo)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className={inputCls}
              required={!replacing}
              onChange={() => setError('')}
            />
          </div>
        )}

        {/* YouTube URL */}
        {kind === 'youtube' && (
          <div>
            <label className="block text-xs font-semibold text-[#5A3318] mb-1">
              URL YouTube{' '}
              <span className="font-normal text-[#B87333]/60">(watch, youtu.be ou shorts)</span>
            </label>
            <input
              type="url"
              className={inputCls}
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => { setYoutubeUrl(e.target.value); setError('') }}
              required
            />
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#B87333]">
              <span>{progressMsg}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[#E2B36A]/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#B87333] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-mono break-all">
            ✕ {error}
          </div>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            ✓ {success}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || (kind === 'youtube' ? (!effectiveLabel.trim() || !youtubeUrl.trim()) : (!replacing && !label))}
          className="bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              {replacing ? (kind === 'youtube' ? 'Enregistrement…' : 'Remplacement…') : (kind === 'youtube' ? 'Ajout…' : 'Téléversement…')}
            </>
          ) : replacing
            ? (kind === 'youtube' ? '✎ Enregistrer les modifications' : '↺ Confirmer le remplacement')
            : (kind === 'youtube' ? '🎥 Ajouter le lien' : '⬆ Téléverser')}
        </button>
      </form>
    </div>
  )
}

/** Animate progress from `from` to `to` over ~3 s — returns interval id */
function simulateProgress(from: number, to: number, setProgress: (v: number) => void): ReturnType<typeof setInterval> {
  let current = from
  const step = (to - from) / 30
  return setInterval(() => {
    current = Math.min(current + step, to)
    setProgress(Math.round(current))
  }, 100)
}
