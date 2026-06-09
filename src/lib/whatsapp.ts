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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Clean a phone number to digits only (keeps leading +) */
export function cleanPhone(phone: string): string {
  // Keep leading + for international format
  const leading = phone.trimStart().startsWith('+') ? '+' : ''
  return leading + phone.replace(/\D/g, '')
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
  lines.push('', 'Merci de confirmer votre disponibilité.')

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
