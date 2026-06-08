import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface RehearsalRow {
  id: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  rehearsal_songs: Array<{ order_index: number; songs: { id: string; title: string } | null }>;
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const [{ data: rehearsalsRaw }, { data: announcementsRaw }] = await Promise.all([
    supabase
      .from('rehearsals')
      .select('id, starts_at, ends_at, location, notes, rehearsal_songs(order_index, songs(id, title))')
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(1),
    supabase
      .from('announcements')
      .select('id, title, content, pinned, created_at')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const rehearsals = rehearsalsRaw as RehearsalRow[] | null;
  const announcements = announcementsRaw as AnnouncementRow[] | null;
  const next = rehearsals?.[0];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318] mb-1">Tableau de bord</h2>
        <div className="h-0.5 bg-[#E2B36A] w-16" />
      </div>

      {/* Next rehearsal */}
      <section>
        <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#B87333] mb-3">
          Prochaine répétition
        </h3>
        {next ? (
          <div className="bg-white/50 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
            <p className="font-cinzel text-lg font-semibold text-[#5A3318] capitalize">
              {formatDate(next.starts_at)}
            </p>
            <p className="text-[#B87333] text-sm mt-0.5">
              {formatTime(next.starts_at)}
              {next.ends_at && ` – ${formatTime(next.ends_at)}`}
              {next.location && ` · ${next.location}`}
            </p>
            {next.notes && <p className="text-sm mt-2 text-[#5A3318]/80">{next.notes}</p>}
            {(next.rehearsal_songs as Array<{ order_index: number; songs: { id: string; title: string } | null }>)?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-widest text-[#B87333] font-cinzel mb-1">Chants</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  {(next.rehearsal_songs as Array<{ order_index: number; songs: { id: string; title: string } | null }>)
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((rs) => rs.songs && (
                      <li key={rs.songs.id} className="text-sm">
                        <Link href={`/chants/${rs.songs.id}`} className="hover:text-[#B87333] transition-colors">
                          {rs.songs.title}
                        </Link>
                      </li>
                    ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/30 border border-[#E2B36A]/30 rounded-xl p-5 text-sm text-[#5A3318]/60">
            Aucune répétition planifiée.
          </div>
        )}
      </section>

      {/* Announcements */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#B87333]">
            Annonces récentes
          </h3>
          <Link href="/annonces" className="text-xs text-[#B87333] hover:underline">
            Voir toutes →
          </Link>
        </div>
        {announcements && announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="bg-white/50 border border-[#E2B36A]/40 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-2">
                  {a.pinned && (
                    <span className="shrink-0 mt-0.5 text-xs bg-[#B87333]/20 text-[#B87333] font-cinzel px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Épinglé
                    </span>
                  )}
                  <div>
                    <p className="font-cinzel font-semibold text-[#5A3318] text-sm">{a.title}</p>
                    <p className="text-sm text-[#5A3318]/80 mt-1 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-[#B87333]/60 mt-2">
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/30 border border-[#E2B36A]/30 rounded-xl p-5 text-sm text-[#5A3318]/60">
            Aucune annonce.
          </div>
        )}
      </section>
    </div>
  );
}
