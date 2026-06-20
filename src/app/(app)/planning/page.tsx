import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RehearsalManager from '@/components/RehearsalManager'
import NotifyButton from '@/components/NotifyButton'
import type { Profile, RehearsalChorister } from '@/lib/database.types'
import { canManageContent } from '@/lib/roles'
import { formatRehearsalDate, formatRehearsalTime } from '@/lib/rehearsal-time'
import { buildWhatsAppMessage, cleanHaitianPhone } from '@/lib/whatsapp'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://choeur-meesl.vercel.app'

function whatsappLink(phone: string, name: string, rehearsalDate: string, location: string | null) {
  const cleaned = cleanHaitianPhone(phone)
  if (!cleaned) return '#'
  const text = buildWhatsAppMessage({
    name,
    vocal_role: 'Service',
    starts_at: rehearsalDate,
    location,
    notes: null,
    songs: [],
  })
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`
}

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = canManageContent((profile as Pick<Profile, 'role'> | null)?.role)

  // Main rehearsals query — no date filter, show all
  const { data: rehearsals, error: rehearsalsError } = await supabase
    .from('rehearsals')
    .select('*, rehearsal_songs(*, songs(id, title))')
    .order('starts_at', { ascending: true })

  console.log('planning rehearsals', rehearsals)
  console.log('planning error', rehearsalsError)

  // Songs for the form
  const { data: allSongs } = await supabase.from('songs').select('id, title').order('title')

  // Active choristers for the form (phone needed for WhatsApp links)
  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('active', true)
    .order('full_name')

  // rehearsal_choristers — gracefully handle missing table
  const rehearsalIds = (rehearsals ?? []).map((r: { id: string }) => r.id)
  let allChoristers: RehearsalChorister[] = []
  if (rehearsalIds.length > 0) {
    const { data, error: rcError } = await supabase
      .from('rehearsal_choristers')
      .select('id, rehearsal_id, profile_id, vocal_role, notified_email, notified_whatsapp, created_at, profiles(id, full_name, phone)')
      .in('rehearsal_id', rehearsalIds)
    console.log('planning choristers error', rcError)
    allChoristers = (data ?? []) as unknown as RehearsalChorister[]
  }

  const choristers = (activeProfiles ?? []) as { id: string; full_name: string; phone?: string | null }[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#5A3318]">Planning</h1>
      </div>

      {/* Show query error if any */}
      {rehearsalsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Erreur de chargement :</strong> {rehearsalsError.message}
        </div>
      )}

      {isAdmin && <RehearsalManager songs={allSongs ?? []} choristers={choristers} />}

      <div className="space-y-4">
        {rehearsals && rehearsals.length > 0 ? (rehearsals as Array<{
          id: string; starts_at: string; location: string | null; notes: string | null;
          title?: string | null; notify_selected?: boolean;
          rehearsal_songs: { order_index: number; songs: { id: string; title: string } }[]
        }>).map((rehearsal) => {
          const isPast = new Date(rehearsal.starts_at) < new Date()
          const songList = (rehearsal.rehearsal_songs ?? [])
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
          const rehearsalChoristers = allChoristers.filter(rc => rc.rehearsal_id === rehearsal.id) as
            (RehearsalChorister & { profiles?: { id: string; full_name: string; phone?: string | null } })[]

          return (
            <div key={rehearsal.id} className={`bg-white/60 border rounded-xl p-4 sm:p-5 shadow-sm ${isPast ? 'opacity-60 border-[#E2B36A]/20' : 'border-[#E2B36A]/50'}`}>
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div>
                  {rehearsal.title && (
                    <p className="font-cinzel text-xs font-semibold text-[#9C3D6E] uppercase tracking-wider mb-0.5">{rehearsal.title}</p>
                  )}
                  <p className="font-cinzel font-bold text-[#5A3318] capitalize">{formatRehearsalDate(rehearsal.starts_at)}</p>
                  <p className="text-[#B87333] text-sm">à {formatRehearsalTime(rehearsal.starts_at)}</p>
                  {rehearsal.location && <p className="text-sm text-[#5A3318] mt-1">📍 {rehearsal.location}</p>}
                </div>
                {isAdmin && (
                  <RehearsalManager
                    rehearsal={rehearsal}
                    songs={allSongs ?? []}
                    choristers={choristers}
                    initialChoristers={rehearsalChoristers}
                    editMode
                  />
                )}
              </div>

              {rehearsal.notes && <p className="text-xs text-[#7A4A20] italic mt-2">{rehearsal.notes}</p>}

              {songList.length > 0 && (
                <div className="mt-3 border-t border-[#E2B36A]/30 pt-3">
                  <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-1">Chants</p>
                  <ol className="space-y-0.5">
                    {songList.map((rs: { songs: { id: string; title: string } }, i: number) => (
                      <li key={i} className="text-sm text-[#5A3318]">
                        {i + 1}. <Link href={`/chants/${rs.songs?.id}`} className="hover:underline hover:text-[#B87333]">{rs.songs?.title}</Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {isAdmin && rehearsalChoristers.length > 0 && (
                <div className="mt-3">
                  <NotifyButton
                    rehearsalId={rehearsal.id}
                    choristerCount={rehearsalChoristers.length}
                  />
                </div>
              )}

              {rehearsalChoristers.length > 0 && (
                <div className="mt-3 border-t border-[#E2B36A]/30 pt-3">
                  <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-2">
                    Choristes en service ({rehearsalChoristers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rehearsalChoristers.map((rc) => {
                      const p = rc.profiles
                      const phone = p?.phone
                      return (
                        <div key={rc.id} className="flex items-center gap-1.5 bg-[#FBF6EC] border border-[#E2B36A]/40 rounded-lg px-2.5 py-1.5">
                          <div>
                            <span className="text-xs font-semibold text-[#5A3318]">{p?.full_name ?? rc.profile_id}</span>
                            <span className="text-xs text-[#B87333]/70 ml-1.5">{rc.vocal_role}</span>
                            {rc.notified_email && (
                              <span className="ml-1.5 text-xs text-green-600" title="Email envoyé">✉️</span>
                            )}
                          </div>
                          {phone && (
                            <a
                              href={whatsappLink(phone, p?.full_name ?? '', rehearsal.starts_at, rehearsal.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 ml-1"
                              title={`WhatsApp ${p?.full_name}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        }) : (
          <p className="text-center py-10 text-[#B87333]/70 italic">
            {rehearsalsError ? 'Impossible de charger les répétitions.' : 'Aucune répétition planifiée.'}
          </p>
        )}
      </div>
    </div>
  )
}
