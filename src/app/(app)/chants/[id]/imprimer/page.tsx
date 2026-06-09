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

  // Letter = 8.5" × 11" = 816px × 1056px at 96dpi
  // Usable area with 0.75" margins = 7" × 9.5" = 672px × 912px
  return (
    <div style={{ background: '#e9ddc6', minHeight: '100vh', padding: '24px 14px 60px' }}>
      <PrintButton songId={id} transpose={initialTranspose} />

      {/* Letter-size sheet preview */}
      <div
        className="print-sheet"
        style={{
          maxWidth: 816,
          margin: '48px auto 0',
          background: '#FBF6EC',
          border: '1px solid #e3d6bb',
          borderRadius: 6,
          boxShadow: '0 18px 50px rgba(60,36,16,.18)',
          padding: '34px 40px 28px',
          backgroundImage: 'radial-gradient(circle at 50% 0,#fffaf0,transparent 60%)',
        }}
      >
        {/* MEESL Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 18, borderBottom: '2px solid #B87333', paddingBottom: 14, marginBottom: 16 }}>
          <Image src="/logo-meesl.png" alt="MEESL" width={72} height={72} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 20, color: '#5A3318', margin: 0, letterSpacing: 0.5 }}>
              Mission Église Évangélique Sel et Lumière
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: '#8A5A2B', margin: '3px 0 0' }}>
              Prêcher, instruire et desservir la communauté !
            </p>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: '#B87333', textTransform: 'uppercase', margin: '4px 0 0' }}>
              Chœur de Louange
            </p>
          </div>
        </header>

        {/* Song title */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 28, color: '#5A3318', margin: '0 0 4px' }}>
          {song.title}
        </h2>

        {/* Song sheet - print mode (no controls) */}
        <SongSheet song={song} initialTranspose={initialTranspose} printMode={true} />

        {/* MEESL Footer */}
        <footer style={{ marginTop: 26, borderTop: '1.5px solid #B87333', paddingTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '4px 16px', fontSize: 12, color: '#6f5736', fontFamily: "'Cormorant Garamond', serif" }}>
          <span>📍 4, Delmas 48 · Port-au-Prince, Haïti</span>
          <span>✉ meesl1410@gmail.com</span>
          <span>☎ (509) 37 97 1717 · (509) 33 16 6621</span>
        </footer>
      </div>

      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: letter;
            margin: 0.75in;
          }
          body { background: white !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-sheet {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            background-image: none !important;
          }
        }
        @media screen {
          .print-sheet { min-height: 1056px; }
        }
      ` }} />
    </div>
  )
}
