import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public, no sign-in required — low friction by design. The player types his own
// name + UCI email directly into the form; that's what gets saved as his permanent ID.
// Format is validated here (must end in @uci.edu, or be the admin's own address for
// testing) so a garbage address can't silently create a bad record.
export async function POST(req: Request) {
  const supabase = await createClient();

  let body: {
    checkpoint?: string;
    season?: string;
    answers?: Record<string, unknown>;
    player?: { email?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const checkpoint = body.checkpoint;
  const season = body.season;
  const answers = body.answers;
  const email = (body.player?.email || (answers?.email as string) || "").trim().toLowerCase();

  if (!checkpoint || !season || !answers) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const emailOk = /^[^@\s]+@uci\.edu$/i.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: "email must be a uci.edu address" }, { status: 400 });
  }

  const safeAnswers = { ...answers, email };

  const { data, error } = await supabase.rpc("public_submit_checkin", {
    p_email: email,
    p_checkpoint: checkpoint,
    p_season: season,
    p_answers: safeAnswers,
  });

  if (error) {
    console.error("public_submit_checkin error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkinId: data });
}
