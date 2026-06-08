import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, active')
    .eq('id', user.id)
    .single();

  if (!profile?.active) {
    await supabase.auth.signOut();
    redirect('/login?desactive=1');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar role={profile.role} fullName={profile.full_name} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
