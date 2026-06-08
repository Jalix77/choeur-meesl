import { createClient } from '@/lib/supabase/server';
import AnnouncementManager from '@/components/AnnouncementManager';

export default async function AnnoncesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cinzel text-2xl font-bold text-[#5A3318]">Annonces</h2>
        <div className="h-0.5 bg-[#E2B36A] w-16 mt-1" />
      </div>
      <AnnouncementManager
        announcements={announcements ?? []}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  );
}
