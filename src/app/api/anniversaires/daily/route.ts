/**
 * Cron job — runs every day at 7:00 AM (UTC-5 Haiti time = 12:00 UTC)
 * Triggered by Vercel cron: "0 12 * * *"
 *
 * Checks for birthdays today → sends a summary email to admin(s).
 * Also marks each birthday member as notified in birthday_notifications.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM = 'Chœur de Louange MEESL <noreply@egliseevangeliqueseletlumiere.org>'

async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Resend error')
  }
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}


export async function GET(request: NextRequest) {
  // Security: only Vercel cron or requests with the cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin  = createAdminClient()
  const today  = new Date()
  const month  = today.getMonth() + 1
  const day    = today.getDate()
  const year   = today.getFullYear()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://choeur-meesl.vercel.app'

  // Fetch all active profiles with birthdays today (any year)
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, date_naissance, email')
    .eq('active', true)
    .not('date_naissance', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const todayBirthdays = (profiles ?? []).filter(p => {
    if (!p.date_naissance) return false
    const [, m, d] = p.date_naissance.split('-')
    return parseInt(m) === month && parseInt(d) === day
  })

  if (todayBirthdays.length === 0) {
    return NextResponse.json({ ok: true, count: 0, message: 'Aucun anniversaire aujourd\'hui.' })
  }

  // Fetch admin emails
  const { data: admins } = await admin
    .from('profiles')
    .select('email')
    .eq('role', 'admin')
    .eq('active', true)
    .not('email', 'is', null)

  const adminEmails = (admins ?? []).map((a: { email: string | null }) => a.email).filter(Boolean) as string[]

  if (adminEmails.length === 0) {
    return NextResponse.json({ ok: false, message: 'Aucun admin avec email.' })
  }

  // Build member list HTML
  const memberListHtml = todayBirthdays.map(p => {
    const date     = formatDate(p.date_naissance!)
    const cardUrl  = `${origin}/anniversaire/${p.id}`
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #E2B36A33;">
          <strong style="color:#5A3318;">${p.full_name}</strong>
          <br><span style="color:#B87333;font-size:13px;font-family:Arial,sans-serif;">🎂 ${date}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #E2B36A33;text-align:right;">
          <a href="${cardUrl}"
            style="background:#B87333;color:#fff;text-decoration:none;padding:6px 14px;border-radius:6px;font-size:12px;font-family:Arial,sans-serif;">
            Voir carte
          </a>
        </td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FBF6EC;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:linear-gradient(135deg,#5A3318,#7A4A20);padding:28px 24px;text-align:center;">
    <p style="color:#E2B36A;font-size:11px;letter-spacing:0.3em;margin:0 0 6px;text-transform:uppercase;font-family:Arial,sans-serif;">
      Chœur de Louange
    </p>
    <h1 style="color:#F5E6C8;font-size:26px;margin:0;">MEESL</h1>
  </div>

  <div style="padding:28px 24px;">
    <h2 style="color:#5A3318;font-size:20px;margin:0 0 8px;font-family:Arial,sans-serif;">
      🎂 Anniversaires du jour
    </h2>
    <p style="color:#7A4A20;font-size:14px;margin:0 0 20px;font-family:Arial,sans-serif;">
      ${todayBirthdays.length} membre${todayBirthdays.length > 1 ? 's célèbrent leur' : ' célèbre son'} anniversaire aujourd'hui.
    </p>

    <table style="width:100%;border-collapse:collapse;border:1px solid #E2B36A44;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#FBF6EC;">
          <th style="text-align:left;padding:10px 16px;font-size:11px;color:#B87333;text-transform:uppercase;font-family:Arial,sans-serif;letter-spacing:0.05em;">Membre</th>
          <th style="padding:10px 16px;font-size:11px;color:#B87333;text-transform:uppercase;font-family:Arial,sans-serif;"></th>
        </tr>
      </thead>
      <tbody>${memberListHtml}</tbody>
    </table>

    <div style="margin-top:24px;padding:16px;background:#FBF6EC;border-radius:8px;border-left:3px solid #B87333;">
      <p style="margin:0;font-size:14px;color:#5A3318;font-family:Arial,sans-serif;">
        Pensez à envoyer un message de félicitations à chacun de ces membres.
        Vous pouvez générer et partager une carte depuis l&apos;application.
      </p>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${origin}/anniversaires"
        style="background:#B87333;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">
        Voir tous les anniversaires →
      </a>
    </div>
  </div>

  <div style="background:#5A3318;padding:16px 24px;text-align:center;">
    <p style="color:#E2B36A;font-size:11px;margin:0;font-family:Arial,sans-serif;opacity:0.8;">
      Chœur de Louange MEESL · Delmas 48, Port-au-Prince, Haïti
    </p>
  </div>
</div>
</body>
</html>`

  // Send to all admins
  try {
    await sendEmail(
      adminEmails,
      `🎂 Anniversaires du ${day.toString().padStart(2,'0')}/${month.toString().padStart(2,'0')} — ${todayBirthdays.length} membre${todayBirthdays.length > 1 ? 's' : ''}`,
      html,
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur envoi email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Log notifications
  for (const p of todayBirthdays) {
    await admin
      .from('birthday_notifications')
      .upsert(
        { profile_id: p.id, year, email_sent: true, notified_at: new Date().toISOString() },
        { onConflict: 'profile_id,year', ignoreDuplicates: false }
      )
  }

  return NextResponse.json({ ok: true, count: todayBirthdays.length, sent_to: adminEmails })
}
