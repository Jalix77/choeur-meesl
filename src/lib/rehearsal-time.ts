/**
 * Utilitaires de date/heure pour les répétitions.
 * Tout est ancré sur le fuseau America/Port-au-Prince (UTC-5, sans heure d'été).
 */

const TZ = 'America/Port-au-Prince'

/** "vendredi 20 juin 2025" */
export function formatRehearsalDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "17:00" */
export function formatRehearsalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "vendredi 20 juin 2025 à 17:00" */
export function formatRehearsalDateTime(iso: string): string {
  return `${formatRehearsalDate(iso)} à ${formatRehearsalTime(iso)}`
}

/**
 * Convertit la valeur d'un <input type="datetime-local"> (interprétée comme
 * heure locale haïtienne UTC-5) en chaîne ISO UTC pour Supabase.
 *
 * Exemple : "2025-06-20T17:00" → "2025-06-20T22:00:00.000Z"
 */
export function haitiInputToISO(localStr: string): string {
  if (!localStr) return ''
  // Normalise en "YYYY-MM-DDTHH:MM:SS"
  const withSeconds = localStr.length === 16 ? localStr + ':00' : localStr
  // Force l'offset haïtien : UTC-5 (pas d'heure d'été en Haïti depuis 2012)
  return new Date(withSeconds + '-05:00').toISOString()
}

/**
 * Convertit une chaîne ISO UTC en valeur pour <input type="datetime-local">
 * affichée en heure haïtienne (UTC-5).
 *
 * Exemple : "2025-06-20T22:00:00.000Z" → "2025-06-20T17:00"
 */
export function isoToHaitiInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  // Soustrait 5 heures pour obtenir l'heure locale haïtienne
  const local = new Date(d.getTime() - 5 * 60 * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
