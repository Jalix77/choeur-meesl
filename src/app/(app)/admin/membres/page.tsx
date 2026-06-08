import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import MemberManager from '@/components/MemberManager'

export default async function MembresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as Pick<Profile, 'role'> | null)?.role !== 'admin') redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  // Get emails from auth — we'll display what we have in profiles
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Gestion des membres</h1>
        <p className="text-sm text-[#B87333] mt-1">Comptes choristes autorisés</p>
      </div>

      <MemberManager profiles={(profiles ?? []) as Profile[]} currentUserId={user.id} />
    </div>
  )
}
