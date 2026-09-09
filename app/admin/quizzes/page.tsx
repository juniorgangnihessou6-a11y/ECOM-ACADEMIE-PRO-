import { createClient } from "@/lib/supabase/server";
import { QuizzesClient } from "./QuizzesClient";

export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const { data: modules } = await supabase.from("modules").select("id, numero, nom").order("ordre");
  const { data: quizzes } = await supabase.from("quizzes").select("*, quiz_questions(*, quiz_answers(*))");
  const { data: attempts } = await supabase.from("quiz_attempts").select("quiz_id, score, total, created_at, profiles(prenom, nom)");

  return <QuizzesClient modules={modules || []} initialQuizzes={quizzes || []} attempts={attempts || []} />;
}
