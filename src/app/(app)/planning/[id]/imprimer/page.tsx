import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PrintProgramButton } from '@/components/PrintProgramButton'
import { formatRehearsalDate, formatRehearsalTime } from '@/lib/rehearsal-time'
import type { ServiceProgramItemWithProfile } from '@/lib/database.types'

export default async function PrintServiceProgramPage({ params }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rehearsal } = await supabase
    .from('rehearsals')
    .select('id, title, starts_at, location')
    .eq('id', id)
    .single()
  if (!rehearsal) notFound()

  const { data: rawItems } = await supabase
    .from('service_program_items')
    .select('*, profiles(id, full_name)')
    .eq('rehearsal_id', id)
    .order('order_index')
  const items = (rawItems ?? []) as unknown as ServiceProgramItemWithProfile[]

  return (
    <div style={{ background: '#e9ddc6', minHeight: '100vh', padding: '24px 14px 60px' }}>
      <PrintProgramButton />

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
        <header style={{ display: 'flex', alignItems: 'center', gap: 18, borderBottom: '2px solid #B87333', paddingBottom: 14, marginBottom: 20 }}>
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

        {/* Title */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 26, color: '#5A3318', margin: '0 0 14px', letterSpacing: 0.5 }}>
          Fiche technique du culte
        </h2>

        {/* Date / Lieu */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 32px', marginBottom: 22, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: '#3d1f09' }}>
          <span><strong style={{ color: '#B87333' }}>Date :</strong> {formatRehearsalDate(rehearsal.starts_at)}</span>
          <span><strong style={{ color: '#B87333' }}>Heure :</strong> {formatRehearsalTime(rehearsal.starts_at)}</span>
          <span><strong style={{ color: '#B87333' }}>Lieu :</strong> {rehearsal.location ?? 'À confirmer'}</span>
        </div>

        {/* Program items */}
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: "'Cormorant Garamond', serif" }}>
          {items.length > 0 ? items.map((item, i) => {
            const name = item.profile_id
              ? (item.profiles?.full_name ?? null)
              : (item.external_name?.trim() || null)
            return (
              <li key={item.id} style={{ display: 'flex', gap: 8, padding: '9px 0', borderBottom: '1px solid #E2B36A40', fontSize: 16, color: '#3d1f09' }}>
                <span style={{ color: '#B87333', fontWeight: 700, flexShrink: 0, width: 22 }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>
                  {item.label} : <strong>{name ?? '—'}</strong>
                  {item.note && <span style={{ fontStyle: 'italic', color: '#7A4A20', fontSize: 14 }}> — {item.note}</span>}
                </span>
              </li>
            )
          }) : (
            <li style={{ fontStyle: 'italic', color: '#8A5A2B', fontSize: 15 }}>Aucune programmation enregistrée pour ce culte.</li>
          )}
        </ol>

        {/* Verse */}
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#8A5A2B', textAlign: 'center', margin: '28px 0 0', borderTop: '1px solid #E2B36A40', paddingTop: 14 }}>
          Jérémie 48:10a — « Maudit soit celui qui fait avec négligence l&apos;œuvre de l&apos;Éternel. »
        </p>

        {/* MEESL Footer */}
        <footer style={{ marginTop: 18, borderTop: '1.5px solid #B87333', paddingTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '4px 16px', fontSize: 12, color: '#6f5736', fontFamily: "'Cormorant Garamond', serif" }}>
          <span>📍 4, Delmas 48 · Port-au-Prince, Haïti</span>
          <span>✉ meesl1410@gmail.com</span>
          <span>☎ (509) 37 97 1717 · (509) 33 16 6621</span>
        </footer>
      </div>

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
