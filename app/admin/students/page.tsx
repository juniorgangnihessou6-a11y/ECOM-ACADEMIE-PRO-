import { createClient } from "@/lib/supabase/server";
import { StudentsClient } from "./StudentsClient";

export default async function AdminStudentsPage() {
  const supabase = createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("date_inscription", { ascending: false });

  // Progress summary per student (lessons completed / total published lessons)
  const { count: totalLessons } = await supabase.from("lessons").select("*", { count: "exact", head: true }).eq("statut", "publie");
  const { data: progressRows } = await supabase.from("progress").select("user_id, completed");

  const progressByUser: Record<string, number> = {};
  (progressRows || []).forEach((p) => {
    if (p.completed) progressByUser[p.user_id] = (progressByUser[p.user_id] || 0) + 1;
  });

  return (
    <StudentsClient
      initialStudents={students || []}
      totalLessons={totalLessons || 0}
      progressByUser={progressByUser}
    />
  );
}
