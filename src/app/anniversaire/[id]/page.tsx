/**
 * Public birthday card page — no login required.
 * Accessible via shared WhatsApp / Facebook link.
 * URL: /anniversaire/[profileId]?t=[1-4]
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import PublicCardActions from './PublicCardActions'

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}


export default async function PublicCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t }  = await searchParams
  const template = parseInt(t ?? '1')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, date_naissance, avatar_url')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const name = profile.full_name
  const date = profile.date_naissance ? formatDate(profile.date_naissance) : null
  const imageUrl  = `/api/anniversaires/card/${id}?t=${template}`
  const pageTitle = `Joyeux Anniversaire, ${name} !`

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #FBF6EC 0%, #F5E6C8 50%, #FBF6EC 100%)' }}>
      {/* Minimal header */}
      <header className="bg-[#5A3318] px-4 py-3 flex items-center justify-center gap-3">
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image src="/logo-meesl.png" alt="MEESL" fill className="object-contain" sizes="32px" />
        </div>
        <span className="font-cinzel text-white text-sm font-bold tracking-wide">
          Chœur de Louange MEESL
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎂</div>
          <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">{pageTitle}</h1>
          {date && (
            <p className="text-[#B87333] mt-1">{date}</p>
          )}
          <p className="text-sm text-[#7A4A20]/70 mt-2 italic">
            La famille Sel &amp; Lumière vous souhaite une belle journée remplie de grâce.
          </p>
        </div>

        {/* Card image */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={pageTitle}
            className="w-full"
            style={{ display: 'block' }}
          />
        </div>

        {/* Message */}
        <div className="bg-white/70 border border-[#E2B36A]/40 rounded-xl p-6 text-center shadow-sm">
          <p className="text-[#5A3318] leading-relaxed text-base" style={{ fontFamily: 'Georgia, serif' }}>
            Joyeux anniversaire à notre frère / sœur <strong>{name}</strong>.
          </p>
          <p className="text-[#7A4A20] leading-relaxed text-sm mt-3 italic">
            Que Dieu vous accorde grâce, santé, paix et succès durant cette nouvelle année de vie.
          </p>
          <p className="text-[#B87333] text-2xl mt-4">✝ 🎶 🎂</p>
        </div>

        {/* Actions (client component for WhatsApp, FB share, download) */}
        <PublicCardActions
          profileId={id}
          name={name}
          template={template}
          imageUrl={imageUrl}
        />

        {/* Footer */}
        <div className="text-center text-xs text-[#B87333]/50 pb-8">
          <p>Chœur de Louange MEESL</p>
          <p>Mission Église Évangélique Sel et Lumière · Delmas 48, Port-au-Prince</p>
        </div>
      </main>
    </div>
  )
}
