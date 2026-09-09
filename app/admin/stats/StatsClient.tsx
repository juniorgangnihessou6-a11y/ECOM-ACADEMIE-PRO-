"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { StatCard, Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export function StatsClient({ studentsCount, modules, lessons, progressRows, attempts, students }: {
  studentsCount: number; modules: any[]; lessons: any[]; progressRows: any[]; attempts: any[]; students: any[];
}) {
  const completedRows = progressRows.filter((p) => p.completed);
  const totalLessons = lessons.length;
  const activeStudents = new Set(completedRows.map((p) => p.user_id)).size;
  const avgProgress = studentsCount && totalLessons
    ? Math.round((completedRows.length / (studentsCount * totalLessons)) * 100)
    : 0;

  const videoWatchCounts: Record<string, number> = {};
  completedRows.forEach((p) => { videoWatchCounts[p.lesson_id] = (videoWatchCounts[p.lesson_id] || 0) + 1; });
  const mostWatched = lessons
    .map((l) => ({ name: l.titre.length > 22 ? l.titre.slice(0, 22) + "…" : l.titre, value: videoWatchCounts[l.id] || 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  const moduleConsult: Record<string, Set<string>> = {};
  completedRows.forEach((p) => {
    const lesson = lessons.find((l) => l.id === p.lesson_id);
    if (!lesson) return;
    if (!moduleConsult[lesson.module_id]) moduleConsult[lesson.module_id] = new Set();
    moduleConsult[lesson.module_id].add(p.user_id);
  });
  const modulePopularity = modules
    .map((m) => ({ name: "M" + m.numero, value: moduleConsult[m.id]?.size || 0 }))
    .sort((a, b) => b.value - a.value);

  const quizAvg: Record<string, { sum: number; count: number; titre: string }> = {};
  attempts.forEach((a: any) => {
    const key = a.quiz_id;
    if (!quizAvg[key]) quizAvg[key] = { sum: 0, count: 0, titre: a.quizzes?.titre || "Quiz" };
    quizAvg[key].sum += (a.score / a.total) * 100;
    quizAvg[key].count++;
  });
  const quizChart = Object.values(quizAvg).map((q) => ({ name: q.titre.length > 18 ? q.titre.slice(0, 18) + "…" : q.titre, value: Math.round(q.sum / q.count) }));

  const completionRate = studentsCount
    ? Math.round((students.filter((s) => {
        const doneForStudent = completedRows.filter((p) => p.user_id === s.id).length;
        return totalLessons > 0 && doneForStudent === totalLessons;
      }).length / studentsCount) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-extrabold mb-1">Statistiques</h1><p className="text-sm text-[var(--gray)]">Vue d'ensemble de l'activité sur la plateforme.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <StatCard icon="🧑🏾‍🎓" value={studentsCount} label="Élèves" />
        <StatCard icon="🏆" value={activeStudents} label="Élèves actifs" />
        <StatCard icon="📈" value={avgProgress + "%"} label="Progression moyenne" />
        <StatCard icon="✅" value={completionRate + "%"} label="Taux de complétion" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="font-bold text-sm mb-3">🎥 Vidéos les plus regardées</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mostWatched} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis dataKey="name" type="category" width={140} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="#1E63E9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-bold text-sm mb-3">📚 Modules les plus consultés</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modulePopularity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="#0FCFA4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="mb-4">
        <h3 className="font-bold text-sm mb-3">📝 Scores moyens aux quiz</h3>
        {quizChart.length === 0 ? <p className="text-sm text-[var(--gray)]">Pas encore de données.</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quizChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis unit="%" fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="#1E63E9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <h3 className="font-bold text-sm mb-3">🕒 Dernières connexions</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase text-[var(--gray)]"><th className="py-1.5">Élève</th><th>Dernière connexion</th></tr></thead>
          <tbody>
            {students.map((s: any) => (
              <tr key={s.id} className="border-t border-[var(--line)]">
                <td className="py-1.5">{s.prenom} {s.nom}</td>
                <td className="text-xs text-[var(--gray)]">{s.last_login ? formatDateTime(s.last_login) : "Jamais connecté"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
