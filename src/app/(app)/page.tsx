import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Rehearsal, Announcement } from '@/lib/database.types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: rehearsals } = await supabase
    .from('rehearsals')
    .select('*, rehearsal_songs(*, songs(title))')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(1)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const nextRehearsal = rehearsals?.[0] as (Rehearsal & { rehearsal_songs: { songs: { title: string } }[] }) | undefined

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Tableau de bord</h1>
        <p className="font-cormorant italic text-[#B87333] text-lg">Bienvenue dans l&apos;espace du Chœur de Louange</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Prochaine répétition */}
        <div className="bg-white/60 border border-[#E2B36A]/50 rounded-xl p-5 shadow-sm">
          <h2 className="font-cinzel text-[#5A3318] font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-[#B87333]">🎵</span> Prochaine répétition
          </h2>
          {nextRehearsal ? (
            <div className="space-y-2">
              <p className="text-[#5A3318] font-semibold capitalize">{formatDate(nextRehearsal.starts_at)}</p>
              <p className="text-[#B87333] text-sm">à {formatTime(nextRehearsal.starts_at)}</p>
              {nextRehearsal.location && (
                <p className="text-sm text-[#5A3318]">📍 {nextRehearsal.location}</p>
              )}
              {nextRehearsal.rehearsal_songs?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-1">Chants prévus</p>
                  <ul className="space-y-0.5">
                    {nextRehearsal.rehearsal_songs.map((rs: { songs: { title: string } }, i: number) => (
                      <li key={i} className="text-sm text-[#5A3318]">• {rs.songs?.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              {nextRehearsal.notes && (
                <p className="text-xs text-[#7A4A20] italic mt-2">{nextRehearsal.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#B87333]/70 italic">Aucune répétition programmée.</p>
          )}
          <Link href="/planning" className="mt-4 inline-block text-xs text-[#B87333] hover:underline">
            Voir tout le planning →
          </Link>
        </div>

        {/* Annonces récentes */}
        <div className="bg-white/60 border border-[#E2B36A]/50 rounded-xl p-5 shadow-sm">
          <h2 className="font-cinzel text-[#5A3318] font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-[#B87333]">📢</span> Annonces
          </h2>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann: Announcement) => (
                <div key={ann.id} className={`border-l-2 pl-3 ${ann.pinned ? 'border-[#9C3D6E]' : 'border-[#E2B36A]'}`}>
                  <p className="font-semibold text-[#5A3318] text-sm flex items-center gap-1">
                    {ann.pinned && <span className="text-[#9C3D6E] text-xs">📌</span>}
                    {ann.title}
                  </p>
                  <p className="text-xs text-[#7A4A20] line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#B87333]/70 italic">Aucune annonce.</p>
          )}
          <Link href="/annonces" className="mt-4 inline-block text-xs text-[#B87333] hover:underline">
            Toutes les annonces →
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/chants', label: 'Chants', icon: '🎶' },
          { href: '/planning', label: 'Planning', icon: '📅' },
          { href: '/annonces', label: 'Annonces', icon: '📢' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 bg-[#B87333]/10 hover:bg-[#B87333]/20 border border-[#B87333]/30 rounded-xl p-4 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-cinzel text-[#5A3318] font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
