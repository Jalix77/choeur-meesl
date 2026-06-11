'use client'

import { useState, useRef, useEffect } from 'react'
import type { Profile } from '@/lib/database.types'
import { formatBirthdayDisplay } from '@/lib/database.types'

export type CardTemplate = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface Props {
  profile: Pick<Profile, 'id' | 'full_name' | 'date_naissance' | 'avatar_url'>
  onClose?: () => void
  initialTemplate?: CardTemplate
}

export const TEMPLATES: { id: CardTemplate; label: string; palette: string }[] = [
  { id: 1, label: 'MEESL Officiel',    palette: 'Brun & Doré' },
  { id: 2, label: 'Portrait Bleu',     palette: 'Marine & Or' },
  { id: 3, label: 'Rouge Élégant',     palette: 'Rouge & Blanc' },
  { id: 4, label: 'Émeraude',          palette: 'Vert & Crème' },
  { id: 5, label: 'Croix & Lumière',   palette: 'Violet Sacré' },
  { id: 6, label: 'Notes de Louange',  palette: 'Nuit Musicale' },
  { id: 7, label: 'Minimal Luxe',      palette: 'Noir & Or' },
]

// ── Shared helpers ────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

interface CardProps {
  name: string
  date: string
  photoUrl?: string | null
  size: number   // 1080 for capture, scaled for preview
}

// ── Photo circle helper ───────────────────────────────────────────────────────

function PhotoCircle({
  photoUrl, initials, size, borderColor, bgColor, textColor,
}: {
  photoUrl?: string | null
  initials: string
  size: number
  borderColor: string
  bgColor: string
  textColor: string
}) {
  const s = size
  if (photoUrl) {
    return (
      <div style={{
        width: s, height: s, borderRadius: '50%',
        border: `${Math.round(s * 0.04)}px solid ${borderColor}`,
        overflow: 'hidden', flexShrink: 0,
        boxShadow: `0 0 ${Math.round(s * 0.15)}px rgba(0,0,0,0.4)`,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="" crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      border: `${Math.round(s * 0.04)}px solid ${borderColor}`,
      background: bgColor, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(s * 0.32), fontWeight: 'bold', color: textColor,
      fontFamily: 'Georgia, serif',
      boxShadow: `0 0 ${Math.round(s * 0.15)}px rgba(0,0,0,0.3)`,
    }}>
      {initials}
    </div>
  )
}

// ── TEMPLATE 1 — MEESL Officiel Brun & Doré ──────────────────────────────────
function T1({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg, #5A3318 0%, #7A4A20 40%, #3D1F0A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Background watermark circle */}
      <div style={{
        position: 'absolute', width: S * 0.9, height: S * 0.9, borderRadius: '50%',
        border: `${fs(0.002)}px solid rgba(226,179,106,0.12)`,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      }} />
      <div style={{
        position: 'absolute', width: S * 0.75, height: S * 0.75, borderRadius: '50%',
        border: `${fs(0.002)}px solid rgba(226,179,106,0.08)`,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      }} />
      {/* Top divider */}
      <div style={{
        position: 'absolute', top: S * 0.06, left: '50%', transform: 'translateX(-50%)',
        width: S * 0.6, height: fs(0.002), background: 'linear-gradient(90deg,transparent,#E2B36A,transparent)',
      }} />
      {/* Bottom divider */}
      <div style={{
        position: 'absolute', bottom: S * 0.06, left: '50%', transform: 'translateX(-50%)',
        width: S * 0.6, height: fs(0.002), background: 'linear-gradient(90deg,transparent,#E2B36A,transparent)',
      }} />
      {/* Church label */}
      <p style={{ color: '#E2B36A', opacity: 0.7, fontSize: fs(0.022), letterSpacing: '0.3em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Photo */}
      <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.25)}
        borderColor="#E2B36A" bgColor="rgba(226,179,106,0.15)" textColor="#E2B36A" />
      {/* Header text */}
      <p style={{ color: 'rgba(226,179,106,0.85)', fontSize: fs(0.038), letterSpacing: '0.25em',
        margin: `${fs(0.04)}px 0 ${fs(0.015)}px`, fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </p>
      {/* Name */}
      <p style={{ color: '#F5E6C8', fontSize: fs(0.072), fontWeight: 'bold',
        margin: `0 0 ${fs(0.015)}px`, textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        maxWidth: S * 0.85, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      {/* Date badge */}
      <div style={{
        background: 'rgba(226,179,106,0.18)', border: `1px solid #E2B36A`,
        borderRadius: fs(0.04), padding: `${fs(0.012)}px ${fs(0.04)}px`,
        margin: `${fs(0.02)}px 0 ${fs(0.04)}px`,
      }}>
        <p style={{ color: '#E2B36A', fontSize: fs(0.032), margin: 0, letterSpacing: '0.1em' }}>
          🎂 {date}
        </p>
      </div>
      {/* Blessing */}
      <p style={{ color: 'rgba(226,179,106,0.8)', fontSize: fs(0.028), textAlign: 'center',
        margin: 0, maxWidth: S * 0.75, lineHeight: 1.6, fontStyle: 'italic' }}>
        Que Dieu vous accorde grâce, santé et succès<br />dans cette nouvelle année de vie.
      </p>
      {/* Gold bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: fs(0.008),
        background: 'linear-gradient(90deg,transparent,#B87333,#E2B36A,#B87333,transparent)' }} />
    </div>
  )
}

// ── TEMPLATE 2 — Premium Portrait Bleu & Or ──────────────────────────────────
function T2({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #0B1426 0%, #152744 50%, #1E3A5F 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Geometric background shapes */}
      <div style={{
        position: 'absolute', top: -S * 0.2, right: -S * 0.2,
        width: S * 0.7, height: S * 0.7, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -S * 0.2, left: -S * 0.2,
        width: S * 0.6, height: S * 0.6, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,90,160,0.2) 0%, transparent 70%)',
      }} />
      {/* Top corner ornaments */}
      {[[S * 0.04, S * 0.04], [S * 0.88, S * 0.04]].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: l as number, top: t as number,
          width: fs(0.06), height: fs(0.06),
          borderTop: `2px solid #C9A227`, borderLeft: i === 0 ? `2px solid #C9A227` : undefined,
          borderRight: i === 1 ? `2px solid #C9A227` : undefined,
        }} />
      ))}
      {/* Bottom corner ornaments */}
      {[[S * 0.04, S * 0.88], [S * 0.88, S * 0.88]].map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: l as number, top: t as number,
          width: fs(0.06), height: fs(0.06),
          borderBottom: `2px solid #C9A227`, borderLeft: i === 0 ? `2px solid #C9A227` : undefined,
          borderRight: i === 1 ? `2px solid #C9A227` : undefined,
        }} />
      ))}
      {/* Church top label */}
      <p style={{ color: 'rgba(201,162,39,0.6)', fontSize: fs(0.02), letterSpacing: '0.35em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Photo with double ring */}
      <div style={{ position: 'relative', marginBottom: fs(0.04) }}>
        <div style={{
          position: 'absolute', inset: -fs(0.015), borderRadius: '50%',
          border: `1px solid rgba(201,162,39,0.3)`,
        }} />
        <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.26)}
          borderColor="#C9A227" bgColor="rgba(201,162,39,0.12)" textColor="#C9A227" />
      </div>
      {/* Decorative line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.02), marginBottom: fs(0.025) }}>
        <div style={{ width: fs(0.08), height: 1, background: 'linear-gradient(90deg,transparent,#C9A227)' }} />
        <span style={{ color: '#C9A227', fontSize: fs(0.025) }}>✦</span>
        <div style={{ width: fs(0.08), height: 1, background: 'linear-gradient(90deg,#C9A227,transparent)' }} />
      </div>
      <p style={{ color: 'rgba(201,162,39,0.9)', fontSize: fs(0.035), letterSpacing: '0.3em',
        margin: `0 0 ${fs(0.015)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </p>
      <p style={{ color: '#FFFFFF', fontSize: fs(0.068), fontWeight: 'bold',
        margin: `0 0 ${fs(0.02)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.015),
        background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.4)',
        borderRadius: fs(0.05), padding: `${fs(0.01)}px ${fs(0.04)}px`, marginBottom: fs(0.035) }}>
        <span style={{ color: '#C9A227', fontSize: fs(0.03) }}>🎂</span>
        <span style={{ color: '#C9A227', fontSize: fs(0.03), letterSpacing: '0.1em' }}>{date}</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: fs(0.026), textAlign: 'center',
        margin: 0, maxWidth: S * 0.72, lineHeight: 1.65, fontStyle: 'italic' }}>
        Que le Seigneur vous bénisse et vous garde,<br />qu'Il fasse luire sa face sur vous.
      </p>
      <p style={{ color: 'rgba(201,162,39,0.4)', fontSize: fs(0.018),
        margin: `${fs(0.025)}px 0 0`, letterSpacing: '0.2em', fontFamily: 'Arial,sans-serif' }}>
        Nombres 6:24
      </p>
    </div>
  )
}

// ── TEMPLATE 3 — Rouge & Blanc Élégant ───────────────────────────────────────
function T3({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: '#FAFAFA',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Left red accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: fs(0.012),
        background: 'linear-gradient(180deg, #C0392B, #E74C3C, #C0392B)',
      }} />
      {/* Right red accent stripe */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: fs(0.004),
        background: 'rgba(192,57,43,0.3)',
      }} />
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 80% 20%, rgba(192,57,43,0.04) 0%, transparent 50%),
                          radial-gradient(circle at 20% 80%, rgba(192,57,43,0.04) 0%, transparent 50%)`,
      }} />
      {/* Top label */}
      <p style={{ color: '#C0392B', fontSize: fs(0.02), letterSpacing: '0.35em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Photo with red shadow */}
      <div style={{ marginBottom: fs(0.04), position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: fs(0.008), borderRadius: '50%',
          boxShadow: `0 0 ${fs(0.06)}px rgba(192,57,43,0.4)`,
        }} />
        <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.26)}
          borderColor="#C0392B" bgColor="rgba(192,57,43,0.08)" textColor="#C0392B" />
      </div>
      {/* Red divider */}
      <div style={{ width: S * 0.5, height: fs(0.003),
        background: 'linear-gradient(90deg,transparent,#C0392B,transparent)',
        marginBottom: fs(0.03) }} />
      <p style={{ color: '#C0392B', fontSize: fs(0.038), letterSpacing: '0.2em',
        margin: `0 0 ${fs(0.015)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </p>
      <p style={{ color: '#1A1A1A', fontSize: fs(0.07), fontWeight: 'bold',
        margin: `0 0 ${fs(0.02)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      {/* Date badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: fs(0.015),
        background: '#C0392B', borderRadius: fs(0.04),
        padding: `${fs(0.012)}px ${fs(0.045)}px`, marginBottom: fs(0.04),
      }}>
        <span style={{ color: '#FFFFFF', fontSize: fs(0.03), fontFamily: 'Arial,sans-serif', letterSpacing: '0.1em' }}>
          🎂 {date}
        </span>
      </div>
      <p style={{ color: '#555555', fontSize: fs(0.027), textAlign: 'center',
        margin: 0, maxWidth: S * 0.72, lineHeight: 1.65, fontStyle: 'italic' }}>
        Que Dieu vous bénisse abondamment<br />et vous accorde joie et prospérité.
      </p>
    </div>
  )
}

// ── TEMPLATE 4 — Vert Émeraude ────────────────────────────────────────────────
function T4({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg, #0D2B1E 0%, #1A4A34 50%, #0A1F16 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Leaf shapes via CSS */}
      {[
        { w: S*0.3, h: S*0.5, t: -S*0.1, l: -S*0.08, r: '40deg' },
        { w: S*0.25, h: S*0.45, t: S*0.6, r2: -S*0.06, r: '-30deg' },
        { w: S*0.2, h: S*0.35, t: S*0.1, r2: S*0.85, r: '20deg' },
      ].map((leaf, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: leaf.t, left: leaf.l !== undefined ? leaf.l : undefined,
          right: leaf.r2 !== undefined ? leaf.r2 : undefined,
          width: leaf.w, height: leaf.h,
          borderRadius: '50% 0 50% 0',
          background: 'rgba(34,197,94,0.06)',
          transform: `rotate(${leaf.r})`,
        }} />
      ))}
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: S * 0.8, height: S * 0.8, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
      }} />
      <p style={{ color: 'rgba(212,232,170,0.65)', fontSize: fs(0.02), letterSpacing: '0.35em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Photo */}
      <div style={{ marginBottom: fs(0.04) }}>
        <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.26)}
          borderColor="#5DB075" bgColor="rgba(93,176,117,0.15)" textColor="#A8D8B0" />
      </div>
      {/* Decorative branch motif */}
      <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.02), marginBottom: fs(0.025) }}>
        <span style={{ color: '#5DB075', fontSize: fs(0.03) }}>🌿</span>
        <div style={{ width: fs(0.06), height: 1, background: 'rgba(93,176,117,0.5)' }} />
        <span style={{ color: '#D4E8AA', fontSize: fs(0.022), letterSpacing: '0.3em',
          fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>Joyeux Anniversaire</span>
        <div style={{ width: fs(0.06), height: 1, background: 'rgba(93,176,117,0.5)' }} />
        <span style={{ color: '#5DB075', fontSize: fs(0.03) }}>🌿</span>
      </div>
      <p style={{ color: '#E8F5E2', fontSize: fs(0.068), fontWeight: 'bold',
        margin: `0 0 ${fs(0.015)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      <div style={{
        background: 'rgba(93,176,117,0.2)', border: '1px solid rgba(93,176,117,0.5)',
        borderRadius: fs(0.05), padding: `${fs(0.012)}px ${fs(0.04)}px`, marginBottom: fs(0.035),
      }}>
        <span style={{ color: '#A8D8B0', fontSize: fs(0.03), letterSpacing: '0.1em' }}>
          🎂 {date}
        </span>
      </div>
      <p style={{ color: 'rgba(212,232,170,0.75)', fontSize: fs(0.027), textAlign: 'center',
        margin: 0, maxWidth: S * 0.72, lineHeight: 1.65, fontStyle: 'italic' }}>
        Comme un arbre planté près des eaux,<br />puissiez-vous porter du fruit en toute saison.
      </p>
    </div>
  )
}

// ── TEMPLATE 5 — Chrétien Croix & Lumière ────────────────────────────────────
function T5({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #1A0B2E 0%, #2D1B4E 50%, #3D2462 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Light rays from center top */}
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: '50%',
          width: fs(0.002), height: S * 0.55,
          background: 'linear-gradient(180deg,rgba(245,200,66,0.15),transparent)',
          transformOrigin: 'top center',
          transform: `translateX(-50%) rotate(${(i - 3) * 18}deg)`,
        }} />
      ))}
      {/* Cross */}
      <div style={{ position: 'absolute', top: S * 0.05, left: '50%', transform: 'translateX(-50%)' }}>
        <div style={{
          width: fs(0.06), height: fs(0.14), background: 'rgba(245,200,66,0.7)',
          borderRadius: fs(0.005), margin: '0 auto',
          boxShadow: `0 0 ${fs(0.04)}px rgba(245,200,66,0.6)`,
        }} />
        <div style={{
          width: fs(0.12), height: fs(0.035), background: 'rgba(245,200,66,0.7)',
          borderRadius: fs(0.005), marginTop: -fs(0.09),
          boxShadow: `0 0 ${fs(0.04)}px rgba(245,200,66,0.6)`,
        }} />
      </div>
      <p style={{ color: 'rgba(245,200,66,0.65)', fontSize: fs(0.02), letterSpacing: '0.35em',
        margin: `${fs(0.14)}px 0 ${fs(0.035)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.24)}
        borderColor="#F5C842" bgColor="rgba(245,200,66,0.1)" textColor="#F5C842" />
      <div style={{ width: S * 0.5, height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(245,200,66,0.4),transparent)',
        margin: `${fs(0.035)}px 0 ${fs(0.025)}px` }} />
      <p style={{ color: 'rgba(245,200,66,0.85)', fontSize: fs(0.035), letterSpacing: '0.25em',
        margin: `0 0 ${fs(0.015)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </p>
      <p style={{ color: '#FFFFFF', fontSize: fs(0.065), fontWeight: 'bold',
        margin: `0 0 ${fs(0.02)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      <div style={{
        background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)',
        borderRadius: fs(0.04), padding: `${fs(0.01)}px ${fs(0.04)}px`, marginBottom: fs(0.03),
      }}>
        <span style={{ color: '#F5C842', fontSize: fs(0.03), letterSpacing: '0.08em' }}>🎂 {date}</span>
      </div>
      <p style={{ color: 'rgba(224,200,255,0.85)', fontSize: fs(0.027), textAlign: 'center',
        margin: 0, maxWidth: S * 0.75, lineHeight: 1.65, fontStyle: 'italic' }}>
        « Car je connais les projets que j'ai formés sur vous,<br />
        projets de paix et non de malheur. »
      </p>
      <p style={{ color: 'rgba(245,200,66,0.5)', fontSize: fs(0.022),
        margin: `${fs(0.015)}px 0 0`, letterSpacing: '0.1em' }}>
        Jérémie 29:11
      </p>
    </div>
  )
}

// ── TEMPLATE 6 — Musical Notes de Louange ────────────────────────────────────
function T6({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  const notes = ['♩','♪','♫','♬','♩','♪','♫','♬','♩','♪']
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg, #0A0E1A 0%, #111827 50%, #0D1520 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Floating notes */}
      {notes.map((n, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${5 + (i * 9.5) % 90}%`,
          left: `${(i * 17) % 95}%`,
          color: '#E2B36A', opacity: 0.06 + (i % 4) * 0.025,
          fontSize: fs(0.05 + (i % 3) * 0.02),
          transform: `rotate(${-25 + i * 11}deg)`,
          userSelect: 'none',
        }}>{n}</div>
      ))}
      {/* Staff lines */}
      {[0.72, 0.755, 0.79, 0.825, 0.86].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute', left: S * 0.05, right: S * 0.05,
          top: S * pct, height: 1, background: 'rgba(226,179,106,0.12)',
        }} />
      ))}
      {/* Header */}
      <p style={{ color: 'rgba(226,179,106,0.6)', fontSize: fs(0.02), letterSpacing: '0.35em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Music icon + photo */}
      <div style={{ position: 'relative', marginBottom: fs(0.04) }}>
        <div style={{
          position: 'absolute', top: -fs(0.04), left: '50%', transform: 'translateX(-50%)',
          color: '#E2B36A', fontSize: fs(0.045), opacity: 0.5,
        }}>♫</div>
        <PhotoCircle photoUrl={photoUrl} initials={initials} size={fs(0.26)}
          borderColor="#E2B36A" bgColor="rgba(226,179,106,0.1)" textColor="#E2B36A" />
      </div>
      {/* Note divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: fs(0.015), marginBottom: fs(0.025) }}>
        <span style={{ color: '#E2B36A', fontSize: fs(0.025), opacity: 0.6 }}>♩</span>
        <div style={{ width: fs(0.04), height: 1, background: 'rgba(226,179,106,0.4)' }} />
        <span style={{ color: 'rgba(226,179,106,0.7)', fontSize: fs(0.03), letterSpacing: '0.25em',
          fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>Joyeux Anniversaire</span>
        <div style={{ width: fs(0.04), height: 1, background: 'rgba(226,179,106,0.4)' }} />
        <span style={{ color: '#E2B36A', fontSize: fs(0.025), opacity: 0.6 }}>♩</span>
      </div>
      <p style={{ color: '#FFFFFF', fontSize: fs(0.068), fontWeight: 'bold',
        margin: `0 0 ${fs(0.02)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.1 }}>
        {name}
      </p>
      <div style={{
        background: 'rgba(226,179,106,0.15)', border: '1px solid rgba(226,179,106,0.35)',
        borderRadius: fs(0.04), padding: `${fs(0.01)}px ${fs(0.04)}px`, marginBottom: fs(0.035),
      }}>
        <span style={{ color: '#E2B36A', fontSize: fs(0.03), letterSpacing: '0.08em' }}>🎵 {date}</span>
      </div>
      <p style={{ color: 'rgba(226,179,106,0.7)', fontSize: fs(0.027), textAlign: 'center',
        margin: 0, maxWidth: S * 0.72, lineHeight: 1.65, fontStyle: 'italic' }}>
        Que votre vie soit une symphonie de bénédictions,<br />chantée à la gloire de Dieu.
      </p>
    </div>
  )
}

// ── TEMPLATE 7 — Minimal Luxe ─────────────────────────────────────────────────
function T7({ name, date, photoUrl, size: S }: CardProps) {
  const initials = getInitials(name)
  const fs = (n: number) => Math.round(S * n)
  return (
    <div style={{
      width: S, height: S, position: 'relative', overflow: 'hidden',
      background: '#F5F0E8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      {/* Outer frame */}
      <div style={{
        position: 'absolute', inset: fs(0.03),
        border: `1px solid rgba(184,115,51,0.25)`,
        borderRadius: fs(0.015),
      }} />
      {/* Inner frame */}
      <div style={{
        position: 'absolute', inset: fs(0.05),
        border: `1px solid rgba(184,115,51,0.12)`,
        borderRadius: fs(0.01),
      }} />
      {/* Corner marks */}
      {[
        { top: fs(0.06), left: fs(0.06) },
        { top: fs(0.06), right: fs(0.06) },
        { bottom: fs(0.06), left: fs(0.06) },
        { bottom: fs(0.06), right: fs(0.06) },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos,
          width: fs(0.04), height: fs(0.04),
          borderTop: i < 2 ? `2px solid #B87333` : undefined,
          borderBottom: i >= 2 ? `2px solid #B87333` : undefined,
          borderLeft: i % 2 === 0 ? `2px solid #B87333` : undefined,
          borderRight: i % 2 === 1 ? `2px solid #B87333` : undefined,
        }} />
      ))}
      {/* Subtle watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: S * 0.7, height: S * 0.7, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(184,115,51,0.04) 0%, transparent 70%)',
      }} />
      <p style={{ color: 'rgba(184,115,51,0.55)', fontSize: fs(0.018), letterSpacing: '0.4em',
        margin: `0 0 ${fs(0.04)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </p>
      {/* Photo - square with rounded corners */}
      <div style={{
        width: fs(0.26), height: fs(0.26),
        borderRadius: fs(0.03),
        overflow: 'hidden',
        border: `1px solid rgba(184,115,51,0.4)`,
        marginBottom: fs(0.04),
        background: photoUrl ? undefined : 'rgba(184,115,51,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `${fs(0.008)}px ${fs(0.008)}px ${fs(0.02)}px rgba(0,0,0,0.08)`,
      }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: fs(0.08), fontWeight: 'bold', color: '#B87333',
            fontFamily: 'Georgia,serif' }}>{initials}</span>
        )}
      </div>
      {/* Thin gold line */}
      <div style={{ width: S * 0.35, height: fs(0.002),
        background: '#B87333', marginBottom: fs(0.03), opacity: 0.4 }} />
      <p style={{ color: '#B87333', fontSize: fs(0.028), letterSpacing: '0.4em',
        margin: `0 0 ${fs(0.02)}px`, fontFamily: 'Arial,sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </p>
      <p style={{ color: '#1A1A1A', fontSize: fs(0.072), fontWeight: 'bold',
        margin: `0 0 ${fs(0.015)}px`, maxWidth: S * 0.82, textAlign: 'center', lineHeight: 1.05 }}>
        {name}
      </p>
      <p style={{ color: '#B87333', fontSize: fs(0.03),
        margin: `0 0 ${fs(0.04)}px`, letterSpacing: '0.08em', fontFamily: 'Arial,sans-serif' }}>
        🎂 {date}
      </p>
      <p style={{ color: '#666666', fontSize: fs(0.026), textAlign: 'center',
        margin: 0, maxWidth: S * 0.68, lineHeight: 1.65, fontStyle: 'italic' }}>
        Que cette nouvelle année soit marquée<br />par la grâce et la faveur de Dieu.
      </p>
    </div>
  )
}

// ── Template renderer ─────────────────────────────────────────────────────────

function CardRenderer({ template, name, date, photoUrl, size }: CardProps & { template: CardTemplate }) {
  const props = { name, date, photoUrl, size }
  switch (template) {
    case 1: return <T1 {...props} />
    case 2: return <T2 {...props} />
    case 3: return <T3 {...props} />
    case 4: return <T4 {...props} />
    case 5: return <T5 {...props} />
    case 6: return <T6 {...props} />
    case 7: return <T7 {...props} />
  }
}

// ── Main BirthdayCard modal component ────────────────────────────────────────

function buildWhatsAppMessage(name: string, profileId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://choeur-meesl.vercel.app'
  return encodeURIComponent(
    `🎉 La famille Sel & Lumière souhaite un joyeux anniversaire à ${name} !\n\n` +
    `Que Dieu vous bénisse abondamment et vous accorde une nouvelle année remplie de grâce, de paix et de succès.\n\n` +
    `🎂🎉\n\n${origin}/anniversaire/${profileId}`
  )
}

export default function BirthdayCard({ profile, onClose, initialTemplate = 1 }: Props) {
  const [template, setTemplate]         = useState<CardTemplate>(initialTemplate)
  const [downloading, setDownloading]   = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailDone, setEmailDone]       = useState(false)
  const [emailError, setEmailError]     = useState('')

  const captureRef  = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.38)

  const CARD_SIZE = 1080

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setPreviewScale(w / CARD_SIZE)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const name = profile.full_name
  const date = profile.date_naissance ? formatBirthdayDisplay(profile.date_naissance) : '—'

  async function handleDownload() {
    if (!captureRef.current) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(captureRef.current, {
        width: CARD_SIZE,
        height: CARD_SIZE,
        pixelRatio: 1,
        cacheBust: true,
      })
      const a = document.createElement('a')
      a.download = `anniversaire-${name.replace(/\s+/g, '-')}-t${template}.png`
      a.href = dataUrl
      a.click()
    } catch (err) {
      console.error('Erreur export PNG:', err)
      alert('Erreur lors de l\'export. Essayez un autre modèle.')
    }
    setDownloading(false)
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${buildWhatsAppMessage(name, profile.id)}`, '_blank')
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
    setEmailDone(true); setEmailSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#5A3318] px-5 py-3 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-cinzel text-white font-bold text-sm">🎂 Carte anniversaire — {name}</h3>
          {onClose && (
            <button onClick={onClose} className="text-[#E2B36A] hover:text-white text-lg leading-none">✕</button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Template selector */}
          <div className="flex gap-1.5 flex-wrap">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  template === t.id
                    ? 'bg-[#B87333] border-[#B87333] text-white font-semibold shadow'
                    : 'border-[#E2B36A]/50 text-[#5A3318] hover:bg-[#E2B36A]/20'
                }`}>
                {t.label}
                <span className="ml-1 text-[10px] opacity-60 hidden sm:inline">{t.palette}</span>
              </button>
            ))}
          </div>

          {/* Card preview */}
          <div ref={containerRef} className="w-full">
            <div style={{
              width: '100%',
              height: `${CARD_SIZE * previewScale}px`,
              overflow: 'hidden',
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}>
              <div style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}>
                <CardRenderer template={template} name={name} date={date}
                  photoUrl={profile.avatar_url} size={CARD_SIZE} />
              </div>
            </div>
          </div>

          {/* Hidden full-size card for capture */}
          <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
            <div ref={captureRef} style={{ width: CARD_SIZE, height: CARD_SIZE }}>
              <CardRenderer template={template} name={name} date={date}
                photoUrl={profile.avatar_url} size={CARD_SIZE} />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center justify-center gap-1.5 bg-[#5A3318] hover:bg-[#3D1F0A] text-white text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold disabled:opacity-60">
              {downloading ? (
                <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Génération…</>
              ) : '⬇ Télécharger PNG'}
            </button>
            <button onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1fba59] text-white text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={handleSendEmail} disabled={emailSending || emailDone}
              className={`flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-lg transition-colors font-semibold ${
                emailDone ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-[#B87333] hover:bg-[#5A3318] text-white disabled:opacity-60'
              }`}>
              {emailSending ? '✉ Envoi…' : emailDone ? '✓ Envoyé !' : '✉ Envoyer Email'}
            </button>
            <a href={`/anniversaire/${profile.id}?t=${template}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 border border-[#E2B36A]/60 text-[#B87333] text-xs px-3 py-2.5 rounded-lg hover:bg-[#E2B36A]/20 transition-colors font-semibold">
              🔗 Page publique
            </a>
          </div>

          {emailError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{emailError}</p>
          )}
        </div>
      </div>
    </div>
  )
}
