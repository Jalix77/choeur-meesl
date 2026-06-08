import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile
}

export async function POST(request: NextRequest) {
  const profile = await getCallerProfile(request)
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }

  const { email, password, full_name, role } = await request.json()
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role ?? "member" },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data.user })
}

export async function PATCH(request: NextRequest) {
  const profile = await getCallerProfile(request)
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

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
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const profile = await getCallerProfile(request)
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }

  const { id } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
