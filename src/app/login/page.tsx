'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError('Email ou mot de passe incorrect.')
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if account is active
        const { data: profile } = await supabase
          .from('profiles')
          .select('active')
          .eq('id', data.user.id)
          .single()

        if (!profile?.active) {
          await supabase.auth.signOut()
          setError('Compte désactivé, contactez un administrateur.')
          setLoading(false)
          return
        }
      }

      // Hard redirect — ensures middleware sees the fresh session cookie
      window.location.href = '/'
    } catch (err) {
      console.error('Login error:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
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
        <h2 className="font-cinzel text-xl text-[#5A3318] text-center mb-6">Connexion</h2>

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
          <div>
            <label className="block text-sm font-semibold text-[#5A3318] mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/40"
              placeholder="••••••••"
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
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-[#B87333]/70 space-y-1">
        <p>4, Delmas 48 · Port-au-Prince, Haïti</p>
        <p>meesl1410@gmail.com · (509) 37 97 1717 · (509) 33 16 6621</p>
      </footer>
    </div>
  )
}
