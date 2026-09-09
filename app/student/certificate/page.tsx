import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CertificateClient } from "./CertificateClient";

export default async function CertificatePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { data: lessons } = await supabase.from("lessons").select("id").eq("statut", "publie");
  const { data: progressRows } = await supabase.from("progress").select("lesson_id").eq("user_id", user!.id).eq("completed", true);
  const totalLessons = lessons?.length || 0;
  const doneCount = new Set((progressRows || []).map((p) => p.lesson_id)).size;
  const pct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;

  let certificate = null;
  if (pct === 100) {
    // Eligibility (100% completion) already verified above in trusted server
    // code, so we use the admin client to write the certificate row —
    // students have no direct insert policy on `certificates` on purpose.
    const adminClient = createAdminClient();
    const { data: existing } = await adminClient.from("certificates").select("*").eq("user_id", user!.id).single();
    if (existing) {
      certificate = existing;
    } else {
      const numero = "EAP-" + new Date().getFullYear() + "-" + user!.id.slice(0, 8).toUpperCase();
      const { data: created } = await adminClient.from("certificates").insert({ user_id: user!.id, numero }).select().single();
      certificate = created;
    }
  }

  return <CertificateClient pct={pct} profile={profile} certificate={certificate} />;
}
