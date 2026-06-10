import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM = 'Chœur de Louange MEESL <noreply@egliseevangeliqueseletlumiere.org>'

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
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

function buildBirthdayEmailHtml(name: string, date: string, template: number, profileId: string, origin: string): string {
  const cardUrl = `${origin}/anniversaire/${profileId}?t=${template}`
  const imageUrl = `${origin}/api/anniversaires/card/${profileId}?t=${template}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Joyeux Anniversaire — ${name}</title>
</head>
<body style="margin:0;padding:0;background:#FBF6EC;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#5A3318,#7A4A20);padding:32px 24px;text-align:center;">
    <p style="color:#E2B36A;font-size:11px;letter-spacing:0.3em;margin:0 0 8px;text-transform:uppercase;font-family:Arial,sans-serif;">
      Chœur de Louange
    </p>
    <h1 style="color:#F5E6C8;font-size:28px;margin:0;letter-spacing:0.05em;">MEESL</h1>
    <p style="color:#E2B36A;font-size:11px;margin:8px 0 0;font-family:Arial,sans-serif;opacity:0.7;">
      Mission Église Évangélique Sel et Lumière
    </p>
    <div style="height:2px;background:linear-gradient(90deg,transparent,#E2B36A,transparent);margin-top:20px;"></div>
  </div>

  <!-- Birthday banner -->
  <div style="background:#FBF6EC;padding:32px 24px;text-align:center;border-bottom:1px solid #E2B36A33;">
    <div style="font-size:48px;margin-bottom:12px;">🎂</div>
    <h2 style="color:#5A3318;font-size:22px;margin:0 0 8px;font-family:Arial,sans-serif;">Joyeux Anniversaire</h2>
    <p style="color:#B87333;font-size:28px;font-weight:bold;margin:0 0 4px;">${name}</p>
    <p style="color:#7A4A20;font-size:14px;margin:0;font-family:Arial,sans-serif;">🎂 ${date}</p>
  </div>

  <!-- Card image -->
  <div style="padding:24px;text-align:center;">
    <a href="${cardUrl}" style="display:inline-block;">
      <img src="${imageUrl}" alt="Carte anniversaire" width="560"
        style="max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(90,51,24,0.2);" />
    </a>
  </div>

  <!-- Message -->
  <div style="padding:0 32px 32px;text-align:center;">
    <p style="color:#5A3318;font-size:16px;line-height:1.7;margin:0 0 16px;">
      La famille <strong>Sel &amp; Lumière</strong> vous souhaite un très joyeux anniversaire.<br>
      Que Dieu vous accorde <em>grâce, santé, paix et succès</em><br>
      durant cette nouvelle année de vie.
    </p>

    <!-- CTA button -->
    <a href="${cardUrl}"
      style="display:inline-block;background:#B87333;color:#fff;text-decoration:none;
             padding:12px 28px;border-radius:8px;font-family:Arial,sans-serif;
             font-size:14px;font-weight:bold;margin:8px 0 24px;">
      Voir votre carte d&apos;anniversaire →
    </a>

    <div style="width:60px;height:1px;background:#E2B36A;margin:0 auto 20px;"></div>
    <p style="color:#B87333;font-size:18px;margin:0;">✝ 🎶 🎂</p>
  </div>

  <!-- Footer -->
  <div style="background:#5A3318;padding:20px 24px;text-align:center;">
    <p style="color:#E2B36A;font-size:11px;margin:0;font-family:Arial,sans-serif;opacity:0.8;">
      Chœur de Louange MEESL · Delmas 48, Port-au-Prince, Haïti<br>
      egliseevangeliqueseletlumiere.org
    </p>
  </div>

</div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  // Verify caller is authenticated
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { profileId, template = 1 } = await request.json()
  if (!profileId) return NextResponse.json({ error: 'profileId requis' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch birthday member
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('full_name, date_naissance, email')
    .eq('id', profileId)
    .single()

  if (pErr || !profile) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  if (!profile.email) return NextResponse.json({ error: 'Ce membre n\'a pas d\'adresse email.' }, { status: 400 })
  if (!profile.date_naissance) return NextResponse.json({ error: 'Ce membre n\'a pas de date de naissance.' }, { status: 400 })

  const origin  = request.nextUrl.origin
  const date    = formatDate(profile.date_naissance)
  const html    = buildBirthdayEmailHtml(profile.full_name, date, template, profileId, origin)

  try {
    await sendEmail(profile.email, `🎂 Joyeux anniversaire, ${profile.full_name} !`, html)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur envoi email'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Log in birthday_notifications (upsert for this year)
  const year = new Date().getFullYear()
  await admin
    .from('birthday_notifications')
    .upsert(
      { profile_id: profileId, year, email_sent: true, notified_at: new Date().toISOString() },
      { onConflict: 'profile_id,year', ignoreDuplicates: false }
    )

  return NextResponse.json({ ok: true })
}
