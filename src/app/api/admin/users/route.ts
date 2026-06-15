import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Fields a leader is allowed to update on any profile
const LEADER_ALLOWED_FIELDS = new Set(['phone', 'date_naissance', 'avatar_url'])

async function getCallerProfile(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single()
  return profile as { id: string; role: 'admin' | 'leader' | 'member' } | null
}

// POST — create user — admin or leader (leader can only create members)
export async function POST(request: NextRequest) {
  const caller = await getCallerProfile(request)
  if (!caller || (caller.role !== "admin" && caller.role !== "leader")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { email, password, full_name, role } = await request.json()

  // Leaders can only create members, never admin or leader
  const assignedRole = caller.role === "leader" ? "member" : (role ?? "member")

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: assignedRole },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data.user })
}

// PATCH — update profile fields
// admin: can update any field (role, active, phone, date_naissance, full_name, etc.)
// leader: can only update phone and date_naissance
export async function PATCH(request: NextRequest) {
  const caller = await getCallerProfile(request)
  if (!caller || (caller.role !== "admin" && caller.role !== "leader")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...rawUpdates } = body

  // Leaders: strip fields they are not allowed to touch
  let updates: Record<string, unknown>
  if (caller.role === "leader") {
    updates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([k]) => LEADER_ALLOWED_FIELDS.has(k))
    )
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucun champ autorisé." }, { status: 403 })
    }
  } else {
    updates = rawUpdates
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// DELETE — admin or leader (leader can only delete members, not admins/leaders/self)
export async function DELETE(request: NextRequest) {
  const caller = await getCallerProfile(request)
  if (!caller || (caller.role !== "admin" && caller.role !== "leader")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id } = await request.json()

  // Fetch the target profile role to enforce restrictions
  const adminClient = createAdminClient()
  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single()

  const targetRole = targetProfile?.role as 'admin' | 'leader' | 'member' | undefined

  // Leaders cannot delete admins, other leaders, or themselves
  if (caller.role === "leader") {
    if (caller.id === id || targetRole === "admin" || targetRole === "leader") {
      return NextResponse.json({ error: "Vous n'avez pas la permission de supprimer ce compte." }, { status: 403 })
    }
  }

  // Even admins are protected: block deleting admins/leaders as extra safety (optional — remove if admins should be deletable)
  // Admins retain full access, so no additional restriction here.

  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
