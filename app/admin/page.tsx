import { createClient } from "@/lib/supabase/server";
import { StatCard, Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: studentsCount }, { count: modulesCount }, { count: videosCount }, { count: docsCount }, { data: progressRows }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("modules").select("*", { count: "exact", head: true }),
      supabase.from("files").select("*", { count: "exact", head: true }).eq("kind", "video"),
      supabase.from("files").select("*", { count: "exact", head: true }).eq("kind", "document"),
      supabase.from("progress").select("user_id, completed"),
    ]);

  const { count: totalLessons } = await supabase.from("lessons").select("*", { count: "exact", head: true });

  const byUser: Record<string, { done: number }> = {};
  (progressRows || []).forEach((p) => {
    if (!byUser[p.user_id]) byUser[p.user_id] = { done: 0 };
    if (p.completed) byUser[p.user_id].done++;
  });
  const activeStudents = Object.keys(byUser).length;
  const avgProgress = totalLessons && activeStudents
    ? Math.round((Object.values(byUser).reduce((s, u) => s + u.done, 0) / (activeStudents * (totalLessons || 1))) * 100)
    : 0;

  const { data: recentActivity } = await supabase
    .from("progress")
    .select("completed_at, profiles(prenom, nom), lessons(titre)")
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Dashboard Admin</h1>
        <p className="text-sm text-[var(--gray)]">Bienvenue dans votre espace de gestion.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        <StatCard icon="🧑🏾‍🎓" value={studentsCount || 0} label="Élèves" />
        <StatCard icon="📚" value={modulesCount || 0} label="Modules" />
        <StatCard icon="🎥" value={videosCount || 0} label="Vidéos" />
        <StatCard icon="📄" value={docsCount || 0} label="Documents" />
        <StatCard icon="📈" value={avgProgress + "%"} label="Progression moyenne" />
        <StatCard icon="🏆" value={activeStudents} label="Élèves actifs" />
      </div>

      <Card>
        <h3 className="font-bold text-sm mb-3.5">Activité récente</h3>
        {(!recentActivity || recentActivity.length === 0) && (
          <p className="text-sm text-[var(--gray)]">Aucune activité pour le moment.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {(recentActivity || []).map((a: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-[var(--line)] last:border-0 pb-2.5 last:pb-0">
              <span>
                <strong>{a.profiles?.prenom} {a.profiles?.nom}</strong> vient de terminer « {a.lessons?.titre} »
              </span>
              <span className="text-xs text-[var(--gray)] flex-shrink-0 ml-3">{formatDateTime(a.completed_at)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
