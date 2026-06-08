'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    if (data.user) {
      // Check active status
      const { data: profile } = await supabase
        .from('profiles')
        .select('active')
        .eq('id', data.user.id)
        .single();

      if (!profile?.active) {
        await supabase.auth.signOut();
        setError('Compte désactivé, contactez un administrateur.');
        setLoading(false);
        return;
      }
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF6EC] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-meesl.png" alt="Logo MEESL" width={80} height={80} className="object-contain" />
          </div>
          <h1 className="font-cinzel text-xl font-bold text-[#5A3318] uppercase tracking-widest leading-tight">
            Mission Église Évangélique<br />Sel et Lumière
          </h1>
          <p className="font-cormorant italic text-[#B87333] text-base mt-1">
            Prêcher, instruire et desservir la communauté !
          </p>
          <div className="mt-3 h-px bg-[#E2B36A] w-3/4 mx-auto" />
          <p className="font-cinzel text-sm text-[#B87333] uppercase tracking-widest mt-3">
            Chœur de Louange
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl shadow-sm p-8">
          <h2 className="font-cinzel text-lg font-semibold text-[#5A3318] mb-6 text-center">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5A3318] mb-1" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5A3318] mb-1" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-[#E2B36A]/60 rounded-lg px-3 py-2 bg-[#FBF6EC] text-[#5A3318] focus:outline-none focus:ring-2 focus:ring-[#B87333]/50 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B87333] hover:bg-[#9A6128] text-white font-cinzel font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 tracking-wide"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#B87333]/70 mt-6 font-cormorant">
          4, Delmas 48 · Port-au-Prince · meesl1410@gmail.com
        </p>
      </div>
    </div>
  );
}
