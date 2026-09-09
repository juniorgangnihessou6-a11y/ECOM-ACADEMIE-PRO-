import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, ProgressBar, Badge } from "@/components/ui/Card";

export default async function StudentModulesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: modules } = await supabase.from("modules").select("*").eq("statut", "publie").order("ordre");
  const { data: lessons } = await supabase.from("lessons").select("id, module_id, numero, titre").eq("statut", "publie");
  const { data: progressRows } = await supabase.from("progress").select("lesson_id").eq("user_id", user!.id).eq("completed", true);
  const { data: resourcesCount } = await supabase.from("resources").select("module_id");

  const completedIds = new Set((progressRows || []).map((p) => p.lesson_id));

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-extrabold mb-1">Mes modules</h1><p className="text-sm text-[var(--gray)]">Toute ta formation, module par module.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(modules || []).map((m) => {
          const moduleLessons = (lessons || []).filter((l) => l.module_id === m.id).sort((a, b) => a.numero - b.numero);
          const doneCount = moduleLessons.filter((l) => completedIds.has(l.id)).length;
          const pct = moduleLessons.length ? Math.round((doneCount / moduleLessons.length) * 100) : 0;
          const nextLesson = moduleLessons.find((l) => !completedIds.has(l.id)) || moduleLessons[0];
          const resCount = (resourcesCount || []).filter((r) => r.module_id === m.id).length;

          return (
            <Card key={m.id} className="p-0 overflow-hidden flex flex-col">
              <div className="h-28 brand-gradient flex items-center justify-center text-white font-extrabold text-xl relative"
                style={m.cover_url ? { backgroundImage: `url(${m.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                {!m.cover_url && "M" + m.numero}
                <span className="absolute top-2.5 right-2.5 bg-black/35 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{pct}%</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-sm mb-1.5">Module {m.numero} — {m.nom}</h3>
                <p className="text-xs text-[var(--gray)] mb-3 flex-1">{m.description}</p>
                <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--gray)] mb-2.5">
                  <span>🎥 {moduleLessons.length} contenu(s)</span>
                  {resCount > 0 && <span>📄 {resCount} ressource(s)</span>}
                </div>
                <ProgressBar pct={pct} sm />
                <Link
                  href={nextLesson ? `/student/lesson/${nextLesson.id}` : "#"}
                  className="mt-3.5 text-center px-4 py-2.5 rounded-xl brand-gradient text-white text-sm font-bold"
                >
                  {moduleLessons.length === 0 ? "Bientôt disponible" : "Continuer →"}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
