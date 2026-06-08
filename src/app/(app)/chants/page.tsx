import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Song, Profile } from '@/lib/database.types'

interface SearchParams { q?: string }

export default async function SongsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = (profile as Pick<Profile, 'role'> | null)?.role === 'admin'

  let query = supabase.from('songs').select('*').order('title')
  if (q) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
  }
  const { data: songs } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Chants</h1>
        {isAdmin && (
          <Link href="/chants/nouveau" className="bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors">
            + Nouveau chant
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
        <button type="submit" className="bg-[#B87333] text-white px-4 py-2 rounded-lg hover:bg-[#5A3318] transition-colors text-sm">
          Rechercher
        </button>
        {q && (
          <Link href="/chants" className="border border-[#E2B36A]/60 text-[#B87333] px-4 py-2 rounded-lg hover:bg-[#E2B36A]/20 text-sm">
            Effacer
          </Link>
        )}
      </form>

      {/* Song list */}
      {songs && songs.length > 0 ? (
        <div className="grid gap-2">
          {songs.map((song: Song) => (
            <div key={song.id} className="flex items-center justify-between bg-white/60 border border-[#E2B36A]/40 rounded-xl px-4 py-3 hover:border-[#B87333]/50 transition-colors">
              <div className="flex-1 min-w-0">
                <Link href={`/chants/${song.id}`} className="font-semibold text-[#5A3318] hover:text-[#B87333] transition-colors">
                  {song.title}
                </Link>
                <div className="flex items-center gap-3 mt-0.5">
                  {song.key_signature && <span className="text-xs text-[#B87333]">Ton : {song.key_signature}</span>}
                  {song.tempo && <span className="text-xs text-[#7A4A20]">♩ {song.tempo} bpm</span>}
                  {song.author && <span className="text-xs text-[#7A4A20] truncate">{song.author}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Link href={`/chants/${song.id}`} className="text-xs text-[#B87333] hover:underline">Voir</Link>
                {isAdmin && (
                  <Link href={`/chants/${song.id}/modifier`} className="text-xs text-[#7A4A20] hover:underline">Modifier</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#B87333]/70 italic">
          {q ? `Aucun résultat pour « ${q} »` : 'Aucun chant pour l\'instant.'}
        </div>
      )}
    </div>
  )
}
