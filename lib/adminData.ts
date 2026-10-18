import { createClient } from "@/lib/supabase/server";

const SEASON = process.env.NEXT_PUBLIC_SEASON || "2026-27";
export const CHECKPOINT_ORDER = ["preseason", "december", "postseason"];
export const CHECKPOINT_LABEL: Record<string, string> = {
  preseason: "Campaign Pre-Launch",
  december: "Midseason",
  postseason: "Post-season",
};

export type PlayerRecord = {
  id: string;
  name: string;
  email: string;
  positions: string[];
  year: string;
  checkins: {
    id: string;
    checkpoint: string;
    submitted_at: string;
    answers: Record<string, unknown>;
    score: {
      agency: number | null;
      competence: number | null;
      belonging: number | null;
      sleep: number | null;
      fuel: number | null;
      water: number | null;
      strength: number | null;
      recovery: number | null;
      focus: number | null;
      composure: number | null;
      connection: number | null;
      self_team: number | null;
      self_future: number | null;
      standard_team: number | null;
      standard_future: number | null;
      gap_team: number | null;
      gap_future: number | null;
    } | null;
  }[];
};

export async function loadRoster(): Promise<PlayerRecord[]> {
  const supabase = await createClient();

  const { data: players, error: playersErr } = await supabase
    .from("players")
    .select("id, name, uci_email")
    .order("name");
  if (playersErr) {
    console.error("loadRoster: players query failed", playersErr);
    throw new Error(`Couldn't load players: ${playersErr.message}`);
  }

  const { data: rosterSeasons, error: rosterErr } = await supabase
    .from("roster_seasons")
    .select("player_id, year_in_school, positions")
    .eq("season", SEASON);
  if (rosterErr) console.error("loadRoster: roster_seasons query failed", rosterErr);

  const { data: checkins, error: checkinsErr } = await supabase
    .from("checkins")
    .select("id, player_id, checkpoint, submitted_at, answers")
    .eq("season", SEASON);
  if (checkinsErr) console.error("loadRoster: checkins query failed", checkinsErr);

  const checkinIds = (checkins || []).map((c) => c.id);
  const { data: scores, error: scoresErr } = checkinIds.length
    ? await supabase.from("core_scores").select("*").in("checkin_id", checkinIds)
    : { data: [], error: null };
  if (scoresErr) console.error("loadRoster: core_scores query failed", scoresErr);

  const scoreByCheckin = new Map((scores || []).map((s) => [s.checkin_id, s]));
  const rosterByPlayer = new Map((rosterSeasons || []).map((r) => [r.player_id, r]));

  return (players || []).map((p) => {
    const rs = rosterByPlayer.get(p.id);
    const playerCheckins = (checkins || [])
      .filter((c) => c.player_id === p.id)
      .sort((a, b) => CHECKPOINT_ORDER.indexOf(a.checkpoint) - CHECKPOINT_ORDER.indexOf(b.checkpoint))
      .map((c) => ({
        id: c.id,
        checkpoint: c.checkpoint,
        submitted_at: c.submitted_at,
        answers: (c.answers as Record<string, unknown>) || {},
        score: scoreByCheckin.get(c.id) ?? null,
      }));

    return {
      id: p.id,
      name: p.name || "",
      email: p.uci_email,
      positions: Array.isArray(rs?.positions) ? (rs!.positions as string[]) : [],
      year: rs?.year_in_school || "",
      checkins: playerCheckins,
    };
  });
}

export function latestCheckin(player: PlayerRecord) {
  return player.checkins[player.checkins.length - 1] ?? null;
}

export function priorCheckin(player: PlayerRecord) {
  return player.checkins[player.checkins.length - 2] ?? null;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
