/**
 * Public, read-only "programmation du culte" page — no login required.
 * Accessible via a token shared with external (non-member) invitees
 * by email / WhatsApp. Uses the service-role client (never exposed to
 * the browser) to look up the rehearsal by public_token and enforce
 * public_access_enabled = true before returning anything. Only the
 * fields needed for display are selected — no phone numbers, emails,
 * member roster, or admin controls.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import { formatRehearsalDate, formatRehearsalTime } from '@/lib/rehearsal-time'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF6EC]">
      <header className="bg-[#5A3318] px-4 py-3 flex items-center justify-center gap-3">
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image src="/logo-meesl.png" alt="MEESL" fill className="object-contain" sizes="32px" />
        </div>
        <span className="font-cinzel text-white text-sm font-bold tracking-wide">
          Chœur de Louange MEESL
        </span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center text-xs text-[#B87333]/60 pb-8 px-4">
        <p>Mission Église Évangélique Sel et Lumière · 4, Delmas 48 · Port-au-Prince, Haïti</p>
      </footer>
    </div>
  )
}

export default async function PublicServiceProgramPage({ params }: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: rehearsal } = await admin
    .from('rehearsals')
    .select('id, title, starts_at, location, public_access_enabled')
    .eq('public_token', token)
    .single()

  if (!rehearsal || !rehearsal.public_access_enabled) {
    return (
      <Shell>
        <div className="bg-white/70 border border-[#E2B36A]/40 rounded-xl p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <p className="font-cinzel text-lg font-bold text-[#5A3318]">
            Cette programmation n&apos;est pas disponible.
          </p>
          <p className="text-sm text-[#7A4A20]/80 mt-2">
            Le lien est peut-être expiré ou la programmation n&apos;a pas été partagée publiquement.
          </p>
        </div>
      </Shell>
    )
  }

  const { data: rawSongs } = await admin
    .from('rehearsal_songs')
    .select('order_index, songs(title)')
    .eq('rehearsal_id', rehearsal.id)
    .order('order_index')
  const songs = ((rawSongs ?? []) as { order_index: number; songs: { title: string } | null }[])
    .map(rs => ({ title: rs.songs?.title ?? '', order_index: rs.order_index }))
    .filter(s => s.title)

  const { data: rawItems } = await admin
    .from('service_program_items')
    .select('order_index, label, note, profile_id, external_name, profiles(full_name)')
    .eq('rehearsal_id', rehearsal.id)
    .order('order_index')
  const items = ((rawItems ?? []) as {
    order_index: number; label: string; note: string | null
    profile_id: string | null; external_name: string | null
    profiles: { full_name: string } | null
  }[]).map(it => ({
    label: it.label,
    note: it.note,
    assignee_name: it.profile_id ? (it.profiles?.full_name ?? null) : (it.external_name?.trim() || null),
  }))

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center">
          {rehearsal.title && (
            <p className="font-cinzel text-xs font-semibold text-[#9C3D6E] uppercase tracking-wider mb-1">{rehearsal.title}</p>
          )}
          <h1 className="font-cinzel text-xl font-bold text-[#5A3318] capitalize">
            {formatRehearsalDate(rehearsal.starts_at)}
          </h1>
          <p className="text-[#B87333] text-sm font-semibold mt-1">à {formatRehearsalTime(rehearsal.starts_at)}</p>
          {rehearsal.location && <p className="text-sm text-[#5A3318] mt-1">📍 {rehearsal.location}</p>}
        </div>

        {/* Programmation du culte */}
        <div className="bg-white/70 border border-[#E2B36A]/40 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#5A3318] px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#E2B36A]">🗓</span>
            <h2 className="font-cinzel text-white text-sm font-semibold tracking-wide">Programmation du culte</h2>
          </div>
          <div className="p-4">
            {items.length > 0 ? (
              <ol className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-[#5A3318]">
                    <span className="text-[#B87333]/60 font-mono text-xs w-5 flex-shrink-0 text-right">{i + 1}.</span>
                    <span className="font-medium break-words">{item.label}</span>
                    <span className="text-[#B87333]/40">—</span>
                    <span className={item.assignee_name ? 'break-words' : 'italic text-[#B87333]/50'}>
                      {item.assignee_name ?? 'Non assigné'}
                    </span>
                    {item.note && (
                      <span className="text-xs text-[#7A4A20] italic w-full pl-7 break-words">{item.note}</span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#B87333]/50 italic">Aucune programmation enregistrée pour ce culte.</p>
            )}
          </div>
        </div>

        {/* Chants au programme */}
        <div className="bg-white/70 border border-[#E2B36A]/40 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#5A3318] px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#E2B36A]">🎵</span>
            <h2 className="font-cinzel text-white text-sm font-semibold tracking-wide">Chants au programme</h2>
          </div>
          <div className="p-4">
            {songs.length > 0 ? (
              <ol className="space-y-1.5">
                {songs.map((s, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm text-[#5A3318]">
                    <span className="text-[#B87333]/60 font-mono text-xs w-5 flex-shrink-0 text-right">{i + 1}.</span>
                    <span className="break-words">{s.title}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#B87333]/50 italic">Aucun chant sélectionné pour ce culte.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
