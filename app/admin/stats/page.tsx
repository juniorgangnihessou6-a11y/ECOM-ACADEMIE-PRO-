import { createClient } from "@/lib/supabase/server";
import { StatsClient } from "./StatsClient";

export default async function AdminStatsPage() {
  const supabase = createClient();

  const [{ count: studentsCount }, { data: modules }, { data: lessons }, { data: progressRows }, { data: attempts }, { data: students }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("modules").select("id, numero, nom"),
      supabase.from("lessons").select("id, module_id, titre, type"),
      supabase.from("progress").select("user_id, lesson_id, completed"),
      supabase.from("quiz_attempts").select("quiz_id, score, total, quizzes(titre)"),
      supabase.from("profiles").select("id, prenom, nom, last_login").eq("role", "student").order("last_login", { ascending: false }),
    ]);

  return (
    <StatsClient
      studentsCount={studentsCount || 0}
      modules={modules || []}
      lessons={lessons || []}
      progressRows={progressRows || []}
      attempts={attempts || []}
      students={students || []}
    />
  );
}
