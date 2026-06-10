import type { Role } from '@/lib/database.types'

/** True for admin AND leader */
export function canManageContent(role: Role | null | undefined): boolean {
  return role === 'admin' || role === 'leader'
}

/** True only for admin */
export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'admin'
}

/** True only for leader */
export function isLeader(role: Role | null | undefined): boolean {
  return role === 'leader'
}

/** French display label for a role */
export const ROLE_LABELS: Record<Role, string> = {
  member: 'Membre',
  leader: 'Leader',
  admin:  'Admin',
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'member', label: 'Membre' },
  { value: 'leader', label: 'Leader' },
  { value: 'admin',  label: 'Admin' },
]
