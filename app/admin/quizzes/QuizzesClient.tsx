"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal, FormRow, inputClass } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface DraftAnswer { texte: string; est_correcte: boolean; }
interface DraftQuestion { question: string; explication: string; answers: DraftAnswer[]; }

export function QuizzesClient({ modules, initialQuizzes, attempts }: { modules: any[]; initialQuizzes: any[]; attempts: any[] }) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [modalOpen, setModalOpen] = useState(false);
  const [moduleId, setModuleId] = useState(modules[0]?.id || "");
  const [titre, setTitre] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([{ question: "", explication: "", answers: [{ texte: "", est_correcte: true }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }] }]);
  const toast = useToast();
  const supabase = createClient();

  function addQuestion() {
    setQuestions((prev) => [...prev, { question: "", explication: "", answers: [{ texte: "", est_correcte: true }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }] }]);
  }

  async function handleSave() {
    if (!titre.trim()) { toast("⚠️ Le titre du quiz est obligatoire."); return; }
    const clean = questions.filter((q) => q.question.trim() && q.answers.every((a) => a.texte.trim()));
    if (!clean.length) { toast("⚠️ Ajoute au moins une question complète."); return; }

    const { data: quiz, error } = await supabase.from("quizzes").insert({ module_id: moduleId, titre }).select().single();
    if (error) { toast("⚠️ " + error.message); return; }

    for (let i = 0; i < clean.length; i++) {
      const q = clean[i];
      const { data: qRow, error: qError } = await supabase.from("quiz_questions").insert({ quiz_id: quiz.id, ordre: i, question: q.question, explication: q.explication }).select().single();
      if (qError) { toast("⚠️ " + qError.message); continue; }
      for (let j = 0; j < q.answers.length; j++) {
        await supabase.from("quiz_answers").insert({ question_id: qRow.id, ordre: j, texte: q.answers[j].texte, est_correcte: q.answers[j].est_correcte });
      }
    }

    toast("✅ Quiz créé");
    setModalOpen(false);
    setTitre(""); setQuestions([{ question: "", explication: "", answers: [{ texte: "", est_correcte: true }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }, { texte: "", est_correcte: false }] }]);
    window.location.reload(); // simplest way to refetch nested quiz/questions/answers
  }

  async function handleDelete(quizId: string) {
    if (!confirm("Supprimer ce quiz ?")) return;
    await supabase.from("quizzes").delete().eq("id", quizId);
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    toast("🗑️ Quiz supprimé");
  }

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Gestion des quiz</h1>
          <p className="text-sm text-[var(--gray)]">Crée des quiz avec plusieurs réponses, une bonne réponse et une explication.</p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>+ Créer un quiz</Button>
      </div>

      {quizzes.map((q) => {
        const module = modules.find((m) => m.id === q.module_id);
        const quizAttempts = attempts.filter((a) => a.quiz_id === q.id).sort((a, b) => b.score - a.score);
        return (
          <Card key={q.id} className="mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-sm">{q.titre}</h3>
                <p className="text-xs text-[var(--gray)]">{module ? `Module ${module.numero} — ${module.nom}` : ""} · {q.quiz_questions?.length || 0} question(s)</p>
              </div>
              <button onClick={() => handleDelete(q.id)} className="text-xs font-bold text-red-600 border border-[var(--line)] px-2.5 py-1 rounded-lg">🗑️ Supprimer</button>
            </div>
            {quizAttempts.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase text-[var(--gray)]"><th className="py-1.5">Élève</th><th>Score</th><th>Date</th></tr></thead>
                <tbody>
                  {quizAttempts.map((a: any, i: number) => (
                    <tr key={i} className="border-t border-[var(--line)]">
                      <td className="py-1.5">{a.profiles?.prenom} {a.profiles?.nom}</td>
                      <td>{a.score}/{a.total}</td>
                      <td className="text-xs text-[var(--gray)]">{formatDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-xs text-[var(--gray)]">Aucun élève n'a encore passé ce quiz.</p>}
          </Card>
        );
      })}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Créer un quiz" wide
        footer={<><Button onClick={() => setModalOpen(false)}>Annuler</Button><Button variant="primary" onClick={handleSave}>Créer le quiz</Button></>}>
        <FormRow label="Module associé">
          <select className={inputClass} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            {modules.map((m) => <option key={m.id} value={m.id}>Module {m.numero} — {m.nom}</option>)}
          </select>
        </FormRow>
        <FormRow label="Titre du quiz"><input className={inputClass} value={titre} onChange={(e) => setTitre(e.target.value)} /></FormRow>

        {questions.map((q, qi) => (
          <div key={qi} className="border border-[var(--line)] rounded-xl p-4 mb-3 bg-[var(--bg-soft)]">
            <FormRow label={`Question ${qi + 1}`}>
              <input className={inputClass} value={q.question} onChange={(e) => setQuestions((prev) => prev.map((x, i) => i === qi ? { ...x, question: e.target.value } : x))} />
            </FormRow>
            {q.answers.map((a, ai) => (
              <div key={ai} className="flex items-center gap-2 mb-1.5">
                <input type="radio" name={`correct-${qi}`} checked={a.est_correcte}
                  onChange={() => setQuestions((prev) => prev.map((x, i) => i === qi ? { ...x, answers: x.answers.map((ans, j) => ({ ...ans, est_correcte: j === ai })) } : x))} />
                <input className={inputClass} placeholder={`Réponse ${ai + 1}`} value={a.texte}
                  onChange={(e) => setQuestions((prev) => prev.map((x, i) => i === qi ? { ...x, answers: x.answers.map((ans, j) => j === ai ? { ...ans, texte: e.target.value } : ans) } : x))} />
              </div>
            ))}
            <FormRow label="Explication (affichée après réponse)">
              <input className={inputClass} value={q.explication} onChange={(e) => setQuestions((prev) => prev.map((x, i) => i === qi ? { ...x, explication: e.target.value } : x))} />
            </FormRow>
          </div>
        ))}
        <Button onClick={addQuestion}>+ Ajouter une question</Button>
      </Modal>
    </div>
  );
}
