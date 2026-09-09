import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Le client envoie uniquement { quiz_id, answers: { [question_id]: answer_id } }.
 * La correction se fait ici, côté serveur, avec le client admin (service
 * role) pour lire quel `answer_id` est marqué `est_correcte = true` — cette
 * information n'est jamais envoyée au navigateur avant la soumission.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { quiz_id, answers } = await req.json();
  if (!quiz_id || !answers) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const adminClient = createAdminClient();
  const { data: questions } = await adminClient
    .from("quiz_questions")
    .select("id, quiz_answers(id, est_correcte)")
    .eq("quiz_id", quiz_id);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz introuvable." }, { status: 404 });
  }

  let score = 0;
  questions.forEach((q: any) => {
    const correctAnswer = q.quiz_answers.find((a: any) => a.est_correcte);
    if (correctAnswer && answers[q.id] === correctAnswer.id) score++;
  });
  const total = questions.length;

  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id, user_id: user.id, score, total, answers,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ score, total });
}
