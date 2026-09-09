"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

export function QuizClient({ quiz, questions }: { quiz: any; questions: any[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) { toast("⚠️ Réponds à toutes les questions."); return; }
    setSubmitting(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: quiz.id, answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast("⚠️ " + data.error); return; }
    setResult(data);
  }

  if (result) {
    const good = result.score / result.total >= 0.7;
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">{good ? "🎉" : "📚"}</div>
        <div className="text-4xl font-extrabold mb-2">{result.score}/{result.total}</div>
        <p className="text-sm text-[var(--gray)] mb-6">{good ? "Bien joué, tu maîtrises ce module !" : "Continue à réviser, tu vas y arriver."}</p>
        <Button variant="primary" onClick={() => router.push("/student/modules")}>Retour aux modules</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold mb-5">📝 {quiz.titre}</h1>
      {questions.map((q, qi) => (
        <Card key={q.id} className="mb-3.5">
          <div className="font-bold text-sm mb-3">{qi + 1}. {q.question}</div>
          {[...q.quiz_answers].sort((a: any, b: any) => a.ordre - b.ordre).map((a: any) => (
            <label key={a.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--line)] mb-2 text-sm cursor-pointer hover:border-[var(--blue)]">
              <input type="radio" name={`q-${q.id}`} onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: a.id }))} />
              {a.texte}
            </label>
          ))}
        </Card>
      ))}
      <Button variant="primary" onClick={handleSubmit} disabled={submitting}>Valider mes réponses</Button>
    </div>
  );
}
