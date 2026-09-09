import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, ProgressBar, StatCard } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { data: lessons } = await supabase.from("lessons").select("id, module_id, numero, titre").eq("statut", "publie");
  const { data: progressRows } = await supabase.from("progress").select("lesson_id, completed").eq("user_id", user!.id).eq("completed", true);
  const { data: modules } = await supabase.from("modules").select("id, numero, nom").eq("statut", "publie").order("ordre");
  const { data: announcements } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3);
  const { data: attempts } = await supabase.from("quiz_attempts").select("id").eq("user_id", user!.id);

  const totalLessons = lessons?.length || 0;
  const completedIds = new Set((progressRows || []).map((p) => p.lesson_id));
  const pct = totalLessons ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  const modulesTermines = (modules || []).filter((m) => {
    const moduleLessons = (lessons || []).filter((l) => l.module_id === m.id);
    return moduleLessons.length > 0 && moduleLessons.every((l) => completedIds.has(l.id));
  }).length;

  const nextLesson = (lessons || [])
    .sort((a, b) => a.numero - b.numero)
    .find((l) => !completedIds.has(l.id));
  const nextModule = nextLesson ? (modules || []).find((m) => m.id === nextLesson.module_id) : null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Bonjour {profile?.prenom} 👋</h1>
      <p className="text-sm text-[var(--gray)] mb-6">Bienvenue dans Ecom Académie Pro. Continue ta formation là où tu t'es arrêté.</p>

      <Card className="mb-5">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="font-bold text-sm">📊 Ma progression</h3>
          <span className="font-extrabold text-xl">{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
      </Card>

      {nextLesson && nextModule && (
        <Card className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-[var(--gray)] mb-1">Reprendre</div>
            <div className="font-bold text-sm">Module {nextModule.numero} — {nextLesson.titre}</div>
          </div>
          <Link href={`/student/lesson/${nextLesson.id}`} className="px-4 py-2.5 rounded-xl brand-gradient text-white text-sm font-bold">Continuer →</Link>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <StatCard icon="📚" value={`${modulesTermines} / ${modules?.length || 0}`} label="Modules terminés" />
        <StatCard icon="📝" value={attempts?.length || 0} label="Quiz réalisés" />
        <StatCard icon="🎥" value={`${completedIds.size} / ${totalLessons}`} label="Leçons terminées" />
      </div>

      <Card>
        <h3 className="font-bold text-sm mb-3.5">📢 Annonces</h3>
        {(!announcements || announcements.length === 0) && <p className="text-sm text-[var(--gray)]">Aucune annonce.</p>}
        <div className="flex flex-col gap-2.5">
          {(announcements || []).map((a) => (
            <div key={a.id} className="border-l-4 rounded-lg bg-[var(--bg-soft)] p-3" style={{ borderLeftColor: "var(--teal)" }}>
              <div className="font-bold text-sm mb-1">📢 {a.titre}</div>
              <p className="text-xs text-[var(--gray)] mb-1">{a.message}</p>
              <div className="text-[11px] text-[var(--gray)]">{formatDate(a.created_at)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
