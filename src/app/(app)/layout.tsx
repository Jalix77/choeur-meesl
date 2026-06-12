import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import type { Profile } from '@/lib/database.types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.active) {
    await supabase.auth.signOut()
    redirect('/login?msg=disabled')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF6EC] overflow-x-hidden">
      <NavBar profile={profile as Profile} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        {children}
      </main>
      <footer className="border-t border-[#E2B36A]/40 py-4 text-center text-xs text-[#B87333]/70 px-4">
        <p className="leading-relaxed">
          Mission Église Évangélique Sel et Lumière · 4, Delmas 48<br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          meesl1410@gmail.com · (509) 37 97 1717
        </p>
      </footer>
    </div>
  )
}
