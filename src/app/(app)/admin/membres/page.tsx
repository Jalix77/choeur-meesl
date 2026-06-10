import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, Role } from '@/lib/database.types'
import MemberManager from '@/components/MemberManager'
import { canManageContent } from '@/lib/roles'

export default async function MembresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const callerRole = (profile as Pick<Profile, 'role'> | null)?.role ?? 'member'

  // Leaders can view — members cannot
  if (!canManageContent(callerRole)) redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cinzel text-2xl font-bold text-[#5A3318]">Gestion des membres</h1>
        <p className="text-sm text-[#B87333] mt-1">
          {callerRole === 'admin'
            ? 'Comptes choristes autorisés'
            : 'Vous pouvez modifier le téléphone et la date de naissance des membres.'}
        </p>
      </div>

      <MemberManager
        profiles={(profiles ?? []) as Profile[]}
        currentUserId={user.id}
        callerRole={callerRole as Role}
      />
    </div>
  )
}
