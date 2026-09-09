import { createClient } from "@/lib/supabase/server";
import { ModulesClient } from "./ModulesClient";

export default async function AdminModulesPage() {
  const supabase = createClient();
  const { data: modules } = await supabase.from("modules").select("*").order("ordre");
  const { data: lessons } = await supabase.from("lessons").select("id, module_id");

  const lessonCounts: Record<string, number> = {};
  (lessons || []).forEach((l) => { lessonCounts[l.module_id] = (lessonCounts[l.module_id] || 0) + 1; });

  return <ModulesClient initialModules={modules || []} lessonCounts={lessonCounts} />;
}
