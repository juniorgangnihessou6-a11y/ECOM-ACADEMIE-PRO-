import { createClient } from "@/lib/supabase/server";
import { AnnouncementsClient } from "./AnnouncementsClient";

export default async function AdminAnnouncementsPage() {
  const supabase = createClient();
  const { data: announcements } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  return <AnnouncementsClient initialAnnouncements={announcements || []} />;
}
