/**
 * Programmation du culte — éléments par défaut, helpers d'affichage et
 * fusion des personnes assignées au service (choristes + responsables de
 * la programmation), pour éviter les doublons de notification.
 */

export interface DefaultProgramItem {
  item_type: string
  label: string
}

/** Structure par défaut d'un culte MEESL — préchargée pour chaque nouvelle répétition. */
export const DEFAULT_PROGRAM_ITEMS: DefaultProgramItem[] = [
  { item_type: 'appel_adoration',     label: "Appel à l'adoration" },
  { item_type: 'introduction',        label: 'Introduction' },
  { item_type: 'priere_invocation',   label: "Prière d'invocation" },
  { item_type: 'direction_culte',     label: 'Direction du culte' },
  { item_type: 'priere_pardon',       label: 'Prière de pardon' },
  { item_type: 'premiere_lecture',    label: 'Première lecture' },
  { item_type: 'priere_intercession', label: "Prière d'intercession" },
  { item_type: 'deuxieme_lecture',    label: 'Deuxième lecture' },
  { item_type: 'adoration_louange',   label: 'Adoration et louange' },
  { item_type: 'accueil_visiteurs',   label: 'Accueil des visiteurs' },
  { item_type: 'annonces',            label: 'Annonces' },
  { item_type: 'priere_offrandes',    label: 'Prière pour les offrandes et la prédication' },
  { item_type: 'predication',         label: 'Prédication du jour' },
  { item_type: 'priere_finale',       label: 'Prière finale et bénédiction' },
]

export interface ProgramAssigneeInfo {
  profile_id: string | null
  external_name: string | null
}

/** Nom affiché pour un responsable : membre interne, invité externe, ou null si non assigné. */
export function programAssigneeName(
  item: ProgramAssigneeInfo,
  profileNameById: Map<string, string> | Record<string, string>,
): string | null {
  if (item.profile_id) {
    const name = profileNameById instanceof Map ? profileNameById.get(item.profile_id) : profileNameById[item.profile_id]
    return name ?? null
  }
  if (item.external_name?.trim()) return item.external_name.trim()
  return null
}

export interface InternalAssigneeInput {
  profile_id: string
  label: string
  /** id de la ligne service_program_items d'origine (absent pour un choriste "pur"). */
  item_id?: string
}

export interface ExternalAssigneeInput {
  label: string
  external_name: string
  external_email: string | null
  external_phone: string | null
  item_id?: string
}

export interface MergedServiceRecipient {
  /** Clé de dédoublonnage interne — pas destinée à l'affichage. */
  key: string
  role_labels: string[]
  profile_id: string | null
  external_name: string | null
  external_email: string | null
  external_phone: string | null
  /** ids des lignes service_program_items ayant contribué à cette personne (vide pour un choriste sans rôle de programmation). */
  program_item_ids: string[]
}

function externalKey(info: { external_name: string; external_email: string | null; external_phone: string | null }): string {
  const email = info.external_email?.trim().toLowerCase()
  if (email) return `email:${email}`
  const phone = info.external_phone?.replace(/\D/g, '')
  if (phone) return `phone:${phone}`
  return `name:${info.external_name.trim().toLowerCase()}`
}

/**
 * Fusionne les choristes sélectionnés, les responsables internes (membres)
 * et les invités externes de la programmation du culte en une seule liste
 * de personnes en service — sans doublon — pour piloter les notifications :
 *   - une personne assignée à un rôle de programmation (ex: "Première lecture")
 *     doit être considérée en service même si elle n'est pas choriste ;
 *   - une même personne (même profile_id, ou même email/téléphone externe,
 *     ou même nom si aucune coordonnée n'est renseignée) présente dans
 *     plusieurs rôles n'apparaît qu'une fois, avec ses rôles combinés.
 */
export function mergeServiceRecipients(
  choristers: { profile_id: string; vocal_role: string }[],
  internalAssignees: InternalAssigneeInput[],
  externalAssignees: ExternalAssigneeInput[],
): MergedServiceRecipient[] {
  const order: string[] = []
  const map = new Map<string, MergedServiceRecipient>()

  function addInternal(profile_id: string, label: string, item_id?: string) {
    const key = `profile:${profile_id}`
    let entry = map.get(key)
    if (!entry) {
      entry = { key, role_labels: [], profile_id, external_name: null, external_email: null, external_phone: null, program_item_ids: [] }
      map.set(key, entry)
      order.push(key)
    }
    if (!entry.role_labels.includes(label)) entry.role_labels.push(label)
    if (item_id && !entry.program_item_ids.includes(item_id)) entry.program_item_ids.push(item_id)
  }

  function addExternal(info: ExternalAssigneeInput) {
    const key = externalKey(info)
    let entry = map.get(key)
    if (!entry) {
      entry = {
        key, role_labels: [], profile_id: null,
        external_name: info.external_name.trim(),
        external_email: info.external_email?.trim() || null,
        external_phone: info.external_phone?.trim() || null,
        program_item_ids: [],
      }
      map.set(key, entry)
      order.push(key)
    } else {
      // Complète les coordonnées si une occurrence précédente en avait moins
      if (!entry.external_email && info.external_email?.trim()) entry.external_email = info.external_email.trim()
      if (!entry.external_phone && info.external_phone?.trim()) entry.external_phone = info.external_phone.trim()
    }
    if (!entry.role_labels.includes(info.label)) entry.role_labels.push(info.label)
    if (info.item_id && !entry.program_item_ids.includes(info.item_id)) entry.program_item_ids.push(info.item_id)
  }

  for (const c of choristers) addInternal(c.profile_id, c.vocal_role)
  for (const p of internalAssignees) addInternal(p.profile_id, p.label, p.item_id)
  for (const e of externalAssignees) addExternal(e)

  return order.map(k => map.get(k)!)
}
