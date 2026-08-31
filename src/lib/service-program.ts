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

export interface MergedServicePerson {
  profile_id: string
  role_labels: string[]
}

/**
 * Fusionne les choristes sélectionnés et les responsables internes de la
 * programmation du culte en une seule liste de personnes en service —
 * une personne assignée à un rôle de programmation (ex: "Première lecture")
 * doit être considérée en service même si elle n'est pas choriste, et une
 * même personne présente dans plusieurs rôles n'apparaît qu'une fois.
 */
export function mergeServiceAssignments(
  choristers: { profile_id: string; vocal_role: string }[],
  programAssignees: { profile_id: string; label: string }[],
): MergedServicePerson[] {
  const order: string[] = []
  const map = new Map<string, MergedServicePerson>()

  function add(profile_id: string, label: string) {
    let entry = map.get(profile_id)
    if (!entry) {
      entry = { profile_id, role_labels: [] }
      map.set(profile_id, entry)
      order.push(profile_id)
    }
    if (!entry.role_labels.includes(label)) entry.role_labels.push(label)
  }

  for (const c of choristers) add(c.profile_id, c.vocal_role)
  for (const p of programAssignees) add(p.profile_id, p.label)

  return order.map(id => map.get(id)!)
}
