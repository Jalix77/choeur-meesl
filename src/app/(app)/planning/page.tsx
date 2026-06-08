import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RehearsalManager from '@/components/RehearsalManager'
import type { Profile } from '@/lib/database.types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = (profile as Pick<Profile, 'role'> | null)?.role === 'admin'

  const { data: rehearsals } = await supabase
    .from('rehearsals')
    .select('*, rehearsal_songs(order_index, songs(id, title))')
    .order('starts_at', { ascending: true })

  const { data: allSongs } = await supabase.from('songs').select('id, title').order('title')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Planning des répétitions</h1>
      </div>

      {isAdmin && <RehearsalManager songs={allSongs ?? []} />}

      <div className="space-y-4">
        {rehearsals && rehearsals.length > 0 ? (rehearsals as Array<{
          id: string; starts_at: string; location: string | null; notes: string | null;
          rehearsal_songs: { order_index: number; songs: { id: string; title: string } }[]
        }>).map((rehearsal) => {
          const isPast = new Date(rehearsal.starts_at) < new Date()
          const songList = (rehearsal.rehearsal_songs ?? [])
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
          return (
            <div key={rehearsal.id} className={`bg-white/60 border rounded-xl p-5 shadow-sm ${isPast ? 'opacity-60 border-[#E2B36A]/20' : 'border-[#E2B36A]/50'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-cinzel font-bold text-[#5A3318] capitalize">{formatDate(rehearsal.starts_at)}</p>
                  <p className="text-[#B87333] text-sm">à {formatTime(rehearsal.starts_at)}</p>
                  {rehearsal.location && <p className="text-sm text-[#5A3318] mt-1">📍 {rehearsal.location}</p>}
                </div>
                {isAdmin && (
                  <RehearsalManager rehearsal={rehearsal} songs={allSongs ?? []} editMode />
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
            </div>
          )
        }) : (
          <p className="text-center py-10 text-[#B87333]/70 italic">Aucune répétition planifiée.</p>
        )}
      </div>
    </div>
  )
}
