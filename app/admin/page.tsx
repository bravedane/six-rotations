import { createClient } from "@/lib/supabase/server";
import RosterTable, { RosterRow } from "./RosterTable";

const SEASON = process.env.NEXT_PUBLIC_SEASON || "2026-27";
const CHECKPOINT_ORDER = ["preseason", "december", "postseason"];

export default async function AdminRosterPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, name, uci_email")
    .order("name");

  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, player_id, checkpoint, submitted_at, season")
    .eq("season", SEASON);

  const checkinIds = (checkins || []).map((c) => c.id);
  const { data: scores } = checkinIds.length
    ? await supabase
        .from("core_scores")
        .select("checkin_id, self_team, standard_team, gap_team, self_future, standard_future, gap_future")
        .in("checkin_id", checkinIds)
    : { data: [] };

  const scoreByCheckin = new Map((scores || []).map((s) => [s.checkin_id, s]));

  const rows: RosterRow[] = (players || []).map((p) => {
    const playerCheckins = (checkins || [])
      .filter((c) => c.player_id === p.id)
      .sort(
        (a, b) =>
          CHECKPOINT_ORDER.indexOf(b.checkpoint) - CHECKPOINT_ORDER.indexOf(a.checkpoint)
      );

    const latest = playerCheckins[0];
    const latestScore = latest ? scoreByCheckin.get(latest.id) : undefined;

    const gapTeam = latestScore?.gap_team ?? null;
    const gapFuture = latestScore?.gap_future ?? null;
    const flagged = Math.abs(gapTeam ?? 0) >= 1.5 || Math.abs(gapFuture ?? 0) >= 1.5;

    return {
      playerId: p.id,
      name: p.name || "",
      email: p.uci_email,
      checkpointsSubmitted: playerCheckins.map((c) => c.checkpoint),
      checkpoint: latest?.checkpoint ?? null,
      submittedAt: latest?.submitted_at ?? null,
      selfTeam: latestScore?.self_team ?? null,
      standardTeam: latestScore?.standard_team ?? null,
      gapTeam,
      selfFuture: latestScore?.self_future ?? null,
      standardFuture: latestScore?.standard_future ?? null,
      gapFuture,
      flagged,
    };
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Roster — {SEASON}</h1>
      <p style={{ color: "#566377", marginTop: 0, marginBottom: 20 }}>
        Latest check-in per player. Self-grade vs. standard score, and the gap between them. A gap
        of 1.5 or more in either direction is flagged — a conversation starter, not a verdict. Tap a
        player for his full record.
      </p>
      <RosterTable rows={rows} />
    </div>
  );
}
