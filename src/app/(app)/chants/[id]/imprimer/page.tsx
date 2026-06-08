import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import SongSheet from '@/components/SongSheet';
import PrintButton from '@/components/PrintButton';
import type { Notation } from '@/lib/chords';

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const supabase = await createClient();

  const { data: song } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (!song) notFound();

  const defaultTranspose = t ? parseInt(t, 10) || 0 : 0;

  return (
    <div className="min-h-screen bg-white text-[#5A3318] px-[12mm] py-[12mm]">
      {/* Print button */}
      <div className="no-print mb-6 flex gap-3">
        <PrintButton />
        <a href={`/chants/${id}`} className="text-sm text-[#B87333] self-center hover:underline">
          ← Retour
        </a>
      </div>

      {/* MEESL Header */}
      <header className="flex items-center gap-3 pb-3 border-b-2 border-[#E2B36A] mb-4">
        <Image src="/logo-meesl.png" alt="Logo MEESL" width={56} height={56} className="object-contain" />
        <div>
          <p className="font-cinzel text-sm font-bold uppercase tracking-widest text-[#5A3318]">
            Mission Église Évangélique Sel et Lumière
          </p>
          <p className="font-cormorant italic text-[#B87333] text-sm">
            Prêcher, instruire et desservir la communauté !
          </p>
          <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#B87333]/70">
            Chœur de Louange
          </p>
        </div>
      </header>

      {/* Song title & meta */}
      <div className="mb-4">
        <h1 className="font-cinzel text-xl font-bold">{song.title}</h1>
        <p className="text-xs text-[#B87333] mt-0.5">
          {[
            song.key_signature ? `Tonalité : ${song.key_signature}` : null,
            song.tempo ? `Tempo : ${song.tempo} BPM` : null,
            song.time_signature ? `Mesure : ${song.time_signature}` : null,
            song.author ? `Source : ${song.author}` : null,
          ].filter(Boolean).join('  ·  ')}
        </p>
      </div>

      {/* Song content */}
      <SongSheet
        body={song.body}
        defaultNotation={song.notation as Notation}
        defaultTranspose={defaultTranspose}
        printMode
      />

      {/* MEESL Footer */}
      <footer className="mt-8 pt-3 border-t border-[#E2B36A]/50 text-[10px] text-[#B87333]/70 flex flex-wrap gap-x-3 font-cormorant">
        <span>4, Delmas 48 · Port-au-Prince, Haïti</span>
        <span>·</span>
        <span>meesl1410@gmail.com</span>
        <span>·</span>
        <span>(509) 37 97 1717</span>
        <span>·</span>
        <span>(509) 33 16 6621</span>
      </footer>
    </div>
  );
}
