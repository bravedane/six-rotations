import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Admin-only: add a coach note to a player's record. Source is "dana" or "kniff"
// so notes from Coach Kniffin are visibly distinguished from Dana's own.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  if ((user?.email || "").toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "not authorized" }, { status: 401 });
  }

  let body: { playerId?: string; note?: string; source?: string; date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { playerId, note, source, date } = body;
  if (!playerId || !note?.trim()) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const safeSource = source === "kniff" ? "kniff" : "dana";

  const { error } = await supabase.from("coach_notes").insert({
    player_id: playerId,
    note: note.trim(),
    source: safeSource,
    date: date || new Date().toISOString().slice(0, 10),
  });

  if (error) {
    console.error("add-note error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
