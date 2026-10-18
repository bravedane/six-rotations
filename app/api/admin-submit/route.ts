import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  if (!user?.email || user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "not authorized" }, { status: 403 });
  }

  let body: { email?: string; checkpoint?: string; season?: string; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { email, checkpoint, season, answers } = body;
  if (!email || !checkpoint || !season || !answers) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("admin_submit_checkin", {
    p_player_email: email,
    p_checkpoint: checkpoint,
    p_season: season,
    p_answers: answers,
  });

  if (error) {
    console.error("admin_submit_checkin error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkinId: data });
}
