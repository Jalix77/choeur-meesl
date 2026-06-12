import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Rehearsal, Announcement, Profile } from '@/lib/database.types'
import {
  isBirthdayToday, isBirthdayThisWeek, isBirthdayThisMonth,
  formatBirthdayDisplay, daysUntilBirthday,
} from '@/lib/database.types'

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

  const [rehearsalsRes, announcementsRes, profilesRes] = await Promise.all([
    supabase
      .from('rehearsals')
      .select('*, rehearsal_songs(*, songs(title))')
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(1),
    supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('profiles')
      .select('id, full_name, date_naissance')
      .eq('active', true)
      .not('date_naissance', 'is', null),
  ])

  const nextRehearsal = rehearsalsRes.data?.[0] as (Rehearsal & { rehearsal_songs: { songs: { title: string } }[] }) | undefined
  const announcements = announcementsRes.data
  const allProfiles   = (profilesRes.data ?? []) as Pick<Profile, 'id' | 'full_name' | 'date_naissance'>[]

  const todayBirthdays   = allProfiles.filter(p => p.date_naissance && isBirthdayToday(p.date_naissance))
  const weekBirthdays    = allProfiles.filter(p => p.date_naissance && isBirthdayThisWeek(p.date_naissance) && !isBirthdayToday(p.date_naissance))
  const monthBirthdays   = allProfiles.filter(p => p.date_naissance && isBirthdayThisMonth(p.date_naissance))

  // Sort week by days until
  weekBirthdays.sort((a, b) => daysUntilBirthday(a.date_naissance!) - daysUntilBirthday(b.date_naissance!))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#5A3318]">Tableau de bord</h1>
        <p className="font-cormorant italic text-[#B87333] text-lg">Bienvenue dans l&apos;espace du Chœur de Louange</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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

        {/* 🎂 Widget anniversaires */}
        <div className="sm:col-span-2 bg-gradient-to-br from-[#FBF6EC] to-white border border-[#E2B36A]/50 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel text-[#5A3318] font-bold text-lg flex items-center gap-2">
              🎂 Anniversaires
            </h2>
            <Link href="/anniversaires" className="text-xs text-[#B87333] hover:underline">
              Voir tous →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Aujourd'hui */}
            <div className="bg-white border border-[#E2B36A]/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-2">Aujourd&apos;hui</p>
              {todayBirthdays.length > 0 ? (
                <ul className="space-y-2">
                  {todayBirthdays.map(p => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#B87333]/20 flex items-center justify-center text-xs font-bold text-[#5A3318] flex-shrink-0">
                        {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#5A3318] leading-tight">{p.full_name}</p>
                        <Link href={`/anniversaires`} className="text-xs text-[#B87333] hover:underline">Voir carte</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#B87333]/50 italic">Aucun anniversaire</p>
              )}
            </div>

            {/* Cette semaine */}
            <div className="bg-white border border-[#E2B36A]/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-2">Cette semaine</p>
              {weekBirthdays.length > 0 ? (
                <ul className="space-y-2">
                  {weekBirthdays.slice(0, 3).map(p => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#E2B36A]/30 flex items-center justify-center text-xs font-bold text-[#5A3318] flex-shrink-0">
                        {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#5A3318] leading-tight">{p.full_name}</p>
                        <p className="text-xs text-[#B87333]/70">
                          dans {daysUntilBirthday(p.date_naissance!)} jour{daysUntilBirthday(p.date_naissance!) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                  {weekBirthdays.length > 3 && (
                    <li className="text-xs text-[#B87333]/60 italic">+{weekBirthdays.length - 3} autres</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-[#B87333]/50 italic">Aucun cette semaine</p>
              )}
            </div>

            {/* Ce mois */}
            <div className="bg-white border border-[#E2B36A]/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#B87333] uppercase tracking-wide mb-2">Ce mois-ci</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-cinzel font-bold text-[#B87333]">{monthBirthdays.length}</span>
                <div>
                  <p className="text-sm text-[#5A3318]">anniversaire{monthBirthdays.length !== 1 ? 's' : ''}</p>
                  <Link href="/anniversaires" className="text-xs text-[#B87333] hover:underline">
                    Voir la liste →
                  </Link>
                </div>
              </div>
              {monthBirthdays.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {monthBirthdays.slice(0, 5).map(p => (
                    <span key={p.id}
                      className="bg-[#E2B36A]/20 text-[#5A3318] text-xs px-2 py-0.5 rounded-full">
                      {p.full_name.split(' ')[0]}
                    </span>
                  ))}
                  {monthBirthdays.length > 5 && (
                    <span className="text-xs text-[#B87333]/60">+{monthBirthdays.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/chants',       label: 'Chants',       icon: '🎶' },
          { href: '/planning',     label: 'Planning',     icon: '📅' },
          { href: '/annonces',     label: 'Annonces',     icon: '📢' },
          { href: '/anniversaires', label: 'Anniversaires', icon: '🎂' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 bg-[#B87333]/10 hover:bg-[#B87333]/20 border border-[#B87333]/30 rounded-xl p-4 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-cinzel text-[#5A3318] font-semibold text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
