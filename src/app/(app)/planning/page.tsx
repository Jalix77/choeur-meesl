import { createClient } from '@/lib/supabase/server';
import RehearsalManager from '@/components/RehearsalManager';

export default async function PlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const now = new Date().toISOString();

  const { data: rehearsals } = await supabase
    .from('rehearsals')
    .select('*, rehearsal_songs(id, order_index, songs(id, title))')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true });

  const { data: allSongs } = await supabase
    .from('songs')
    .select('id, title')
    .order('title');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318]">Planning des répétitions</h2>
        <div className="h-0.5 bg-[#E2B36A] w-16 mt-1" />
      </div>
      <RehearsalManager
        rehearsals={rehearsals ?? []}
        allSongs={allSongs ?? []}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  );
}
