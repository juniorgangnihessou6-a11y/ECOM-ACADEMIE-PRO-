import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";

// Every handler here first verifies the CALLER is a signed-in admin (using
// the normal server client bound to their session/cookies + RLS), and only
// THEN uses the service-role admin client to perform the privileged action
// (creating/deleting Supabase Auth users, which the anon/authenticated
// roles are never allowed to do directly).
async function requireAdmin() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { prenom, nom, email, telephone, password, access_start, access_end } = body;
  if (!prenom || !nom || !email || !password) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // demo/internal platform: skip email confirmation step
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "Impossible de créer le compte." }, { status: 400 });
  }

  // The DB trigger `handle_new_user` already inserted a bare profile row —
  // we now fill in the rest of the fields.
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ prenom, nom, telephone, access_start: access_start || null, access_end: access_end || null })
    .eq("id", created.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const body = await req.json();
  const { id, prenom, nom, telephone, statut, access_start, access_end, password } = body;
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const adminClient = createAdminClient();

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ prenom, nom, telephone, statut, access_start: access_start || null, access_end: access_end || null })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (password) {
    const { error: pwError } = await adminClient.auth.admin.updateUserById(id, { password });
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id); // cascades to profiles via FK on delete cascade
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
