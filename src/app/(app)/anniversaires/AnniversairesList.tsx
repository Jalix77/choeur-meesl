'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/database.types'
import { formatBirthdayDisplay, daysUntilBirthday, ageThisYear } from '@/lib/database.types'
import BirthdayCard from '@/components/BirthdayCard'

type Member = Pick<Profile, 'id' | 'full_name' | 'date_naissance'>

interface Props {
  todayList:  Member[]
  weekList:   Member[]
  monthList:  Member[]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function buildWhatsApp(name: string, profileId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://choeur-meesl.vercel.app'
  return `https://wa.me/?text=${encodeURIComponent(
    `🎉 La famille Sel & Lumière souhaite un joyeux anniversaire à ${name} !\n\n` +
    `Que Dieu vous bénisse abondamment et vous accorde une nouvelle année remplie de grâce, de paix et de succès.\n\n` +
    `🎂🎉\n\n${origin}/anniversaire/${profileId}`
  )}`
}

function MemberCard({ member, highlight = false }: { member: Member; highlight?: boolean }) {
  const [showCard, setShowCard] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailDone, setEmailDone] = useState(false)
  const [emailError, setEmailError] = useState('')

  const date  = formatBirthdayDisplay(member.date_naissance!)
  const age   = ageThisYear(member.date_naissance!)
  const days  = daysUntilBirthday(member.date_naissance!)
  const initials = getInitials(member.full_name)

  async function handleSendEmail() {
    setEmailSending(true); setEmailError(''); setEmailDone(false)
    const res = await fetch('/api/anniversaires/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: member.id }),
    })
    const json = await res.json()
    if (!res.ok) { setEmailError(json.error ?? 'Erreur'); setEmailSending(false); return }
    setEmailDone(true); setEmailSending(false)
  }

  return (
    <>
      {showCard && (
        <BirthdayCard
          profile={member}
          onClose={() => setShowCard(false)}
        />
      )}

      <div className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
        highlight
          ? 'border-[#B87333] ring-2 ring-[#E2B36A]/40 bg-gradient-to-br from-[#FBF6EC] to-white'
          : 'border-[#E2B36A]/30'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            highlight ? 'bg-[#B87333] text-white' : 'bg-[#E2B36A]/30 text-[#5A3318]'
          }`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#5A3318] leading-tight">{member.full_name}</p>
            <p className="text-xs text-[#B87333] mt-0.5">
              🎂 {date}
              {days === 0
                ? <span className="ml-2 bg-[#B87333] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Aujourd&apos;hui !</span>
                : <span className="ml-1 text-[#B87333]/60">· dans {days} jour{days > 1 ? 's' : ''}</span>
              }
            </p>
            <p className="text-xs text-[#B87333]/50">{age} ans</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setShowCard(true)}
            className="flex-1 text-xs bg-[#B87333] hover:bg-[#5A3318] text-white px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
          >
            🎴 Carte
          </button>

          <a
            href={`/api/anniversaires/card/${member.id}?t=1`}
            download={`anniversaire-${member.id}.png`}
            className="text-xs border border-[#E2B36A]/60 text-[#B87333] px-2.5 py-1.5 rounded-lg hover:bg-[#E2B36A]/20 transition-colors"
            title="Télécharger PNG"
          >
            ⬇
          </a>

          <a
            href={buildWhatsApp(member.full_name, member.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-[#25D366] hover:bg-[#1fba59] text-white px-2.5 py-1.5 rounded-lg transition-colors"
            title="Partager WhatsApp"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          <button
            onClick={handleSendEmail}
            disabled={emailSending || emailDone}
            title="Envoyer email"
            className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              emailDone
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'border border-[#B87333]/40 text-[#B87333] hover:bg-[#B87333]/10 disabled:opacity-50'
            }`}
          >
            {emailSending ? '…' : emailDone ? '✓' : '✉'}
          </button>

          <a
            href={`/anniversaire/${member.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-[#E2B36A]/40 text-[#B87333]/70 hover:text-[#B87333] px-2.5 py-1.5 rounded-lg transition-colors"
            title="Page publique"
          >
            🔗
          </a>
        </div>

        {emailError && (
          <p className="mt-2 text-xs text-red-600">{emailError}</p>
        )}
      </div>
    </>
  )
}

export default function AnniversairesList({ todayList, weekList, monthList }: Props) {
  const hasAny = todayList.length + weekList.length + monthList.length > 0

  if (!hasAny) {
    return (
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🎂</div>
        <p className="font-cinzel text-[#5A3318] font-semibold">Aucun anniversaire ce mois-ci</p>
        <p className="text-sm text-[#B87333]/70 mt-1">
          Les dates de naissance peuvent être ajoutées dans la gestion des membres.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Aujourd'hui */}
      {todayList.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-cinzel text-[#5A3318] font-bold text-lg flex items-center gap-2">
              🎂 Aujourd&apos;hui
            </h2>
            <span className="bg-[#B87333] text-white text-xs px-2.5 py-1 rounded-full font-semibold">
              {todayList.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayList.map(m => (
              <MemberCard key={m.id} member={m} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Cette semaine */}
      {weekList.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-cinzel text-[#5A3318] font-bold text-lg flex items-center gap-2">
              📅 Cette semaine
            </h2>
            <span className="bg-[#E2B36A]/40 text-[#5A3318] text-xs px-2.5 py-1 rounded-full font-semibold">
              {weekList.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekList.map(m => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}

      {/* Ce mois */}
      {monthList.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-cinzel text-[#5A3318] font-bold text-lg flex items-center gap-2">
              🎉 Ce mois-ci
            </h2>
            <span className="bg-[#E2B36A]/20 text-[#B87333] text-xs px-2.5 py-1 rounded-full font-semibold">
              {monthList.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthList.map(m => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
