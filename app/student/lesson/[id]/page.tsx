import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LessonClient } from "./LessonClient";

export default async function LessonPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", params.id).single();
  if (!lesson) notFound();

  const { data: module } = await supabase.from("modules").select("*").eq("id", lesson.module_id).single();
  const { data: siblingLessons } = await supabase.from("lessons").select("*").eq("module_id", lesson.module_id).eq("statut", "publie").order("numero");
  const { data: progressRows } = await supabase.from("progress").select("lesson_id, completed").eq("user_id", user!.id);
  const { data: quiz } = lesson.quiz_id ? await supabase.from("quizzes").select("*").eq("id", lesson.quiz_id).single() : { data: null };

  const completedIds = new Set((progressRows || []).filter((p) => p.completed).map((p) => p.lesson_id));

  return (
    <LessonClient
      lesson={lesson}
      module={module}
      siblingLessons={siblingLessons || []}
      completedIds={Array.from(completedIds)}
      quiz={quiz}
    />
  );
}
