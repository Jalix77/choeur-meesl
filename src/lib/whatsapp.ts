/**
 * WhatsApp notification helpers — pure client-safe functions.
 * No server dependencies; safe to import in both Server and Client components.
 */

export interface WhatsAppTarget {
  profile_id: string
  full_name: string
  phone: string | null | undefined
  vocal_role: string
}

export interface WhatsAppLink {
  profile_id: string
  full_name: string
  phone: string | null
  vocal_role: string
  url: string | null       // null if no phone
  missingPhone: boolean
}

import { formatRehearsalDate, formatRehearsalTime } from '@/lib/rehearsal-time'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://choeur-meesl.vercel.app'

function fmtDate(iso: string) { return formatRehearsalDate(iso) }
function fmtTime(iso: string) { return formatRehearsalTime(iso) }

/** Clean a phone number to digits only (keeps leading +) */
export function cleanPhone(phone: string): string {
  // Keep leading + for international format
  const leading = phone.trimStart().startsWith('+') ? '+' : ''
  return leading + phone.replace(/\D/g, '')
}

/**
 * Nettoie un numéro de téléphone haïtien et retourne uniquement les chiffres
 * au format international (509XXXXXXXX) — sans + — pour les liens wa.me.
 *
 * Cas gérés :
 *   "+509 3797 1717"  → "50937971717"
 *   "509 3797 1717"   → "50937971717"
 *   "37971717"        → "50937971717"  (8 chiffres, commence par 3 ou 4)
 *   "47971717"        → "50947971717"
 *   "0 3797 1717"     → "50937971717"  (9 chiffres, commence par 0)
 *   "+1 509 3797 1717"→ "50937971717"
 * Retourne null si le numéro est vide ou invalide.
 */
export function cleanHaitianPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  // Déjà au format 509XXXXXXXX (11 chiffres)
  if (digits.startsWith('509') && digits.length === 11) return digits
  // Format +1509XXXXXXXXX (12 chiffres)
  if (digits.startsWith('1509') && digits.length === 12) return digits.slice(1)
  // 8 chiffres, commence par 3 ou 4 (mobile haïtien)
  if (digits.length === 8 && (digits[0] === '3' || digits[0] === '4')) return '509' + digits
  // 9 chiffres avec 0 en tête
  if (digits.startsWith('0') && digits.length === 9) return '509' + digits.slice(1)
  // Autre — garder tel quel si longueur raisonnable
  return digits.length >= 7 ? digits : null
}

/** Construit le texte du message WhatsApp pour une annonce */
export function buildAnnouncementWAMessage(title: string, content: string): string {
  return [
    '📢 ANNONCE — CHŒUR DE LOUANGE MEESL',
    '',
    title,
    '',
    content,
    '',
    'Que Dieu vous bénisse.',
    '',
    'Mission Église Évangélique Sel et Lumière — Delmas 48',
  ].join('\n')
}

/** Construit le lien wa.me pour une annonce. Retourne null si le numéro est invalide. */
export function buildAnnouncementWAUrl(phone: string, title: string, content: string): string | null {
  const cleaned = cleanHaitianPhone(phone)
  if (!cleaned) return null
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(buildAnnouncementWAMessage(title, content))}`
}

/** Construit le texte du message WhatsApp pour partager un lien YouTube d'un chant */
export function buildSongYoutubeWAMessage(songTitle: string, youtubeUrl: string): string {
  return [
    '🎵 Chœur de Louange MEESL',
    '',
    'Voici le lien YouTube pour le chant :',
    songTitle,
    '',
    `🎥 ${youtubeUrl}`,
  ].join('\n')
}

/** Construit le lien wa.me (sans destinataire précis) pour partager un lien YouTube d'un chant */
export function buildSongYoutubeWAUrl(songTitle: string, youtubeUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildSongYoutubeWAMessage(songTitle, youtubeUrl))}`
}

export function buildWhatsAppMessage(opts: {
  name: string
  vocal_role: string
  starts_at: string
  location: string | null
  notes: string | null
  songs: { title: string; order_index: number }[]
}): string {
  const { name, vocal_role, starts_at, location, notes, songs } = opts
  const date = fmtDate(starts_at)
  const time = fmtTime(starts_at)
  const loc = location ?? 'À confirmer'
  const songLines = songs.length
    ? songs
        .sort((a, b) => a.order_index - b.order_index)
        .map((s, i) => `  ${i + 1}. ${s.title}`)
        .join('\n')
    : ''

  const lines = [
    `Bonjour ${name}, vous êtes sélectionné(e) pour servir avec le Chœur de Louange MEESL.`,
    '',
    `Répétition : ${date} à ${time}`,
    `Lieu : ${loc}`,
    `Rôle : ${vocal_role}`,
  ]
  if (songLines) {
    lines.push(`Chants :\n${songLines}`)
  }
  if (notes) {
    lines.push(`Notes : ${notes}`)
  }
  lines.push(
    '',
    'Merci de confirmer votre disponibilité.',
    '',
    `🔗 Voir le planning : ${APP_URL}/planning`,
  )

  return lines.join('\n')
}

export function buildWhatsAppLinks(opts: {
  targets: WhatsAppTarget[]
  starts_at: string
  location: string | null
  notes: string | null
  songs: { title: string; order_index: number }[]
}): WhatsAppLink[] {
  return opts.targets.map(t => {
    const phone = t.phone?.trim() ?? null
    if (!phone) {
      return { profile_id: t.profile_id, full_name: t.full_name, phone: null, vocal_role: t.vocal_role, url: null, missingPhone: true }
    }
    const cleaned = cleanPhone(phone)
    const message = buildWhatsAppMessage({
      name: t.full_name,
      vocal_role: t.vocal_role,
      starts_at: opts.starts_at,
      location: opts.location,
      notes: opts.notes,
      songs: opts.songs,
    })
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
    return { profile_id: t.profile_id, full_name: t.full_name, phone: cleaned, vocal_role: t.vocal_role, url, missingPhone: false }
  })
}
