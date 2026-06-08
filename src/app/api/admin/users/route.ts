import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return null;
  return user;
}

// POST — create user
export async function POST(request: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { full_name, email, password, role } = await request.json();
  if (!full_name || !email || !password) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role ?? 'member' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Wait briefly for trigger, then fetch profile
  await new Promise(r => setTimeout(r, 500));
  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, active, created_at')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({ profile });
}

// DELETE — delete user
export async function DELETE(request: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

// PATCH — update profile (active / role)
export async function PATCH(request: NextRequest) {
  const caller = await verifyAdmin();
  if (!caller) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { id, active, role } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const supabase = await createServerClient();
  type ProfileUpdate = { active?: boolean; role?: 'admin' | 'member' };
  const update: ProfileUpdate = {};
  if (active !== undefined) update.active = active;
  if (role !== undefined) update.role = role;

  const { error } = await supabase.from('profiles').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
