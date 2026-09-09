import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuizClient } from "./QuizClient";

export default async function StudentQuizPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", params.id).single();
  if (!quiz) notFound();

  // Only fetch id + texte for answers — never est_correcte — so the
  // correct answer truly never reaches the browser before grading.
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, ordre, question, explication, quiz_answers(id, ordre, texte)")
    .eq("quiz_id", params.id)
    .order("ordre");

  return <QuizClient quiz={quiz} questions={questions || []} />;
}
