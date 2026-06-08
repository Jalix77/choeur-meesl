import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MembresManager from '@/components/MembresManager';

export default async function MembresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, active, created_at')
    .order('full_name');

  // Get emails via auth.users — not available from client. We'll display what we have.
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318]">Gestion des membres</h2>
        <div className="h-0.5 bg-[#E2B36A] w-16 mt-1" />
      </div>
      <MembresManager profiles={profiles ?? []} />
    </div>
  );
}
