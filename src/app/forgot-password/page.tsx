'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (err) {
        // Don't expose whether the account exists — always show success
        console.error('[FORGOT-PASSWORD]', err.message)
      }

      // Always show success to prevent account enumeration
      setDone(true)
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error('[FORGOT-PASSWORD]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF6EC] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image src="/logo-meesl.png" alt="MEESL Logo" width={80} height={80} className="object-contain" />
        </div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318] tracking-wide">
          Mission Église Évangélique Sel et Lumière
        </h1>
        <p className="font-cormorant italic text-[#B87333] text-lg mt-1">
          Prêcher, instruire et desservir la communauté !
        </p>
        <div className="mt-3 inline-block px-4 py-1 bg-[#B87333] rounded">
          <span className="font-cinzel text-white text-sm tracking-widest">CHŒUR DE LOUANGE</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/60 backdrop-blur border border-[#E2B36A]/40 rounded-xl shadow-lg p-8">
        <h2 className="font-cinzel text-xl text-[#5A3318] text-center mb-2">Mot de passe oublié</h2>
        <p className="text-sm text-[#7A4A20] text-center mb-6">
          Saisissez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-5 text-center space-y-3">
            <div className="text-3xl">✉️</div>
            <p className="text-sm font-semibold text-green-800">
              Si ce compte existe, un lien de réinitialisation a été envoyé.
            </p>
            <p className="text-xs text-green-700">
              Vérifiez votre boîte de réception et vos courriers indésirables.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#5A3318] mb-1">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
                placeholder="vous@exemple.com"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B87333] hover:bg-[#5A3318] text-white font-cinzel tracking-wide py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <div className="text-center mt-5">
          <a href="/login" className="text-xs text-[#B87333]/70 hover:text-[#B87333] hover:underline">
            ← Retour à la connexion
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-[#B87333]/70 space-y-1">
        <p>4, Delmas 48 · Port-au-Prince, Haïti</p>
        <p>meesl1410@gmail.com · (509) 37 97 1717 · (509) 33 16 6621</p>
      </footer>
    </div>
  )
}
