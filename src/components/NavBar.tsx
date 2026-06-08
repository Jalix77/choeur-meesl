'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/database.types'

interface NavBarProps {
  profile: Profile | null
}

export default function NavBar({ profile }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'

  const links = [
    { href: '/', label: 'Tableau de bord' },
    { href: '/chants', label: 'Chants' },
    { href: '/planning', label: 'Planning' },
    { href: '/annonces', label: 'Annonces' },
    ...(isAdmin ? [{ href: '/admin/membres', label: 'Membres' }] : []),
  ]

  return (
    <nav className="bg-[#5A3318] shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo + name */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-meesl.png" alt="MEESL" width={32} height={32} className="object-contain" />
            <span className="font-cinzel text-white text-sm font-bold tracking-wide hidden sm:block">
              Chœur de Louange
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded text-sm font-cinzel tracking-wide transition-colors ${
                  pathname === link.href
                    ? 'bg-[#B87333] text-white'
                    : 'text-[#E2B36A] hover:text-white hover:bg-[#7A4A20]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User + signout */}
          <div className="flex items-center gap-2">
            <span className="text-[#E2B36A] text-xs hidden md:block">
              {profile?.full_name}
              {isAdmin && <span className="ml-1 text-[#B87333]">(admin)</span>}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-[#E2B36A] hover:text-white border border-[#B87333]/50 hover:border-white px-2 py-1 rounded transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
