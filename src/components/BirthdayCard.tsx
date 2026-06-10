'use client'

import { useState, useRef } from 'react'
import type { Profile } from '@/lib/database.types'
import { formatBirthdayDisplay, ageThisYear } from '@/lib/database.types'

export type CardTemplate = 1 | 2 | 3 | 4

interface Props {
  profile: Pick<Profile, 'id' | 'full_name' | 'date_naissance'>
  onClose?: () => void
  initialTemplate?: CardTemplate
}

const TEMPLATES: { id: CardTemplate; label: string; desc: string }[] = [
  { id: 1, label: 'MEESL',       desc: 'Brun & doré' },
  { id: 2, label: 'Or & Blanc',  desc: 'Premium' },
  { id: 3, label: 'Musical',     desc: 'Notes de musique' },
  { id: 4, label: 'Chrétien',    desc: 'Croix & lumière' },
]

function buildWhatsAppMessage(name: string, profileId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://choeur-meesl.vercel.app'
  const cardUrl = `${origin}/anniversaire/${profileId}`
  return encodeURIComponent(
    `🎉 La famille Sel & Lumière souhaite un joyeux anniversaire à ${name} !\n\n` +
    `Que Dieu vous bénisse abondamment et vous accorde une nouvelle année remplie de grâce, de paix et de succès.\n\n` +
    `🎂🎉\n\n${cardUrl}`
  )
}

// ── Card preview renderers ────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function CardTemplate1({ name, date, age }: { name: string; date: string; age: number }) {
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 select-none"
      style={{ background: 'linear-gradient(135deg, #5A3318 0%, #7A4A20 50%, #3D1F0A 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: '#E2B36A', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#E2B36A', transform: 'translate(-30%, 30%)' }} />

      {/* Logo placeholder */}
      <div className="mb-2 text-xs tracking-[0.3em] font-semibold" style={{ color: '#E2B36A', opacity: 0.7 }}>
        CHŒUR DE LOUANGE MEESL
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 border-2"
        style={{ background: '#E2B36A22', borderColor: '#E2B36A', color: '#E2B36A' }}>
        {getInitials(name)}
      </div>

      <p className="text-sm tracking-widest mb-1" style={{ color: '#E2B36A', opacity: 0.8 }}>JOYEUX ANNIVERSAIRE</p>
      <h2 className="font-bold text-2xl mb-1" style={{ color: '#F5E6C8', fontFamily: 'Georgia, serif' }}>{name}</h2>
      <p className="text-sm mb-4" style={{ color: '#E2B36A' }}>🎂 {date} · {age} ans</p>

      <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#E2B36A', opacity: 0.85 }}>
        Que Dieu vous accorde grâce, santé, paix et succès<br />durant cette nouvelle année de vie.
      </p>

      <div className="mt-4 text-lg" style={{ color: '#E2B36A' }}>✝ 🎶 🎂</div>

      {/* Bottom band */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #B87333, #E2B36A, #B87333)' }} />
    </div>
  )
}

function CardTemplate2({ name, date, age }: { name: string; date: string; age: number }) {
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 select-none"
      style={{ background: 'linear-gradient(160deg, #FFFDF5 0%, #FFF8E0 50%, #FFFDF5 100%)' }}
    >
      {/* Gold border frame */}
      <div className="absolute inset-3 rounded-xl border-2 pointer-events-none" style={{ borderColor: '#C9A227' }} />
      <div className="absolute inset-4 rounded-xl border pointer-events-none" style={{ borderColor: '#E2B36A44' }} />

      {/* Corner ornaments */}
      <div className="absolute top-5 left-5 text-2xl" style={{ color: '#C9A227' }}>❋</div>
      <div className="absolute top-5 right-5 text-2xl" style={{ color: '#C9A227' }}>❋</div>
      <div className="absolute bottom-5 left-5 text-2xl" style={{ color: '#C9A227' }}>❋</div>
      <div className="absolute bottom-5 right-5 text-2xl" style={{ color: '#C9A227' }}>❋</div>

      <div className="text-3xl mb-3">🎊</div>

      <p className="text-xs tracking-[0.4em] mb-1 font-semibold" style={{ color: '#C9A227' }}>JOYEUX ANNIVERSAIRE</p>
      <h2 className="text-3xl font-bold mb-1" style={{ color: '#5A3318', fontFamily: 'Georgia, serif' }}>{name}</h2>
      <div className="w-16 h-0.5 mx-auto my-2" style={{ background: 'linear-gradient(90deg, transparent, #C9A227, transparent)' }} />
      <p className="text-sm mb-3" style={{ color: '#B87333' }}>🎂 {date} · {age} ans</p>

      <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#7A4A20' }}>
        Que Dieu vous bénisse abondamment<br />et vous accorde une nouvelle année<br />remplie de grâce, de paix et de succès.
      </p>

      <div className="mt-3 text-xs tracking-widest font-semibold" style={{ color: '#C9A227', opacity: 0.7 }}>
        CHŒUR DE LOUANGE MEESL
      </div>
    </div>
  )
}

function CardTemplate3({ name, date, age }: { name: string; date: string; age: number }) {
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 select-none"
      style={{ background: 'linear-gradient(135deg, #0F1923 0%, #1a2a3a 50%, #0d1822 100%)' }}
    >
      {/* Floating music notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['♩','♪','♫','♬','♩','♪','♫'].map((n, i) => (
          <span key={i} className="absolute text-lg"
            style={{
              color: '#E2B36A',
              opacity: 0.08 + (i % 3) * 0.04,
              top: `${10 + i * 12}%`,
              left: `${5 + i * 13}%`,
              fontSize: `${16 + (i % 3) * 6}px`,
              transform: `rotate(${-20 + i * 10}deg)`,
            }}>
            {n}
          </span>
        ))}
      </div>

      {/* Staff lines */}
      <div className="absolute inset-x-0" style={{ top: '72%' }}>
        {[0,6,12,18,24].map(t => (
          <div key={t} className="w-full h-px" style={{ background: '#E2B36A', opacity: 0.08, marginBottom: t === 24 ? 0 : '6px' }} />
        ))}
      </div>

      <div className="text-4xl mb-2">🎵</div>
      <p className="text-xs tracking-[0.35em] mb-1" style={{ color: '#E2B36A', opacity: 0.7 }}>JOYEUX ANNIVERSAIRE</p>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF', fontFamily: 'Georgia, serif' }}>{name}</h2>
      <div className="flex gap-1 justify-center my-2 text-base" style={{ color: '#E2B36A' }}>♩ ♪ ♫ ♬ ♫ ♪ ♩</div>
      <p className="text-sm mb-3" style={{ color: '#E2B36A' }}>{date} · {age} ans</p>

      <p className="text-xs leading-relaxed max-w-xs" style={{ color: '#E2B36A', opacity: 0.75 }}>
        Que votre vie soit une symphonie de bénédictions<br />et que Dieu vous comble de sa grâce.
      </p>

      <div className="mt-3 text-xs tracking-widest" style={{ color: '#E2B36A', opacity: 0.5 }}>
        CHŒUR DE LOUANGE MEESL
      </div>
    </div>
  )
}

function CardTemplate4({ name, date, age }: { name: string; date: string; age: number }) {
  return (
    <div
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 select-none"
      style={{ background: 'linear-gradient(160deg, #2D1B4E 0%, #4A2C7A 50%, #1E1238 100%)' }}
    >
      {/* Light rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{
        width: 0, height: 0,
        borderLeft: '120px solid transparent',
        borderRight: '120px solid transparent',
        borderTop: '200px solid rgba(255,230,150,0.05)',
      }} />

      {/* Cross */}
      <div className="relative mb-4">
        <div className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full" style={{ height: 48, background: '#F5C842', top: 0 }} />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 rounded-full" style={{ width: 30, background: '#F5C842' }} />
        <div style={{ width: 48, height: 48 }} />
      </div>

      <p className="text-xs tracking-[0.35em] mb-1" style={{ color: '#F5C842', opacity: 0.8 }}>JOYEUX ANNIVERSAIRE</p>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF', fontFamily: 'Georgia, serif' }}>{name}</h2>
      <div className="w-16 h-px mx-auto my-2" style={{ background: '#F5C84255' }} />
      <p className="text-sm mb-3" style={{ color: '#F5C842' }}>🎂 {date} · {age} ans</p>

      <p className="text-xs leading-relaxed max-w-xs italic" style={{ color: '#E0C8FF', opacity: 0.9 }}>
        « Car je connais les projets que j'ai formés sur vous,<br />
        des projets de paix et non de malheur,<br />
        pour vous donner un avenir. »
      </p>
      <p className="text-xs mt-1" style={{ color: '#F5C842', opacity: 0.6 }}>Jérémie 29:11</p>

      <div className="mt-3 text-xs tracking-widest" style={{ color: '#F5C842', opacity: 0.5 }}>
        CHŒUR DE LOUANGE MEESL
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BirthdayCard({ profile, onClose, initialTemplate = 1 }: Props) {
  const [template, setTemplate]       = useState<CardTemplate>(initialTemplate)
  const [emailSending, setEmailSending] = useState(false)
  const [emailDone, setEmailDone]       = useState(false)
  const [emailError, setEmailError]     = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  const name = profile.full_name
  const date = profile.date_naissance ? formatBirthdayDisplay(profile.date_naissance) : '—'
  const age  = profile.date_naissance ? ageThisYear(profile.date_naissance) : 0

  const cardProps = { name, date, age }

  const downloadUrl = `/api/anniversaires/card/${profile.id}?t=${template}`

  function handleWhatsApp() {
    const msg = buildWhatsAppMessage(name, profile.id)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  async function handleSendEmail() {
    setEmailSending(true); setEmailError(''); setEmailDone(false)
    const res = await fetch('/api/anniversaires/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, template }),
    })
    const json = await res.json()
    if (!res.ok) { setEmailError(json.error ?? 'Erreur'); setEmailSending(false); return }
    setEmailDone(true)
    setEmailSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#5A3318] px-5 py-3 flex items-center justify-between">
          <h3 className="font-cinzel text-white font-bold text-sm">Carte anniversaire — {name}</h3>
          {onClose && (
            <button onClick={onClose} className="text-[#E2B36A] hover:text-white text-lg leading-none">✕</button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Template selector */}
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  template === t.id
                    ? 'bg-[#B87333] border-[#B87333] text-white font-semibold'
                    : 'border-[#E2B36A]/60 text-[#5A3318] hover:bg-[#E2B36A]/20'
                }`}
              >
                {t.label}
                <span className="ml-1 text-[10px] opacity-70">{t.desc}</span>
              </button>
            ))}
          </div>

          {/* Card preview */}
          <div ref={cardRef} className="w-full">
            {template === 1 && <CardTemplate1 {...cardProps} />}
            {template === 2 && <CardTemplate2 {...cardProps} />}
            {template === 3 && <CardTemplate3 {...cardProps} />}
            {template === 4 && <CardTemplate4 {...cardProps} />}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <a
              href={downloadUrl}
              download={`anniversaire-${profile.id}-t${template}.png`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#5A3318] hover:bg-[#3D1F0A] text-white text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold"
            >
              ⬇ Télécharger PNG
            </a>

            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1fba59] text-white text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>

            <button
              onClick={handleSendEmail}
              disabled={emailSending || emailDone}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold ${
                emailDone
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-[#B87333] hover:bg-[#5A3318] text-white disabled:opacity-60'
              }`}
            >
              {emailSending ? '✉ Envoi…' : emailDone ? '✓ Envoyé !' : '✉ Email'}
            </button>
          </div>

          {emailError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{emailError}</p>
          )}

          <p className="text-center">
            <a
              href={`/anniversaire/${profile.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#B87333] hover:underline"
            >
              🔗 Ouvrir la page publique de la carte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
