import { createClient } from '@/lib/supabase/server'
import type { Profile, Announcement } from '@/lib/database.types'
import AnnouncementManager from '@/components/AnnouncementManager'
import { canManageContent } from '@/lib/roles'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function AnnouncesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = canManageContent((profile as Pick<Profile, 'role'> | null)?.role)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Annonces</h1>
        {isAdmin && <AnnouncementManager />}
      </div>

      <div className="space-y-4">
        {announcements && announcements.length > 0 ? announcements.map((ann: Announcement) => (
          <div key={ann.id} className={`bg-white/60 border rounded-xl p-5 shadow-sm ${ann.pinned ? 'border-[#9C3D6E]/40' : 'border-[#E2B36A]/40'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="font-cinzel font-bold text-[#5A3318] flex items-center gap-2">
                  {ann.pinned && <span className="text-[#9C3D6E] text-sm">📌</span>}
                  {ann.title}
                </h2>
                <p className="text-xs text-[#B87333] mt-0.5">{formatDate(ann.created_at)}</p>
                <p className="text-sm text-[#5A3318] mt-2 whitespace-pre-wrap">{ann.content}</p>
              </div>
              {isAdmin && <AnnouncementManager announcement={ann} editMode />}
            </div>
          </div>
        )) : (
          <p className="text-center py-10 text-[#B87333]/70 italic">Aucune annonce pour le moment.</p>
        )}
      </div>
    </div>
  )
}
