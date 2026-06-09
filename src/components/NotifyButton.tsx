'use client'

import { useState } from 'react'

interface NotifyResult {
  sent: number
  skipped: number
  failed: number
  total: number
  message?: string
  results?: { full_name: string; ok: boolean; skipped: boolean; error?: string }[]
}

interface Props {
  rehearsalId: string
  choristerCount: number
}

export default function NotifyButton({ rehearsalId, choristerCount }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<NotifyResult | null>(null)
  const [expanded, setExpanded] = useState(false)

  if (choristerCount === 0) return null

  async function handleSend() {
    if (!confirm(`Envoyer les notifications email aux ${choristerCount} choriste(s) assigné(s) ?`)) return

    setState('loading')
    setResult(null)

    try {
      const res = await fetch('/api/rehearsals/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rehearsal_id: rehearsalId }),
      })
      const data: NotifyResult = await res.json()

      if (!res.ok) {
        setState('error')
        setResult({ sent: 0, skipped: 0, failed: 0, total: 0, message: (data as { error?: string }).error ?? 'Erreur serveur' })
        return
      }

      setState('done')
      setResult(data)
    } catch (err) {
      setState('error')
      setResult({ sent: 0, skipped: 0, failed: 0, total: 0, message: String(err) })
    }
  }

  function reset() {
    setState('idle')
    setResult(null)
    setExpanded(false)
  }

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <button
        onClick={handleSend}
        className="flex items-center gap-1.5 text-xs bg-[#9C3D6E]/10 border border-[#9C3D6E]/30 text-[#9C3D6E] px-3 py-1.5 rounded-lg hover:bg-[#9C3D6E]/20 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        Envoyer les notifications
      </button>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs text-[#9C3D6E]">
        <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Envoi en cours…
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-1.5">
          ✗ {result?.message ?? 'Erreur inconnue'}
        </span>
        <button onClick={reset} className="text-xs text-[#B87333] hover:underline">Réessayer</button>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  const hasFailed = (result?.failed ?? 0) > 0
  const allSkipped = result && result.sent === 0 && result.skipped > 0 && result.failed === 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {allSkipped ? (
          <span className="text-xs text-[#B87333] border border-[#E2B36A]/60 bg-[#FBF6EC] rounded-lg px-3 py-1.5">
            ✓ Déjà notifiés ({result!.skipped})
          </span>
        ) : (
          <span className={`text-xs border rounded-lg px-3 py-1.5 ${hasFailed ? 'text-amber-700 border-amber-200 bg-amber-50' : 'text-green-700 border-green-200 bg-green-50'}`}>
            ✓ {result?.sent} envoyé{(result?.sent ?? 0) > 1 ? 's' : ''}
            {(result?.skipped ?? 0) > 0 && ` · ${result!.skipped} déjà notifié${result!.skipped > 1 ? 's' : ''}`}
            {hasFailed && ` · ${result!.failed} échec${result!.failed > 1 ? 's' : ''}`}
          </span>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-[#B87333]/70 hover:text-[#B87333] hover:underline"
        >
          {expanded ? 'Masquer' : 'Détails'}
        </button>
        <button onClick={reset} className="text-xs text-[#B87333]/70 hover:text-[#B87333] hover:underline">
          Renvoyer
        </button>
      </div>

      {expanded && result?.results && (
        <ul className="text-xs space-y-0.5 pl-1">
          {result.results.map((r, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className={r.ok ? (r.skipped ? 'text-[#B87333]' : 'text-green-600') : 'text-red-500'}>
                {r.ok ? (r.skipped ? '↩' : '✓') : '✗'}
              </span>
              <span className="text-[#5A3318]">{r.full_name}</span>
              {r.skipped && <span className="text-[#B87333]/60">(déjà notifié)</span>}
              {r.error && <span className="text-red-500">{r.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
