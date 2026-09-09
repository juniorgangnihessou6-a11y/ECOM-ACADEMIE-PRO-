import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Renvoie une URL signée à durée de vie courte (5 minutes) pour lire un
 * fichier privé (vidéo ou document). Le fichier n'est donc jamais exposé
 * via une URL publique fixe et partageable indéfiniment.
 *
 * Vérifications avant de signer :
 * 1. L'utilisateur est bien authentifié.
 * 2. Le fichier existe et est associé à une leçon publiée.
 * 3. Si des dates d'accès (access_start / access_end) sont définies sur le
 *    profil de l'élève, elles sont respectées.
 * 4. Le compte n'est pas suspendu.
 */
export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("file_id");
  if (!fileId) return NextResponse.json({ error: "file_id manquant." }, { status: 400 });

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, statut, access_start, access_end").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable." }, { status: 403 });
  if (profile.statut === "suspended") return NextResponse.json({ error: "Compte suspendu." }, { status: 403 });

  const today = new Date().toISOString().slice(0, 10);
  if (profile.role !== "admin") {
    if (profile.access_start && today < profile.access_start) {
      return NextResponse.json({ error: "Ton accès n'a pas encore commencé." }, { status: 403 });
    }
    if (profile.access_end && today > profile.access_end) {
      return NextResponse.json({ error: "Ton accès à la formation a expiré." }, { status: 403 });
    }
  }

  const adminClient = createAdminClient();
  const { data: file } = await adminClient.from("files").select("*").eq("id", fileId).single();
  if (!file) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });

  if (profile.role !== "admin") {
    const { data: lesson } = await adminClient.from("lessons").select("statut").eq("file_id", fileId).single();
    if (!lesson || lesson.statut !== "publie") {
      return NextResponse.json({ error: "Ce contenu n'est pas disponible." }, { status: 403 });
    }
  }

  const { data: signed, error: signError } = await adminClient.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 300); // 5 minutes

  if (signError || !signed) {
    return NextResponse.json({ error: "Impossible de générer le lien de lecture." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
