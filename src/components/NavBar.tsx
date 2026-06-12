'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/database.types'
import { canManageContent, isAdmin as checkIsAdmin, ROLE_LABELS } from '@/lib/roles'

interface NavBarProps {
  profile: Profile | null
}

export default function NavBar({ profile }: NavBarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)
  const menuRef   = useRef<HTMLDivElement>(null)

  const isAdmin   = checkIsAdmin(profile?.role)
  const canManage = canManageContent(profile?.role)
  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] : ''

  const links = [
    { href: '/',               label: 'Tableau de bord', icon: '🏠' },
    { href: '/chants',         label: 'Chants',           icon: '🎶' },
    { href: '/planning',       label: 'Planning',         icon: '📅' },
    { href: '/annonces',       label: 'Annonces',         icon: '📢' },
    { href: '/anniversaires',  label: 'Anniversaires',    icon: '🎂' },
    ...(canManage ? [{ href: '/admin/membres', label: 'Membres', icon: '👥' }] : []),
  ]

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-[#5A3318] shadow-lg relative z-40" ref={menuRef}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo + name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setOpen(false)}>
            <Image src="/logo-meesl.png" alt="MEESL" width={32} height={32} className="object-contain flex-shrink-0" />
            <span className="font-cinzel text-white text-sm font-bold tracking-wide hidden sm:block">
              Chœur de Louange
            </span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-2.5 py-1.5 rounded text-xs font-cinzel tracking-wide transition-colors whitespace-nowrap ${
                  pathname === link.href
                    ? 'bg-[#B87333] text-white'
                    : 'text-[#E2B36A] hover:text-white hover:bg-[#7A4A20]'
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* User name — desktop only */}
            <span className="text-[#E2B36A] text-xs hidden lg:block">
              {profile?.full_name}
              {roleLabel && <span className="ml-1 text-[#B87333]">({roleLabel})</span>}
            </span>

            {/* Logout — desktop only */}
            <button onClick={handleSignOut}
              className="hidden md:block text-xs text-[#E2B36A] hover:text-white border border-[#B87333]/50 hover:border-white px-2 py-1 rounded transition-colors">
              Déconnexion
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen(o => !o)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-[#7A4A20] transition-colors gap-1.5 flex-shrink-0"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <span className={`block w-5 h-0.5 bg-[#E2B36A] transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#E2B36A] transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#E2B36A] transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-[#3D1F0A] border-t border-[#B87333]/30 shadow-xl z-50">
          {/* User info */}
          {profile && (
            <div className="px-4 py-3 border-b border-[#B87333]/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#B87333]/30 flex items-center justify-center text-sm font-bold text-[#E2B36A] flex-shrink-0">
                {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{profile.full_name}</p>
                {roleLabel && <p className="text-[#B87333] text-xs">{roleLabel}</p>}
              </div>
            </div>
          )}

          {/* Nav links */}
          <div className="py-2">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-cinzel tracking-wide transition-colors ${
                  pathname === link.href
                    ? 'bg-[#B87333] text-white'
                    : 'text-[#E2B36A] hover:bg-[#5A3318] hover:text-white'
                }`}>
                <span className="text-base w-6 text-center">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="px-4 py-3 border-t border-[#B87333]/20">
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 text-sm text-[#E2B36A] hover:text-white py-2 transition-colors">
              <span className="text-base w-6 text-center">🚪</span>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
