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
    <div className="print-page-shell" style={{ background: '#e9ddc6', minHeight: '100vh', padding: '24px 14px 60px' }}>
      <PrintProgramButton />

      {/* A4 sheet preview */}
      <div
        className="print-sheet"
        style={{
          maxWidth: 794,
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
        <header className="fiche-header" style={{ display: 'flex', alignItems: 'center', gap: 18, borderBottom: '2px solid #B87333', paddingBottom: 14, marginBottom: 20 }}>
          <Image className="fiche-logo" src="/logo-meesl.png" alt="MEESL" width={72} height={72} style={{ objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <h1 className="fiche-org-name" style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 20, color: '#5A3318', margin: 0, letterSpacing: 0.5 }}>
              Mission Église Évangélique Sel et Lumière
            </h1>
            <p className="fiche-tagline" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: '#8A5A2B', margin: '3px 0 0' }}>
              Prêcher, instruire et desservir la communauté !
            </p>
            <p className="fiche-subtitle" style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 3, color: '#B87333', textTransform: 'uppercase', margin: '4px 0 0' }}>
              Chœur de Louange
            </p>
          </div>
        </header>

        {/* Title */}
        <h2 className="fiche-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 26, color: '#5A3318', margin: '0 0 14px', letterSpacing: 0.5 }}>
          Fiche technique du culte
        </h2>

        {/* Date / Lieu */}
        <div className="fiche-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 32px', marginBottom: 22, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: '#3d1f09' }}>
          <span><strong style={{ color: '#B87333' }}>Date :</strong> {formatRehearsalDate(rehearsal.starts_at)}</span>
          <span><strong style={{ color: '#B87333' }}>Heure :</strong> {formatRehearsalTime(rehearsal.starts_at)}</span>
          <span><strong style={{ color: '#B87333' }}>Lieu :</strong> {rehearsal.location ?? 'À confirmer'}</span>
        </div>

        {/* Program items */}
        <div className="program-content">
          <ol className="fiche-program-list" style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: "'Cormorant Garamond', serif" }}>
            {items.length > 0 ? items.map((item, i) => {
              const name = item.profile_id
                ? (item.profiles?.full_name ?? null)
                : (item.external_name?.trim() || null)
              return (
                <li key={item.id} className="program-item" style={{ display: 'flex', gap: 8, padding: '9px 0', borderBottom: '1px solid #E2B36A40', fontSize: 16, color: '#3d1f09' }}>
                  <span style={{ color: '#B87333', fontWeight: 700, flexShrink: 0, width: 22 }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>
                    {item.label} : <strong>{name ?? '—'}</strong>
                    {item.note && <span className="fiche-item-note" style={{ fontStyle: 'italic', color: '#7A4A20', fontSize: 14 }}> — {item.note}</span>}
                  </span>
                </li>
              )
            }) : (
              <li style={{ fontStyle: 'italic', color: '#8A5A2B', fontSize: 15 }}>Aucune programmation enregistrée pour ce culte.</li>
            )}
          </ol>
        </div>

        {/* Verse + MEESL contact — kept inside the fiche, pinned to the bottom of the page when printed */}
        <div className="print-footer-block">
          <p className="fiche-verse" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: '#8A5A2B', textAlign: 'center', margin: '28px 0 0', borderTop: '1px solid #E2B36A40', paddingTop: 14 }}>
            Jérémie 48:10a — « Maudit soit celui qui fait avec négligence l&apos;œuvre de l&apos;Éternel. »
          </p>

          <footer className="fiche-footer" style={{ marginTop: 18, borderTop: '1.5px solid #B87333', paddingTop: 10, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '4px 16px', fontSize: 12, color: '#6f5736', fontFamily: "'Cormorant Garamond', serif" }}>
            <span>📍 4, Delmas 48 · Port-au-Prince, Haïti</span>
            <span>✉ meesl1410@gmail.com</span>
            <span>☎ (509) 37 97 1717 · (509) 33 16 6621</span>
          </footer>
        </div>
      </div>

      {/*
        This stylesheet only exists in the DOM while this specific route is mounted, so its
        selectors — including the generic-looking `main` / `.app-shell` ones, which reset the
        shared (app) layout's chrome rather than hide it — never affect any other page's print
        output (e.g. /chants/[id]/imprimer keeps its own, separate print behaviour).
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          html, body {
            width: 210mm;
            min-height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Site chrome from the shared (app) layout — never printed */
          .site-nav,
          .site-footer,
          .no-print,
          [data-no-print="true"],
          iframe,
          .floating-widget,
          .chat-widget {
            display: none !important;
          }

          /* Neutralise (not hide) the shared layout wrapper and <main> — they still contain
             this page's content, only their screen-only spacing/height must not print */
          .app-shell {
            min-height: 0 !important;
            background: white !important;
          }
          main {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page-shell {
            padding: 0 !important;
            min-height: 0 !important;
            background: white !important;
          }

          .print-sheet {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            background-image: none !important;
            display: flex;
            flex-direction: column;
            min-height: 277mm; /* fills the printable area so the footer settles at the bottom */
          }

          .program-content { flex: 1; }
          .print-footer-block { margin-top: auto; }

          /* Compact sizing — print only, the on-screen preview is unchanged */
          .fiche-header { padding-bottom: 8px !important; margin-bottom: 10px !important; gap: 12px !important; }
          .fiche-logo { width: 48px !important; height: 48px !important; }
          .fiche-org-name { font-size: 15px !important; }
          .fiche-tagline { font-size: 11px !important; margin-top: 2px !important; }
          .fiche-subtitle { font-size: 8px !important; margin-top: 2px !important; }
          .fiche-title { font-size: 21px !important; margin: 0 0 8px !important; }
          .fiche-meta { font-size: 11px !important; margin-bottom: 10px !important; gap: 4px 24px !important; }

          .fiche-program-list { font-size: 11px !important; line-height: 1.2 !important; }
          .program-item {
            padding: 4px 0 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .fiche-item-note { font-size: 9.5px !important; }

          .fiche-verse { font-size: 9.5px !important; margin: 10px 0 0 !important; padding-top: 8px !important; }
          .fiche-footer { font-size: 9px !important; margin-top: 8px !important; padding-top: 6px !important; }
        }
        @media screen {
          .print-sheet { min-height: 1123px; }
        }
      ` }} />
    </div>
  )
}
