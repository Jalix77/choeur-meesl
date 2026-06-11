import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'


function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const template = parseInt(request.nextUrl.searchParams.get('t') ?? '1')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, date_naissance')
    .eq('id', id)
    .single()

  const name = profile?.full_name ?? 'Membre'
  const date = profile?.date_naissance ? formatDate(profile.date_naissance) : ''
  const initials = getInitials(name)

  const W = 800
  const H = 600

  // ── Template 1 : MEESL brun & doré ────────────────────────────────────────
  if (template === 1) {
    return new ImageResponse(
      <div
        style={{
          width: W, height: H,
          background: 'linear-gradient(135deg, #5A3318 0%, #7A4A20 50%, #3D1F0A 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'serif', position: 'relative',
        }}
      >
        {/* Gold bottom bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #B87333, #E2B36A, #B87333)' }} />
        {/* Church name */}
        <div style={{ color: '#E2B36A', opacity: 0.7, fontSize: 12, letterSpacing: '0.3em', marginBottom: 12, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Chœur de Louange MEESL
        </div>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: 40, border: '2px solid #E2B36A',
          background: '#E2B36A22', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#E2B36A', fontSize: 28, fontWeight: 'bold', marginBottom: 16,
        }}>
          {initials}
        </div>
        <div style={{ color: '#E2B36A', opacity: 0.8, fontSize: 13, letterSpacing: '0.3em', marginBottom: 8, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Joyeux Anniversaire
        </div>
        <div style={{ color: '#F5E6C8', fontSize: 42, fontWeight: 'bold', marginBottom: 8 }}>{name}</div>
        <div style={{ color: '#E2B36A', fontSize: 18, marginBottom: 24 }}>🎂 {date}</div>
        <div style={{ color: '#E2B36A', opacity: 0.85, fontSize: 16, textAlign: 'center', lineHeight: 1.6, maxWidth: 480 }}>
          Que Dieu vous accorde grâce, santé, paix et succès{'\n'}durant cette nouvelle année de vie.
        </div>
        <div style={{ color: '#E2B36A', fontSize: 24, marginTop: 20 }}>✝ 🎶 🎂</div>
      </div>,
      { width: W, height: H }
    )
  }

  // ── Template 2 : Or & Blanc ────────────────────────────────────────────────
  if (template === 2) {
    return new ImageResponse(
      <div
        style={{
          width: W, height: H,
          background: 'linear-gradient(160deg, #FFFDF5 0%, #FFF8E0 50%, #FFFDF5 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'serif', position: 'relative',
          border: '2px solid #C9A227',
        }}
      >
        {/* Corner ornaments */}
        {(['top:20px;left:20px', 'top:20px;right:20px', 'bottom:20px;left:20px', 'bottom:20px;right:20px'] as const).map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: pos.includes('top') ? 20 : undefined,
            bottom: pos.includes('bottom') ? 20 : undefined,
            left: pos.includes('left') ? 20 : undefined,
            right: pos.includes('right') ? 20 : undefined,
            color: '#C9A227', fontSize: 28,
          }}>❋</div>
        ))}
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎊</div>
        <div style={{ color: '#C9A227', fontSize: 12, letterSpacing: '0.4em', marginBottom: 8, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Joyeux Anniversaire
        </div>
        <div style={{ color: '#5A3318', fontSize: 46, fontWeight: 'bold', marginBottom: 8 }}>{name}</div>
        <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #C9A227, transparent)', marginBottom: 16 }} />
        <div style={{ color: '#B87333', fontSize: 18, marginBottom: 20 }}>🎂 {date}</div>
        <div style={{ color: '#7A4A20', fontSize: 16, textAlign: 'center', lineHeight: 1.6, maxWidth: 480 }}>
          Que Dieu vous bénisse abondamment et vous accorde{'\n'}une nouvelle année remplie de grâce, de paix et de succès.
        </div>
        <div style={{ color: '#C9A227', opacity: 0.7, fontSize: 11, letterSpacing: '0.3em', marginTop: 20, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Chœur de Louange MEESL
        </div>
      </div>,
      { width: W, height: H }
    )
  }

  // ── Template 3 : Musical ───────────────────────────────────────────────────
  if (template === 3) {
    return new ImageResponse(
      <div
        style={{
          width: W, height: H,
          background: 'linear-gradient(135deg, #0F1923 0%, #1a2a3a 50%, #0d1822 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'serif', position: 'relative',
        }}
      >
        {/* Staff lines */}
        {[0.7, 0.73, 0.76, 0.79, 0.82].map((pct, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${pct * 100}%`, height: 1,
            background: '#E2B36A', opacity: 0.08,
          }} />
        ))}
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎵</div>
        <div style={{ color: '#E2B36A', opacity: 0.7, fontSize: 12, letterSpacing: '0.35em', marginBottom: 8, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Joyeux Anniversaire
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 42, fontWeight: 'bold', marginBottom: 8 }}>{name}</div>
        <div style={{ color: '#E2B36A', fontSize: 22, marginBottom: 16, letterSpacing: '0.2em' }}>♩ ♪ ♫ ♬ ♫ ♪ ♩</div>
        <div style={{ color: '#E2B36A', fontSize: 18, marginBottom: 20 }}>{date}</div>
        <div style={{ color: '#E2B36A', opacity: 0.75, fontSize: 16, textAlign: 'center', lineHeight: 1.6, maxWidth: 480 }}>
          Que votre vie soit une symphonie de bénédictions{'\n'}et que Dieu vous comble de sa grâce.
        </div>
        <div style={{ color: '#E2B36A', opacity: 0.5, fontSize: 11, letterSpacing: '0.3em', marginTop: 20, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
          Chœur de Louange MEESL
        </div>
      </div>,
      { width: W, height: H }
    )
  }

  // ── Template 4 : Chrétien ──────────────────────────────────────────────────
  return new ImageResponse(
    <div
      style={{
        width: W, height: H,
        background: 'linear-gradient(160deg, #2D1B4E 0%, #4A2C7A 50%, #1E1238 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'serif', position: 'relative',
      }}
    >
      {/* Cross */}
      <div style={{ position: 'relative', width: 50, height: 60, marginBottom: 16 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 6, height: 60, background: '#F5C842', marginLeft: -3, borderRadius: 3 }} />
        <div style={{ position: 'absolute', left: '50%', top: 14, width: 36, height: 6, background: '#F5C842', marginLeft: -18, borderRadius: 3 }} />
      </div>
      <div style={{ color: '#F5C842', opacity: 0.8, fontSize: 12, letterSpacing: '0.35em', marginBottom: 8, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
        Joyeux Anniversaire
      </div>
      <div style={{ color: '#FFFFFF', fontSize: 42, fontWeight: 'bold', marginBottom: 8 }}>{name}</div>
      <div style={{ width: 80, height: 1, background: '#F5C84255', marginBottom: 16 }} />
      <div style={{ color: '#F5C842', fontSize: 18, marginBottom: 20 }}>🎂 {date}</div>
      <div style={{ color: '#E0C8FF', opacity: 0.9, fontSize: 15, textAlign: 'center', lineHeight: 1.7, maxWidth: 480, fontStyle: 'italic' }}>
        « Car je connais les projets que j&apos;ai formés sur vous,{'\n'}
        des projets de paix et non de malheur,{'\n'}
        pour vous donner un avenir. »
      </div>
      <div style={{ color: '#F5C842', opacity: 0.6, fontSize: 13, marginTop: 8 }}>Jérémie 29:11</div>
      <div style={{ color: '#F5C842', opacity: 0.5, fontSize: 11, letterSpacing: '0.3em', marginTop: 16, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
        Chœur de Louange MEESL
      </div>
    </div>,
    { width: W, height: H }
  )
}
