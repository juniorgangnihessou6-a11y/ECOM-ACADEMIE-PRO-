"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LessonRow, ModuleRow } from "@/lib/types";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/Button";
import { ProgressBar, Badge } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const TYPE_ICON: Record<string, string> = { video: "🎥", document: "📄", link: "🔗", quiz: "📝" };

export function LessonClient({ lesson, module, siblingLessons, completedIds, quiz }: {
  lesson: LessonRow; module: ModuleRow; siblingLessons: LessonRow[]; completedIds: string[]; quiz: any;
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedIds));
  const [marking, setMarking] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const sorted = [...siblingLessons].sort((a, b) => a.numero - b.numero);
  const idx = sorted.findIndex((l) => l.id === lesson.id);
  const prevLesson = idx > 0 ? sorted[idx - 1] : null;
  const nextLesson = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const isDone = completed.has(lesson.id);
  const pct = sorted.length ? Math.round((sorted.filter((l) => completed.has(l.id)).length / sorted.length) * 100) : 0;

  async function markDone() {
    setMarking(true);
    const res = await fetch("/api/progress", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lesson.id }),
    });
    setMarking(false);
    if (res.ok) {
      setCompleted((prev) => new Set(prev).add(lesson.id));
      toast("✅ Leçon terminée");
    } else {
      toast("⚠️ Impossible d'enregistrer la progression.");
    }
  }

  return (
    <div>
      <Link href="/student/modules" className="text-xs font-bold text-[var(--gray)] mb-3 inline-block">← Retour aux modules</Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div>
          {lesson.type === "video" && <VideoPlayer fileId={lesson.file_id} />}
          {lesson.type === "document" && (
            <div className="w-full aspect-video bg-[var(--bg-soft)] rounded-2xl flex flex-col items-center justify-center gap-3 border border-[var(--line)]">
              <span className="text-4xl">📄</span>
              <a href={`/api/media/signed-url?file_id=${lesson.file_id}`} target="_blank" className="text-sm font-bold text-[var(--blue)] underline">Ouvrir le document</a>
            </div>
          )}
          {lesson.type === "link" && (
            <div className="w-full aspect-video bg-[var(--bg-soft)] rounded-2xl flex flex-col items-center justify-center gap-3 border border-[var(--line)]">
              <span className="text-4xl">🔗</span>
              <a href={lesson.url || "#"} target="_blank" rel="noopener" className="text-sm font-bold text-[var(--blue)] underline">Ouvrir le lien</a>
            </div>
          )}
          {lesson.type === "quiz" && quiz && (
            <div className="w-full bg-[var(--bg-soft)] rounded-2xl p-8 text-center border border-[var(--line)]">
              <span className="text-4xl">📝</span>
              <h3 className="font-bold mt-3 mb-4">{quiz.titre}</h3>
              <Button variant="primary" onClick={() => router.push(`/student/quiz/${quiz.id}`)}>Passer le quiz</Button>
            </div>
          )}

          <div className="mt-4">
            <div className="text-xs font-bold text-[var(--blue)] uppercase mb-1.5">Module {module?.numero} — {module?.nom}</div>
            <h2 className="text-lg font-extrabold mb-2">{TYPE_ICON[lesson.type]} {lesson.titre}</h2>
            <p className="text-sm text-[var(--gray)] mb-4">{lesson.description}</p>

            <div className="flex flex-wrap gap-2.5">
              <Button disabled={!prevLesson} onClick={() => prevLesson && router.push(`/student/lesson/${prevLesson.id}`)}>⬅️ Précédent</Button>
              {lesson.type !== "quiz" && (
                <Button variant="primary" onClick={markDone} disabled={marking || isDone}>{isDone ? "✅ Terminée" : "✅ Marquer comme terminée"}</Button>
              )}
              <Button disabled={!nextLesson} onClick={() => nextLesson && router.push(`/student/lesson/${nextLesson.id}`)}>Suivant ➡️</Button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131A21] border border-[var(--line)] rounded-2xl p-4">
          <h4 className="font-bold text-xs uppercase tracking-wide mb-1">Contenu du module</h4>
          <div className="text-[11px] text-[var(--gray)] mb-2.5">Progression du module : {pct}%</div>
          <ProgressBar pct={pct} sm />
          <div className="mt-3 flex flex-col gap-0.5">
            {sorted.map((l, i) => {
              const done = completed.has(l.id);
              const unlocked = i === 0 || completed.has(sorted[i - 1].id) || done;
              const isCurrent = l.id === lesson.id;
              return (
                <Link
                  key={l.id}
                  href={unlocked ? `/student/lesson/${l.id}` : "#"}
                  onClick={(e) => { if (!unlocked) { e.preventDefault(); toast("🔒 Termine le contenu précédent d'abord."); } }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${isCurrent ? "bg-gradient-to-r from-teal-500/15 to-blue-500/15 font-bold" : "hover:bg-[var(--bg-soft)]"} ${!unlocked ? "text-[var(--gray)] cursor-not-allowed" : ""}`}
                >
                  <span>{done ? "✅" : unlocked ? TYPE_ICON[l.type] : "🔒"}</span>
                  <span className="truncate">{l.titre}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
