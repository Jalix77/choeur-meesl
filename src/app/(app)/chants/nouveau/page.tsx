import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SongForm from '@/components/SongForm'
import type { Profile } from '@/lib/database.types'

export default async function NewSongPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if ((profile as Pick<Profile, 'role'> | null)?.role !== 'admin') redirect('/')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Nouveau chant</h1>
        <p className="text-sm text-[#B87333] mt-1">Remplissez les informations du chant</p>
      </div>
      <div className="bg-white/60 border border-[#E2B36A]/40 rounded-xl p-5 shadow-sm">
        <SongForm />
      </div>
    </div>
  )
}
