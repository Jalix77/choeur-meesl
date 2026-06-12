import { createClient } from '@/lib/supabase/server'
import type { Profile, AnnouncementWithRecipients } from '@/lib/database.types'
import AnnouncementManager, { type MemberOption } from '@/components/AnnouncementManager'
import { canManageContent } from '@/lib/roles'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function AnnouncesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = canManageContent((profile as Pick<Profile, 'role'> | null)?.role)

  // Annonces avec comptage recipients embarqué
  const { data: rawAnnouncements } = await supabase
    .from('announcements')
    .select('*, announcement_recipients(id, status)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const announcements = (rawAnnouncements ?? []) as AnnouncementWithRecipients[]

  // Membres actifs pour la sélection WA (admin/leader seulement)
  let members: MemberOption[] = []
  if (isAdmin) {
    const { data: membersData } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, avatar_url')
      .eq('active', true)
      .order('full_name')
    members = (membersData ?? []) as MemberOption[]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#5A3318]">Annonces</h1>
        {isAdmin && <AnnouncementManager members={members} />}
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? announcements.map((ann) => {
          const total = ann.announcement_recipients?.length ?? 0
          const sent  = ann.announcement_recipients?.filter(r => r.status === 'sent').length ?? 0

          return (
            <div
              key={ann.id}
              className={`bg-white/60 border rounded-xl p-4 sm:p-5 shadow-sm ${
                ann.pinned ? 'border-[#9C3D6E]/40' : 'border-[#E2B36A]/40'
              }`}
            >
              {/* En-tête carte */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-cinzel font-bold text-[#5A3318] flex items-center gap-2 text-sm sm:text-base">
                    {ann.pinned && <span className="text-[#9C3D6E] text-sm flex-shrink-0">📌</span>}
                    <span className="truncate">{ann.title}</span>
                  </h2>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-[#B87333]">{formatDate(ann.created_at)}</p>
                    {/* Badge WA */}
                    {total > 0 && (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        sent === total
                          ? 'bg-green-100 text-green-700'
                          : sent > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-[#E2B36A]/20 text-[#B87333]'
                      }`}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {sent}/{total}
                      </span>
                    )}
                  </div>
                </div>

                {/* Boutons admin */}
                {isAdmin && (
                  <AnnouncementManager
                    announcement={ann}
                    editMode
                    members={members}
                  />
                )}
              </div>

              {/* Contenu annonce */}
              <p className="text-sm text-[#5A3318] mt-3 whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </p>
            </div>
          )
        }) : (
          <p className="text-center py-10 text-[#B87333]/70 italic">Aucune annonce pour le moment.</p>
        )}
      </div>
    </div>
  )
}
