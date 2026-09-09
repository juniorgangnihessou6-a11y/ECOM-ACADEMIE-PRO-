import { createClient } from "@/lib/supabase/server";
import { ResourcesClient } from "./ResourcesClient";

export default async function AdminResourcesPage() {
  const supabase = createClient();
  const { data: resources } = await supabase.from("resources").select("*, modules(nom)").order("created_at", { ascending: false });
  const { data: modules } = await supabase.from("modules").select("id, numero, nom").order("ordre");
  return <ResourcesClient initialResources={resources || []} modules={modules || []} />;
}
