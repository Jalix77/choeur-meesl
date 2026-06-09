import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// Helper: verify caller is admin
async function getCallerRole() {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role ?? null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) + ' a ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

type ChoristerRow = { id: string; rehearsal_id: string; profile_id: string; vocal_role: string; notified_email: boolean }
type ProfileRow = { id: string; full_name: string; email: string | null }

export async function POST(request: NextRequest) {
  const role = await getCallerRole()
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 })
  }

  const { rehearsal_id } = await request.json()
  if (!rehearsal_id) {
    return NextResponse.json({ error: 'rehearsal_id requis' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: rehearsal } = await supabase
    .from('rehearsals')
    .select('id, title, starts_at, location, notes')
    .eq('id', rehearsal_id)
    .single()

  if (!rehearsal) return NextResponse.json({ error: 'Repetition introuvable' }, { status: 404 })

  const { data: rawChoristers } = await supabase
    .from('rehearsal_choristers')
    .select('id, rehearsal_id, profile_id, vocal_role, notified_email')
    .eq('rehearsal_id', rehearsal_id)

  const choristers = (rawChoristers ?? []) as ChoristerRow[]

  if (!choristers.length) {
    return NextResponse.json({ sent: 0, message: 'Aucun choriste selectionne' })
  }

  const profileIds = choristers.map(c => c.profile_id)
  const { data: rawProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)

  const profiles = (rawProfiles ?? []) as ProfileRow[]
  const emailMap = new Map(profiles.map(p => [p.id, p]))

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Choeur de Louange MEESL <noreply@meesl.org>'
  const dateStr = formatDate(rehearsal.starts_at)
  const results: { id: string; ok: boolean; error?: string }[] = []

  for (const chorister of choristers) {
    const profile = emailMap.get(chorister.profile_id)
    if (!profile?.email) {
      results.push({ id: chorister.profile_id, ok: false, error: 'Pas de courriel' })
      continue
    }

    const subject = 'Nouvelle repetition - Choeur de Louange MEESL'
    const body = `Bonjour ${profile.full_name},\n\nVous etes selectionne(e) pour servir avec le Choeur de Louange.\n\nDetails :\nDate et heure : ${dateStr}\nLieu : ${rehearsal.location ?? 'A confirmer'}\nRole : ${chorister.vocal_role}\nNotes : ${rehearsal.notes ?? '—'}\n\nMerci de confirmer votre disponibilite aupres du responsable du choeur.\n\nMission Eglise Evangelique Sel et Lumiere\nChoeur de Louange`

    if (!apiKey) {
      console.log(`[EMAIL SIMULE] To: ${profile.email}\nSubject: ${subject}\n${body}`)
      results.push({ id: chorister.profile_id, ok: true })
      continue
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [profile.email], subject, text: body }),
      })
      if (res.ok) {
        await supabase
          .from('rehearsal_choristers')
          .update({ notified_email: true })
          .eq('id', chorister.id)
        results.push({ id: chorister.profile_id, ok: true })
      } else {
        const err = await res.json()
        results.push({ id: chorister.profile_id, ok: false, error: JSON.stringify(err) })
      }
    } catch (e) {
      results.push({ id: chorister.profile_id, ok: false, error: String(e) })
    }
  }

  return NextResponse.json({ sent: results.filter(r => r.ok).length, total: results.length, results })
}
