import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudentShell } from "./StudentShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.statut === "suspended") redirect("/login?error=suspended");

  return <StudentShell profile={profile}>{children}</StudentShell>;
}
