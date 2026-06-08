'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NavBarProps {
  role: 'admin' | 'member';
  fullName: string;
}

const links = [
  { href: '/', label: 'Tableau de bord' },
  { href: '/chants', label: 'Chants' },
  { href: '/planning', label: 'Planning' },
  { href: '/annonces', label: 'Annonces' },
];

export default function NavBar({ role, fullName }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="bg-[#5A3318] text-[#FBF6EC] shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top brand bar */}
        <div className="flex items-center gap-3 py-3 border-b border-[#E2B36A]/30">
          <Image src="/logo-meesl.png" alt="Logo MEESL" width={40} height={40} className="object-contain" />
          <div className="flex-1 min-w-0">
            <h1 className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#E2B36A] truncate">
              Mission Église Évangélique Sel et Lumière
            </h1>
            <p className="font-cormorant italic text-[#FBF6EC]/70 text-xs hidden sm:block">
              Prêcher, instruire et desservir la communauté !
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-cinzel text-xs text-[#E2B36A] uppercase tracking-widest">Chœur de Louange</p>
            <p className="text-[10px] text-[#FBF6EC]/60 hidden sm:block">{fullName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 py-2 overflow-x-auto">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? 'bg-[#B87333] text-white'
                  : 'text-[#FBF6EC]/80 hover:bg-[#E2B36A]/20'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {role === 'admin' && (
            <Link
              href="/admin/membres"
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-[#B87333] text-white'
                  : 'text-[#FBF6EC]/80 hover:bg-[#E2B36A]/20'
              }`}
            >
              Membres
            </Link>
          )}
          <div className="flex-1" />
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded text-sm text-[#FBF6EC]/60 hover:text-[#FBF6EC] hover:bg-[#E2B36A]/20 transition-colors whitespace-nowrap"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}
