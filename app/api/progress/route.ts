import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { lesson_id } = await req.json();
  if (!lesson_id) return NextResponse.json({ error: "lesson_id manquant." }, { status: 400 });

  const { error } = await supabase.from("progress").upsert(
    { user_id: user.id, lesson_id, completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
