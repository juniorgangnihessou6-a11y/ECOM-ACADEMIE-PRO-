import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./ProfileClient";

export default async function StudentProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { data: lessons } = await supabase.from("lessons").select("id, module_id").eq("statut", "publie");
  const { data: modules } = await supabase.from("modules").select("id").eq("statut", "publie");
  const { data: progressRows } = await supabase.from("progress").select("lesson_id").eq("user_id", user!.id).eq("completed", true);
  const { data: attempts } = await supabase.from("quiz_attempts").select("id").eq("user_id", user!.id);
  const { data: certificate } = await supabase.from("certificates").select("id").eq("user_id", user!.id).maybeSingle();

  const totalLessons = lessons?.length || 0;
  const completedIds = new Set((progressRows || []).map((p) => p.lesson_id));
  const pct = totalLessons ? Math.round((completedIds.size / totalLessons) * 100) : 0;
  const modulesTermines = (modules || []).filter((m) => {
    const moduleLessons = (lessons || []).filter((l) => l.module_id === m.id);
    return moduleLessons.length > 0 && moduleLessons.every((l) => completedIds.has(l.id));
  }).length;

  return (
    <ProfileClient
      profile={profile}
      pct={pct}
      modulesTermines={modulesTermines}
      totalModules={modules?.length || 0}
      quizCount={attempts?.length || 0}
      hasCertificate={!!certificate}
    />
  );
}
