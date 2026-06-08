import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import SongSheet from '@/components/SongSheet'
import { PrintButton } from '@/components/PrintButton'

export default async function PrintSongPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams
  const initialTranspose = t ? parseInt(t) : 0

  const supabase = await createClient()
  const { data: song } = await supabase.from('songs').select('*').eq('id', id).single()
  if (!song) notFound()

  return (
    <div className="print-page bg-white min-h-screen p-0">
      <PrintButton songId={id} transpose={initialTranspose} />

      {/* Top padding for fixed buttons */}
      <div className="no-print h-16" />

      {/* Printable content */}
      <div className="print-content p-8 max-w-[210mm] mx-auto">
        {/* MEESL Header */}
        <header className="text-center border-b-2 border-[#E2B36A] pb-4 mb-5">
          <div className="flex justify-center mb-2">
            <Image src="/logo-meesl.png" alt="MEESL" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="font-cinzel text-lg font-bold text-[#5A3318] tracking-wide">
            Mission Église Évangélique Sel et Lumière
          </h1>
          <p className="font-cormorant italic text-[#B87333] text-base">
            Prêcher, instruire et desservir la communauté !
          </p>
          <div className="mt-1 inline-block px-3 py-0.5 bg-[#B87333]">
            <span className="font-cinzel text-white text-xs tracking-widest">CHŒUR DE LOUANGE</span>
          </div>
        </header>

        {/* Song title */}
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318] text-center mb-4">{song.title}</h2>

        {/* Song sheet - print mode (no controls) */}
        <SongSheet song={song} initialTranspose={initialTranspose} printMode={true} />

        {/* MEESL Footer */}
        <footer className="border-t border-[#E2B36A]/50 pt-3 mt-6 text-center text-xs text-[#B87333]/80">
          <p>4, Delmas 48 · Port-au-Prince, Haïti</p>
          <p>meesl1410@gmail.com · (509) 37 97 1717 · (509) 33 16 6621</p>
        </footer>
      </div>

      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 12mm; }
          .no-print { display: none !important; }
          .print-content { padding: 0 !important; max-width: 100% !important; }
          body { background: white; }
        }
      ` }} />
    </div>
  )
}
