/**
 * POST /api/rehearsals/notify
 *
 * Sends email notifications to all choristers assigned to a rehearsal.
 * - Admin-only (verified server-side via anon client + profiles.role).
 * - Skips choristers already marked notified_email = true (idempotent).
 * - Marks notified_email = true after each successful send.
 * - Returns a detailed result per chorister for the UI.
 *
 * Future WhatsApp support: add `channel: 'whatsapp'` to request body.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { sendRehearsalEmail, sendExternalProgramEmail, type RehearsalNotificationData, type ExternalProgramNotificationData, type NotificationResult } from '@/lib/email'
import { mergeServiceRecipients } from '@/lib/service-program'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAdminSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

async function getCallerRole() {
  const supabase = await getAdminSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { role: null, supabase }
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { role: data?.role ?? null, supabase }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { role, supabase } = await getCallerRole()
  if (role !== 'admin' && role !== 'leader') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { rehearsal_id } = body as { rehearsal_id?: string }

  if (!rehearsal_id) {
    return NextResponse.json({ error: 'rehearsal_id requis' }, { status: 400 })
  }

  // ── 1. Fetch rehearsal ───────────────────────────────────────────────────────
  const { data: rehearsal, error: rehearsalErr } = await supabase
    .from('rehearsals')
    .select('id, title, starts_at, location, notes, public_token, public_access_enabled')
    .eq('id', rehearsal_id)
    .single()

  if (rehearsalErr || !rehearsal) {
    console.error('[NOTIFY] rehearsal not found', rehearsalErr)
    return NextResponse.json({ error: 'Répétition introuvable' }, { status: 404 })
  }

  // Lien public (sans login) vers la programmation — pour les invités externes uniquement.
  // Jamais /planning, qui exige un compte membre.
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://choeur-meesl.vercel.app'
  const publicUrl = (rehearsal.public_access_enabled && rehearsal.public_token)
    ? `${APP_URL}/public/programme/${rehearsal.public_token}`
    : null

  // ── 2. Fetch songs for this rehearsal ────────────────────────────────────────
  const { data: rawSongs } = await supabase
    .from('rehearsal_songs')
    .select('order_index, songs(id, title)')
    .eq('rehearsal_id', rehearsal_id)
    .order('order_index')

  const songs = (rawSongs ?? []).map((rs: { order_index: number; songs: { id: string; title: string } | null }) => ({
    title: rs.songs?.title ?? '?',
    order_index: rs.order_index,
  }))

  // ── 3. Fetch assigned choristers ─────────────────────────────────────────────
  const { data: rawChoristers, error: choristersErr } = await supabase
    .from('rehearsal_choristers')
    .select('id, rehearsal_id, profile_id, vocal_role, notified_email')
    .eq('rehearsal_id', rehearsal_id)

  if (choristersErr) {
    console.error('[NOTIFY] choristers fetch error', choristersErr)
    return NextResponse.json({ error: choristersErr.message }, { status: 500 })
  }

  type ChoristerRow = { id: string; rehearsal_id: string; profile_id: string; vocal_role: string; notified_email: boolean }
  const choristers = (rawChoristers ?? []) as ChoristerRow[]

  // ── 3b. Fetch la programmation du culte (responsables + affichage complet) ───
  const { data: rawProgramItems } = await supabase
    .from('service_program_items')
    .select('id, rehearsal_id, order_index, label, profile_id, external_name, external_email, external_phone, notified_email')
    .eq('rehearsal_id', rehearsal_id)
    .order('order_index')

  type ProgramItemRow = {
    id: string; rehearsal_id: string; order_index: number; label: string
    profile_id: string | null; external_name: string | null
    external_email: string | null; external_phone: string | null
    notified_email: boolean
  }
  const programItemRows = (rawProgramItems ?? []) as ProgramItemRow[]

  // Personnes en service = choristes ∪ responsables (internes + externes) de la programmation, sans doublon
  const internalProgramAssignees = programItemRows
    .filter((it): it is ProgramItemRow & { profile_id: string } => !!it.profile_id)
    .map(it => ({ profile_id: it.profile_id, label: it.label, item_id: it.id }))
  const externalProgramAssignees = programItemRows
    .filter((it): it is ProgramItemRow & { external_name: string } => !it.profile_id && !!it.external_name?.trim())
    .map(it => ({
      label: it.label,
      external_name: it.external_name,
      external_email: it.external_email,
      external_phone: it.external_phone,
      item_id: it.id,
    }))

  const servicePeople = mergeServiceRecipients(
    choristers.map(c => ({ profile_id: c.profile_id, vocal_role: c.vocal_role })),
    internalProgramAssignees,
    externalProgramAssignees,
  )

  if (!servicePeople.length) {
    return NextResponse.json({ sent: 0, skipped: 0, failed: 0, total: 0, message: 'Aucune personne en service', results: [] })
  }

  // ── 4. Fetch profiles (email addresses) ──────────────────────────────────────
  const profileIds = servicePeople.filter(p => p.profile_id).map(p => p.profile_id as string)
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)

  type ProfileRow = { id: string; full_name: string; email: string | null }
  const profileMap = new Map(((rawProfiles ?? []) as ProfileRow[]).map(p => [p.id, p]))

  // Affichage — toujours la liste complète pour tout le monde, quelle que soit la raison de l'envoi
  const allChoristersDisplay = choristers.map(c => ({
    full_name: profileMap.get(c.profile_id)?.full_name ?? '?',
    vocal_role: c.vocal_role,
  }))
  const programItemsDisplay = programItemRows.map(it => ({
    label: it.label,
    assignee_name: it.profile_id
      ? (profileMap.get(it.profile_id)?.full_name ?? null)
      : (it.external_name?.trim() || null),
  }))

  // ── 5. Send emails + mark notified ───────────────────────────────────────────
  const results: NotificationResult[] = []

  for (const person of servicePeople) {
    // ── Invité externe (pas de compte Supabase — aucun n'est créé) ──────────────
    if (!person.profile_id) {
      if (!person.external_email) {
        // Pas d'email — affiché dans la programmation, mais pas de notification, sans erreur
        console.info(`[NOTIFY] SKIP (externe, pas d'email) ${person.external_name}`)
        continue
      }

      const alreadyNotified = programItemRows
        .filter(it => person.program_item_ids.includes(it.id))
        .some(it => it.notified_email)

      const data: ExternalProgramNotificationData = {
        rehearsal: rehearsal as ExternalProgramNotificationData['rehearsal'],
        external: { name: person.external_name!, email: person.external_email, notified_email: alreadyNotified },
        label: person.role_labels.join(', '),
        publicUrl,
      }

      const result = await sendExternalProgramEmail(data)
      results.push(result)

      if (result.ok && !result.skipped && person.program_item_ids.length > 0) {
        const { error: updateErr } = await supabase
          .from('service_program_items')
          .update({ notified_email: true })
          .in('id', person.program_item_ids)
        if (updateErr) console.error(`[NOTIFY] failed to mark notified (externe) for ${person.external_name}`, updateErr)
      }
      continue
    }

    // ── Choriste et/ou responsable interne ──────────────────────────────────────
    const profile = profileMap.get(person.profile_id)
    const existingChorister = choristers.find(c => c.profile_id === person.profile_id)

    if (!profile) {
      console.warn(`[NOTIFY] profile not found for profile_id=${person.profile_id}`)
      results.push({ profile_id: person.profile_id, full_name: '?', ok: false, skipped: false, error: 'Profil introuvable', channel: 'email' })
      continue
    }

    const alreadyNotified = existingChorister
      ? existingChorister.notified_email
      : programItemRows.filter(it => person.program_item_ids.includes(it.id)).some(it => it.notified_email)

    const chorister = {
      id: existingChorister?.id ?? `program-${person.profile_id}`,
      profile_id: person.profile_id,
      vocal_role: person.role_labels.join(', '),
      notified_email: alreadyNotified,
    }

    const data: RehearsalNotificationData = {
      rehearsal: rehearsal as RehearsalNotificationData['rehearsal'],
      chorister,
      profile,
      songs,
      allChoristers: allChoristersDisplay,
      programItems: programItemsDisplay,
    }

    const result = await sendRehearsalEmail(data)
    results.push(result)

    // Mark as notified only on fresh success (not skipped)
    if (result.ok && !result.skipped) {
      if (existingChorister) {
        const { error: updateErr } = await supabase
          .from('rehearsal_choristers')
          .update({ notified_email: true })
          .eq('id', existingChorister.id)
        if (updateErr) console.error(`[NOTIFY] failed to mark notified (chorister) for ${profile.full_name}`, updateErr)
      }
      if (person.program_item_ids.length > 0) {
        const { error: updateErr } = await supabase
          .from('service_program_items')
          .update({ notified_email: true })
          .in('id', person.program_item_ids)
        if (updateErr) console.error(`[NOTIFY] failed to mark notified (programme) for ${profile.full_name}`, updateErr)
      }
    }
  }

  const sent    = results.filter(r => r.ok && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length
  const failed  = results.filter(r => !r.ok).length

  console.info(`[NOTIFY] rehearsal=${rehearsal_id} sent=${sent} skipped=${skipped} failed=${failed}`)

  return NextResponse.json({
    sent,
    skipped,
    failed,
    total: results.length,
    results,
  })
}
