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
import { sendRehearsalEmail, type RehearsalNotificationData, type NotificationResult } from '@/lib/email'

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
    .select('id, title, starts_at, location, notes')
    .eq('id', rehearsal_id)
    .single()

  if (rehearsalErr || !rehearsal) {
    console.error('[NOTIFY] rehearsal not found', rehearsalErr)
    return NextResponse.json({ error: 'Répétition introuvable' }, { status: 404 })
  }

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

  if (!choristers.length) {
    return NextResponse.json({ sent: 0, skipped: 0, failed: 0, total: 0, message: 'Aucun choriste assigné', results: [] })
  }

  // ── 4. Fetch profiles (email addresses) ──────────────────────────────────────
  const profileIds = choristers.map(c => c.profile_id)
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)

  type ProfileRow = { id: string; full_name: string; email: string | null }
  const profileMap = new Map(((rawProfiles ?? []) as ProfileRow[]).map(p => [p.id, p]))

  // ── 5. Send emails + mark notified ───────────────────────────────────────────
  const results: NotificationResult[] = []

  for (const chorister of choristers) {
    const profile = profileMap.get(chorister.profile_id)

    if (!profile) {
      console.warn(`[NOTIFY] profile not found for profile_id=${chorister.profile_id}`)
      results.push({ profile_id: chorister.profile_id, full_name: '?', ok: false, skipped: false, error: 'Profil introuvable', channel: 'email' })
      continue
    }

    const data: RehearsalNotificationData = {
      rehearsal: rehearsal as RehearsalNotificationData['rehearsal'],
      chorister,
      profile,
      songs,
    }

    const result = await sendRehearsalEmail(data)
    results.push(result)

    // Mark as notified only on fresh success (not skipped)
    if (result.ok && !result.skipped) {
      const { error: updateErr } = await supabase
        .from('rehearsal_choristers')
        .update({ notified_email: true })
        .eq('id', chorister.id)

      if (updateErr) {
        console.error(`[NOTIFY] failed to mark notified for ${profile.full_name}`, updateErr)
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
