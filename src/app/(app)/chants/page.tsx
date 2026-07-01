import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Profile } from '@/lib/database.types'
import { canManageContent } from '@/lib/roles'
import SongsList from '@/components/SongsList'

interface SearchParams { q?: string }

export default async function SongsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canEdit = canManageContent((profile as Pick<Profile, 'role'> | null)?.role)

  let query = supabase.from('songs').select('*').order('title')
  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
  const { data: songs } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#5A3318]">Chants</h1>
        {canEdit && (
          <Link href="/chants/nouveau"
            className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
            + Nouveau
          </Link>
        )}
      </div>

      {/* Search */}
      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par titre ou paroles…"
          className="flex-1 border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
        />
        <button type="submit"
          className="bg-[#B87333] text-white px-4 py-2 rounded-lg hover:bg-[#5A3318] transition-colors text-sm">
          Rechercher
        </button>
        {q && (
          <Link href="/chants"
            className="border border-[#E2B36A]/60 text-[#B87333] px-4 py-2 rounded-lg hover:bg-[#E2B36A]/20 text-sm">
            Effacer
          </Link>
        )}
      </form>

      <SongsList songs={songs ?? []} canEdit={canEdit} searchQuery={q} />
    </div>
  )
}
