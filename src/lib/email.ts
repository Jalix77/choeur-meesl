/**
 * MEESL Chœur de Louange — Email notification helper
 *
 * Uses Resend as the delivery provider.
 * Set RESEND_API_KEY + EMAIL_FROM in environment variables.
 *
 * Future hook: exportNotificationPayload() is also exported so a WhatsApp
 * adapter can consume the same structured data without duplicating logic.
 */

export interface RehearsalNotificationData {
  rehearsal: {
    id: string
    title: string | null
    starts_at: string
    location: string | null
    notes: string | null
  }
  chorister: {
    id: string          // rehearsal_choristers.id
    profile_id: string
    vocal_role: string
    notified_email: boolean
  }
  profile: {
    id: string
    full_name: string
    email: string | null
  }
  songs: { title: string; order_index: number }[]
}

export interface NotificationResult {
  profile_id: string
  full_name: string
  ok: boolean
  skipped: boolean   // already notified
  error?: string
  channel: 'email' | 'whatsapp'
}

// ─── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Payload builder (reusable for WhatsApp / other channels) ─────────────────

export function buildNotificationPayload(data: RehearsalNotificationData) {
  const { rehearsal, chorister, profile, songs } = data
  const date = fmtDate(rehearsal.starts_at)
  const time = fmtTime(rehearsal.starts_at)
  const location = rehearsal.location ?? 'À confirmer'
  const notes = rehearsal.notes ?? '—'
  const role = chorister.vocal_role
  const title = rehearsal.title ? `${rehearsal.title} — ` : ''
  const songList = songs.length
    ? songs
        .sort((a, b) => a.order_index - b.order_index)
        .map((s, i) => `  ${i + 1}. ${s.title}`)
        .join('\n')
    : '  (aucun chant listé)'

  const subject = `[Chœur de Louange] ${title}Nouvelle répétition`

  const textBody = [
    `Bonjour ${profile.full_name},`,
    '',
    'Vous êtes assigné(e) au service du Chœur de Louange MEESL.',
    '',
    '── Détails de la répétition ──────────────',
    `Date     : ${date}`,
    `Heure    : ${time}`,
    `Lieu     : ${location}`,
    `Rôle     : ${role}`,
    `Notes    : ${notes}`,
    '',
    '── Chants au programme ──────────────────',
    songList,
    '',
    '─────────────────────────────────────────',
    'Merci de confirmer votre disponibilité auprès du responsable du chœur.',
    '',
    'Mission Église Évangélique Sel et Lumière',
    'Chœur de Louange · 4, Delmas 48 · Port-au-Prince, Haïti',
    'meesl1410@gmail.com · (509) 37 97 1717',
  ].join('\n')

  const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5efe3;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe3;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(90,51,24,.12);">

  <!-- Header -->
  <tr>
    <td style="background:#5A3318;padding:28px 36px;">
      <p style="margin:0;font-family:'Palatino Linotype',serif;font-size:22px;font-weight:700;color:#E2B36A;letter-spacing:1px;">
        Chœur de Louange
      </p>
      <p style="margin:4px 0 0;font-size:12px;color:#c9a46a;letter-spacing:2px;text-transform:uppercase;">
        Mission Église Évangélique Sel et Lumière
      </p>
    </td>
  </tr>

  <!-- Title band -->
  <tr>
    <td style="background:#B87333;padding:14px 36px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:.5px;">
        ${title}Nouvelle répétition
      </p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:32px 36px;">
      <p style="margin:0 0 20px;font-size:15px;color:#3d1f09;">
        Bonjour <strong>${profile.full_name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#5A3318;line-height:1.6;">
        Vous êtes assigné(e) au service du Chœur de Louange MEESL.<br>
        Voici les détails de la prochaine répétition.
      </p>

      <!-- Details table -->
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#FBF6EC;border:1px solid #E2B36A;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr style="border-bottom:1px solid #E2B36A40;">
          <td style="padding:10px 16px;font-size:12px;color:#B87333;font-weight:700;text-transform:uppercase;width:30%;">Date</td>
          <td style="padding:10px 16px;font-size:14px;color:#3d1f09;">${date}</td>
        </tr>
        <tr style="border-bottom:1px solid #E2B36A40;background:#fff;">
          <td style="padding:10px 16px;font-size:12px;color:#B87333;font-weight:700;text-transform:uppercase;">Heure</td>
          <td style="padding:10px 16px;font-size:14px;color:#3d1f09;">${time}</td>
        </tr>
        <tr style="border-bottom:1px solid #E2B36A40;">
          <td style="padding:10px 16px;font-size:12px;color:#B87333;font-weight:700;text-transform:uppercase;">Lieu</td>
          <td style="padding:10px 16px;font-size:14px;color:#3d1f09;">${location}</td>
        </tr>
        <tr style="border-bottom:1px solid #E2B36A40;background:#fff;">
          <td style="padding:10px 16px;font-size:12px;color:#B87333;font-weight:700;text-transform:uppercase;">Rôle</td>
          <td style="padding:10px 16px;font-size:14px;color:#3d1f09;font-weight:600;">${role}</td>
        </tr>
        ${notes !== '—' ? `
        <tr>
          <td style="padding:10px 16px;font-size:12px;color:#B87333;font-weight:700;text-transform:uppercase;">Notes</td>
          <td style="padding:10px 16px;font-size:14px;color:#3d1f09;font-style:italic;">${notes}</td>
        </tr>` : ''}
      </table>

      ${songs.length ? `
      <!-- Songs -->
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#B87333;text-transform:uppercase;letter-spacing:1px;">
        Chants au programme
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#FBF6EC;border:1px solid #E2B36A;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${songs
          .sort((a, b) => a.order_index - b.order_index)
          .map((s, i) => `
          <tr style="${i % 2 === 0 ? '' : 'background:#fff;'}border-bottom:1px solid #E2B36A30;">
            <td style="padding:8px 16px;font-size:13px;color:#B87333;width:28px;">${i + 1}.</td>
            <td style="padding:8px 16px;font-size:14px;color:#3d1f09;">${s.title}</td>
          </tr>`)
          .join('')}
      </table>` : ''}

      <p style="margin:0;font-size:13px;color:#7A4A20;line-height:1.7;border-top:1px solid #E2B36A;padding-top:20px;">
        Merci de confirmer votre disponibilité auprès du responsable du chœur.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#FBF6EC;border-top:2px solid #B87333;padding:18px 36px;">
      <p style="margin:0;font-size:11px;color:#B87333;line-height:1.8;">
        <strong>Mission Église Évangélique Sel et Lumière</strong><br>
        4, Delmas 48 · Port-au-Prince, Haïti<br>
        meesl1410@gmail.com · (509) 37 97 1717 · (509) 33 16 6621
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`

  return { subject, textBody, htmlBody }
}

// ─── WhatsApp payload builder (future hook) ───────────────────────────────────

export function buildWhatsAppMessage(data: RehearsalNotificationData): string {
  const { rehearsal, chorister, profile, songs } = data
  const date = fmtDate(rehearsal.starts_at)
  const time = fmtTime(rehearsal.starts_at)
  const location = rehearsal.location ?? 'À confirmer'
  const songList = songs.length
    ? songs
        .sort((a, b) => a.order_index - b.order_index)
        .map((s, i) => `  ${i + 1}. ${s.title}`)
        .join('\n')
    : ''

  return [
    `Bonjour ${profile.full_name} 👋`,
    '',
    `*Chœur de Louange MEESL*`,
    `Vous êtes en service — rôle : *${chorister.vocal_role}*`,
    '',
    `📅 ${date} à ${time}`,
    `📍 ${location}`,
    songList ? `\n🎵 Chants :\n${songList}` : '',
    '',
    '_Merci de confirmer votre présence._',
  ].filter(l => l !== undefined).join('\n')
}

// ─── Email sender ─────────────────────────────────────────────────────────────

export async function sendRehearsalEmail(
  data: RehearsalNotificationData
): Promise<NotificationResult> {
  const { profile, chorister } = data
  const channel = 'email' as const

  if (!profile.email) {
    console.warn(`[EMAIL] SKIP ${profile.full_name} — no email address`)
    return { profile_id: profile.id, full_name: profile.full_name, ok: false, skipped: false, error: 'Pas de courriel', channel }
  }

  if (chorister.notified_email) {
    console.info(`[EMAIL] SKIP ${profile.full_name} <${profile.email}> — already notified`)
    return { profile_id: profile.id, full_name: profile.full_name, ok: true, skipped: true, channel }
  }

  const { subject, textBody, htmlBody } = buildNotificationPayload(data)
  const from = process.env.EMAIL_FROM || 'Chœur de Louange MEESL <noreply@egliseevangeliqueseletlumiere.org>'
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Dev / staging fallback — log to console, treat as success
    console.log(`[EMAIL SIMULATED]`)
    console.log(`  To     : ${profile.email}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body   :\n${textBody}`)
    return { profile_id: profile.id, full_name: profile.full_name, ok: true, skipped: false, channel }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    })

    if (res.ok) {
      const resData = await res.json()
      console.info(`[EMAIL] OK  ${profile.full_name} <${profile.email}> id=${resData.id}`)
      return { profile_id: profile.id, full_name: profile.full_name, ok: true, skipped: false, channel }
    } else {
      const errData = await res.json().catch(() => ({ message: res.statusText }))
      const errMsg = errData?.message ?? JSON.stringify(errData)
      console.error(`[EMAIL] FAIL ${profile.full_name} <${profile.email}> — ${errMsg}`)
      return { profile_id: profile.id, full_name: profile.full_name, ok: false, skipped: false, error: errMsg, channel }
    }
  } catch (err) {
    const errMsg = String(err)
    console.error(`[EMAIL] ERR ${profile.full_name} — ${errMsg}`)
    return { profile_id: profile.id, full_name: profile.full_name, ok: false, skipped: false, error: errMsg, channel }
  }
}
