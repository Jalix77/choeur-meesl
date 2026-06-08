import Image from 'next/image';

interface SongHeaderProps {
  title: string;
  keySignature?: string | null;
  tempo?: number | null;
  timeSignature?: string | null;
  author?: string | null;
}

export default function SongHeader({ title, keySignature, tempo, timeSignature, author }: SongHeaderProps) {
  return (
    <div className="mb-6">
      {/* MEESL brand header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E2B36A]/50">
        <Image src="/logo-meesl.png" alt="Logo MEESL" width={48} height={48} className="object-contain" />
        <div>
          <p className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#5A3318]">
            Mission Église Évangélique Sel et Lumière
          </p>
          <p className="font-cormorant italic text-[#B87333] text-xs">
            Prêcher, instruire et desservir la communauté !
          </p>
          <p className="font-cinzel text-[10px] uppercase tracking-widest text-[#B87333]/70 mt-0.5">
            Chœur de Louange
          </p>
        </div>
      </div>

      {/* Song title */}
      <h1 className="font-cinzel text-2xl font-bold text-[#5A3318] mb-1">{title}</h1>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#B87333]">
        {keySignature && <span>Tonalité : <strong>{keySignature}</strong></span>}
        {tempo && <span>Tempo : <strong>{tempo} BPM</strong></span>}
        {timeSignature && <span>Mesure : <strong>{timeSignature}</strong></span>}
        {author && <span>Source : <em>{author}</em></span>}
      </div>
    </div>
  );
}
