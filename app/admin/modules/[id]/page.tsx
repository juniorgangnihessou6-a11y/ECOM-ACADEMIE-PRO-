import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ModuleContentClient } from "./ModuleContentClient";

export default async function ModuleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: module } = await supabase.from("modules").select("*").eq("id", params.id).single();
  if (!module) notFound();

  const { data: lessons } = await supabase.from("lessons").select("*").eq("module_id", params.id).order("ordre");
  const { data: quizzes } = await supabase.from("quizzes").select("*").eq("module_id", params.id);

  return <ModuleContentClient module={module} initialLessons={lessons || []} quizzes={quizzes || []} />;
}
