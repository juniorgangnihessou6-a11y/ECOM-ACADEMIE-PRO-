import { createClient } from "@/lib/supabase/server";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage() {
  const supabase = createClient();
  const { data: files } = await supabase.from("files").select("*, modules(nom)").order("created_at", { ascending: false });
  return <LibraryClient initialFiles={files || []} />;
}
