import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ChantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single();

  let query = supabase
    .from('songs')
    .select('id, title, key_signature, tempo, author')
    .order('title');

  if (q) {
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data: songs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-[#5A3318]">Chants</h2>
          <div className="h-0.5 bg-[#E2B36A] w-16 mt-1" />
        </div>
        {profile?.role === 'admin' && (
          <Link
            href="/chants/nouveau"
            className="bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Nouveau chant
          </Link>
        )}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par titre ou paroles…"
          className="flex-1 border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] text-sm focus:outline-none focus:ring-2 focus:ring-[#B87333]/50"
        />
        <button
          type="submit"
          className="bg-[#5A3318] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#3d2010] transition-colors font-cinzel"
        >
          Rechercher
        </button>
        {q && (
          <Link href="/chants" className="text-sm text-[#B87333] hover:underline self-center">
            Effacer
          </Link>
        )}
      </form>

      {/* List */}
      {songs && songs.length > 0 ? (
        <div className="grid gap-2">
          {songs.map(song => (
            <Link
              key={song.id}
              href={`/chants/${song.id}`}
              className="group bg-white/50 hover:bg-white/80 border border-[#E2B36A]/40 rounded-xl px-5 py-3.5 shadow-sm transition-colors flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-semibold text-[#5A3318] group-hover:text-[#B87333] transition-colors truncate">
                  {song.title}
                </p>
                <p className="text-xs text-[#B87333]/70 mt-0.5">
                  {[song.key_signature, song.tempo ? `${song.tempo} BPM` : null, song.author]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-[#E2B36A] text-lg group-hover:translate-x-1 transition-transform">›</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white/30 border border-[#E2B36A]/30 rounded-xl p-8 text-center text-sm text-[#5A3318]/60">
          {q ? `Aucun résultat pour « ${q} »` : 'Aucun chant enregistré.'}
        </div>
      )}
    </div>
  );
}
