'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AnnouncementWithRecipients, Role } from '@/lib/database.types'
import { ROLE_LABELS } from '@/lib/roles'
import { buildAnnouncementWAUrl, cleanHaitianPhone } from '@/lib/whatsapp'

// ── Types locaux ──────────────────────────────────────────────────────────────

type RecipientMode = 'all' | 'leaders' | 'members' | 'manual'
type Step = 'idle' | 'form' | 'notify'

export interface MemberOption {
  id: string
  full_name: string
  phone: string | null
  role: Role
  avatar_url: string | null
}

interface RecipientWithProfile {
  id: string
  profile_id: string
  status: string
  sent_at: string | null
  profiles: { full_name: string; phone: string | null } | null
}

interface Props {
  announcement?: AnnouncementWithRecipients
  editMode?: boolean
  members: MemberOption[]
}

// ── Icône WhatsApp SVG ────────────────────────────────────────────────────────

function WAIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ── Ligne individuelle dans le panneau de notifications ───────────────────────

function RecipientRow({
  rec, title, content, onSent,
}: {
  rec: RecipientWithProfile
  title: string
  content: string
  onSent: (id: string) => void
}) {
  const supabase = createClient()
  const [sent, setSent] = useState(rec.status === 'sent')
  const [marking, setMarking] = useState(false)

  const name  = rec.profiles?.full_name ?? '—'
  const phone = rec.profiles?.phone ?? null
  const waUrl = phone ? buildAnnouncementWAUrl(phone, title, content) : null

  async function markSent() {
    setMarking(true)
    await supabase
      .from('announcement_recipients')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', rec.id)
    setSent(true)
    onSent(rec.id)
    setMarking(false)
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-[#E2B36A]/20 last:border-0">
      {/* Infos membre */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base flex-shrink-0">{sent ? '✅' : '⏳'}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#5A3318] truncate">{name}</p>
          {phone ? (
            <p className="text-xs text-[#B87333]/70">{phone}</p>
          ) : (
            <p className="text-xs text-red-400 italic">Aucun numéro WhatsApp</p>
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (!sent) setTimeout(markSent, 800) }}
            className="flex items-center gap-1 text-xs bg-[#25D366] hover:bg-[#1fba59] text-white px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <WAIcon size={12} />
            <span>Envoyer</span>
          </a>
        ) : (
          <span className="text-xs text-[#B87333]/40 italic px-2">Pas de numéro</span>
        )}
        {!sent && (
          <button
            onClick={markSent}
            disabled={marking}
            title="Marquer comme envoyé"
            className="text-xs border border-green-300 text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  )
}

// ── Panneau de notifications (step === 'notify') ───────────────────────────────

function NotifyPanel({
  title, content, announcementId, initialRecipients, onClose,
}: {
  title: string
  content: string
  announcementId: string
  initialRecipients: RecipientWithProfile[] | null
  onClose: () => void
}) {
  const [recipients, setRecipients] = useState<RecipientWithProfile[]>(initialRecipients ?? [])
  const sentCount = recipients.filter(r => r.status === 'sent').length
  const totalCount = recipients.length
  const pct = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0

  function handleSent(id: string) {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' } : r))
  }

  return (
    <div className="bg-white/90 border border-[#25D366]/30 rounded-xl p-4 sm:p-5 shadow mb-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-cinzel font-bold text-[#5A3318] flex items-center gap-2 text-sm sm:text-base">
            <WAIcon size={15} />
            Notifications WhatsApp
          </h3>
          <p className="text-xs text-[#B87333]/70 mt-0.5 truncate">{title}</p>
        </div>
        <button onClick={onClose} className="text-[#B87333] hover:text-[#5A3318] text-xl leading-none flex-shrink-0">✕</button>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-[#B87333]/60 italic text-center py-6">Aucun destinataire enregistré.</p>
      ) : (
        <>
          {/* Barre de progression */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-[#E2B36A]/10 rounded-xl">
            <span className="text-xs font-semibold text-[#5A3318] whitespace-nowrap">
              {sentCount} / {totalCount} envoyé{totalCount > 1 ? 's' : ''}
            </span>
            <div className="flex-1 h-2 bg-[#E2B36A]/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#25D366] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-[#B87333]/70 whitespace-nowrap">{pct}%</span>
          </div>

          {/* Liste des destinataires */}
          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {recipients.map(rec => (
              <RecipientRow
                key={rec.id}
                rec={rec}
                title={title}
                content={content}
                onSent={handleSent}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-4 pt-3 border-t border-[#E2B36A]/20">
        <button
          onClick={onClose}
          className="w-full text-sm bg-[#B87333] hover:bg-[#5A3318] text-white py-2.5 rounded-lg transition-colors font-semibold"
        >
          Terminer
        </button>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AnnouncementManager({ announcement, editMode, members }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep]     = useState<Step>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  // Champs du formulaire
  const [form, setForm] = useState({
    title:   announcement?.title   ?? '',
    content: announcement?.content ?? '',
    pinned:  announcement?.pinned  ?? false,
  })

  // Section WhatsApp
  const [sendWA, setSendWA]           = useState(false)
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('all')
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set())

  // Panneau de notifications
  const [notifyRecipients, setNotifyRecipients] = useState<RecipientWithProfile[] | null>(null)
  const [notifyLoading, setNotifyLoading]       = useState(false)
  const [savedTitle, setSavedTitle]   = useState(announcement?.title   ?? '')
  const [savedContent, setSavedContent] = useState(announcement?.content ?? '')
  const [savedId, setSavedId]         = useState<string | null>(announcement?.id ?? null)

  // Stats pour le bouton "Notifications"
  const existingRecips = announcement?.announcement_recipients ?? []
  const totalRecipients = existingRecips.length
  const sentRecipients  = existingRecips.filter(r => r.status === 'sent').length

  function setField(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // Calcul des destinataires selon le mode
  function getSelectedMembers(): MemberOption[] {
    switch (recipientMode) {
      case 'all':     return members
      case 'leaders': return members.filter(m => m.role === 'admin' || m.role === 'leader')
      case 'members': return members.filter(m => m.role === 'member')
      case 'manual':  return members.filter(m => manualSelected.has(m.id))
    }
  }

  function toggleManual(id: string) {
    setManualSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function loadNotifyRecipients(annId: string) {
    setNotifyLoading(true)
    const { data } = await supabase
      .from('announcement_recipients')
      .select('id, profile_id, status, sent_at, profiles(full_name, phone)')
      .eq('announcement_id', annId)
      .order('created_at')
    setNotifyRecipients((data as unknown as RecipientWithProfile[]) ?? [])
    setNotifyLoading(false)
  }

  // ── Soumission du formulaire ──────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title:      form.title.trim(),
      content:    form.content.trim(),
      pinned:     form.pinned,
      updated_at: new Date().toISOString(),
    }

    let annId: string

    if (announcement) {
      // Mise à jour
      const { error: err } = await supabase
        .from('announcements')
        .update(payload)
        .eq('id', announcement.id)
      if (err) { setError(err.message); setLoading(false); return }
      annId = announcement.id
    } else {
      // Création
      const { data, error: err } = await supabase
        .from('announcements')
        .insert(payload)
        .select('id')
        .single()
      if (err || !data) { setError(err?.message ?? 'Erreur inconnue'); setLoading(false); return }
      annId = data.id
    }

    setSavedId(annId)
    setSavedTitle(payload.title)
    setSavedContent(payload.content)

    if (sendWA) {
      const selected = getSelectedMembers()

      // Supprimer les anciens et réinsérer
      await supabase
        .from('announcement_recipients')
        .delete()
        .eq('announcement_id', annId)
        .eq('channel', 'whatsapp')

      if (selected.length > 0) {
        await supabase
          .from('announcement_recipients')
          .insert(
            selected.map(m => ({
              announcement_id: annId,
              profile_id:      m.id,
              channel:         'whatsapp',
              status:          'pending',
            }))
          )
      }

      await loadNotifyRecipients(annId)
      setLoading(false)
      setStep('notify')
      router.refresh()
    } else {
      setLoading(false)
      setStep('idle')
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!announcement || !confirm('Supprimer cette annonce ?')) return
    await supabase.from('announcements').delete().eq('id', announcement.id)
    router.refresh()
  }

  function openNotifyPanel() {
    setStep('notify')
    if (!notifyRecipients && announcement) {
      loadNotifyRecipients(announcement.id)
    }
  }

  function closeNotifyOrForm() {
    setStep('idle')
    router.refresh()
  }

  // ── Styles communs ────────────────────────────────────────────────────────

  const inputCls = [
    'w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2',
    'bg-[#FBF6EC] text-[#5A3318] text-sm',
    'focus:outline-none focus:ring-2 focus:ring-[#B87333]/40',
  ].join(' ')

  const RECIPIENT_MODES: { value: RecipientMode; label: string }[] = [
    { value: 'all',     label: `Tous (${members.length})` },
    { value: 'leaders', label: `Leaders (${members.filter(m => m.role === 'admin' || m.role === 'leader').length})` },
    { value: 'members', label: `Membres (${members.filter(m => m.role === 'member').length})` },
    { value: 'manual',  label: `Manuel (${manualSelected.size})` },
  ]

  // ── IDLE ──────────────────────────────────────────────────────────────────

  if (step === 'idle') {
    if (editMode) {
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={() => {
              setForm({ title: announcement?.title ?? '', content: announcement?.content ?? '', pinned: announcement?.pinned ?? false })
              setSendWA(false)
              setStep('form')
            }}
            className="text-xs border border-[#B87333]/40 text-[#B87333] px-2.5 py-1 rounded-lg hover:bg-[#B87333]/10 transition-colors"
          >
            Modifier
          </button>

          {totalRecipients > 0 && (
            <button
              onClick={openNotifyPanel}
              className="flex items-center gap-1 text-xs border border-[#25D366]/50 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors"
            >
              <WAIcon size={11} />
              <span>{sentRecipients}/{totalRecipients}</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="text-xs border border-red-300 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => setStep('form')}
        className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
      >
        + Nouvelle annonce
      </button>
    )
  }

  // ── NOTIFY ────────────────────────────────────────────────────────────────

  if (step === 'notify') {
    if (notifyLoading) {
      return (
        <div className="bg-white/80 border border-[#E2B36A]/40 rounded-xl p-5 shadow mb-4 text-center">
          <p className="text-[#B87333]/60 text-sm animate-pulse">Chargement des destinataires…</p>
        </div>
      )
    }
    return (
      <NotifyPanel
        title={savedTitle}
        content={savedContent}
        announcementId={savedId ?? ''}
        initialRecipients={notifyRecipients}
        onClose={closeNotifyOrForm}
      />
    )
  }

  // ── FORM ──────────────────────────────────────────────────────────────────

  const selectedMembers  = getSelectedMembers()
  const withPhone        = selectedMembers.filter(m => cleanHaitianPhone(m.phone ?? '') !== null)
  const withoutPhone     = selectedMembers.filter(m => cleanHaitianPhone(m.phone ?? '') === null)

  return (
    <div className="bg-white/80 border border-[#E2B36A]/60 rounded-xl p-4 sm:p-5 shadow mb-4">
      {/* Entête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel font-bold text-[#5A3318] text-sm sm:text-base">
          {announcement ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
        </h3>
        <button onClick={closeNotifyOrForm} className="text-[#B87333] hover:text-[#5A3318] text-xl leading-none">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Titre */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Titre *</label>
          <input
            className={inputCls}
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="Ex: Répétition annulée samedi"
            required
          />
        </div>

        {/* Contenu */}
        <div>
          <label className="block text-xs font-semibold text-[#5A3318] mb-1">Contenu *</label>
          <textarea
            className={`${inputCls} h-28 resize-y`}
            value={form.content}
            onChange={e => setField('content', e.target.value)}
            placeholder="Détails de l'annonce…"
            required
          />
        </div>

        {/* Épingler */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={e => setField('pinned', e.target.checked)}
            className="accent-[#9C3D6E]"
          />
          <span className="text-[#5A3318]">📌 Épingler cette annonce</span>
        </label>

        {/* ── Section WhatsApp ─────────────────────────────────────────── */}
        <div className="border-t border-[#E2B36A]/30 pt-4 space-y-3">

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={sendWA}
              onChange={e => setSendWA(e.target.checked)}
              className="accent-[#25D366]"
            />
            <span className="text-[#5A3318] font-semibold flex items-center gap-1.5">
              <WAIcon size={14} />
              Préparer notification WhatsApp
            </span>
          </label>

          {sendWA && (
            <div className="space-y-3 pl-0.5">

              {/* Mode selector */}
              <div>
                <p className="text-xs font-semibold text-[#5A3318] mb-2">Destinataires</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {RECIPIENT_MODES.map(mode => (
                    <label
                      key={mode.value}
                      className={[
                        'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs',
                        recipientMode === mode.value
                          ? 'border-[#B87333] bg-[#B87333]/10 text-[#5A3318] font-semibold'
                          : 'border-[#E2B36A]/40 hover:border-[#B87333]/40 text-[#5A3318]',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="recipientMode"
                        value={mode.value}
                        checked={recipientMode === mode.value}
                        onChange={() => setRecipientMode(mode.value)}
                        className="accent-[#B87333] flex-shrink-0"
                      />
                      {mode.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Liste de sélection manuelle */}
              {recipientMode === 'manual' && (
                <div className="border border-[#E2B36A]/40 rounded-xl overflow-hidden">
                  <div className="bg-[#FBF6EC] px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5A3318]">Choisir les membres</span>
                    <span className="text-xs text-[#B87333]">{manualSelected.size} sélectionné(s)</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-[#E2B36A]/20">
                    {members.map(m => {
                      const hasPhone = !!cleanHaitianPhone(m.phone ?? '')
                      return (
                        <label
                          key={m.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#E2B36A]/10 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={manualSelected.has(m.id)}
                            onChange={() => toggleManual(m.id)}
                            className="accent-[#B87333] flex-shrink-0"
                          />
                          {/* Avatar */}
                          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-[#E2B36A]/30 flex items-center justify-center text-[10px] font-bold text-[#B87333]">
                            {m.avatar_url
                              ? <img src={`${m.avatar_url}?t=1`} alt="" className="w-full h-full object-cover" />
                              : m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#5A3318] truncate">{m.full_name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-[#B87333]/70">
                              <span>{ROLE_LABELS[m.role]}</span>
                              {hasPhone
                                ? <span className="text-green-600">📱 {m.phone}</span>
                                : <span className="text-red-400 italic">Pas de numéro</span>
                              }
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Résumé */}
              {selectedMembers.length > 0 && (
                <div className="bg-[#E2B36A]/10 rounded-xl px-3 py-2.5 text-xs text-[#5A3318] space-y-0.5">
                  <p>
                    <span className="font-semibold">{selectedMembers.length}</span> destinataire{selectedMembers.length > 1 ? 's' : ''} sélectionné{selectedMembers.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[#B87333]/70">
                    <span className="text-green-600 font-semibold">{withPhone.length}</span> avec numéro WhatsApp
                    {withoutPhone.length > 0 && (
                      <span className="ml-2 text-red-400">· {withoutPhone.length} sans numéro</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Boutons */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#B87333] hover:bg-[#5A3318] text-white text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 font-semibold"
          >
            {loading
              ? 'Enregistrement…'
              : sendWA
                ? '💾 Enregistrer et préparer WA'
                : '💾 Enregistrer'
            }
          </button>
          <button
            type="button"
            onClick={closeNotifyOrForm}
            className="border border-[#E2B36A] text-[#B87333] text-sm px-3 py-2.5 rounded-lg hover:bg-[#E2B36A]/20 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
