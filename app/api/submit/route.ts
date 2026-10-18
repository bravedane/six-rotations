import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  let body: { checkpoint?: string; season?: string; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const checkpoint = body.checkpoint;
  const season = body.season;
  const answers = body.answers;

  if (!checkpoint || !season || !answers) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Never trust a typed email in the answers — overwrite with the authenticated email.
  const safeAnswers = { ...answers, email: user.email.toLowerCase() };

  const { data, error } = await supabase.rpc("submit_checkin", {
    p_checkpoint: checkpoint,
    p_season: season,
    p_answers: safeAnswers,
  });

  if (error) {
    console.error("submit_checkin error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkinId: data });
}
