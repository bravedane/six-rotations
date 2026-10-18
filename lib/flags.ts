// Shared "who needs a conversation first" logic — per data-map.md.
// Kept in one place so the overview page and any other view use the same rules.

export type CheckinLite = {
  id: string;
  season: string;
  checkpoint: string;
  submitted_at: string;
  answers: Record<string, unknown>;
};

export type ScoreLite = {
  checkin_id: string;
  agency: number | null;
  competence: number | null;
  belonging: number | null;
  gap_team: number | null;
  gap_future: number | null;
};

export type FlagReason =
  | "belonging_low"
  | "dropped_2plus"
  | "hard_to_see_win"
  | "three_storms"
  | "wants_one_on_one"
  | "gap_1_5plus";

export const FLAG_LABEL: Record<FlagReason, string> = {
  belonging_low: "Belonging rated 2 or lower",
  dropped_2plus: "Agency, competence, or belonging dropped 2+ points since last check-in",
  hard_to_see_win: "Picked \u201cHonestly, it's hard to see a win there\u201d",
  three_storms: "Named 3 storms",
  wants_one_on_one: "Said yes to a one-on-one",
  gap_1_5plus: "Self-grade gap of 1.5 or more",
};

const CHECKPOINT_ORDER = ["preseason", "december", "postseason"];

function stormCount(answers: Record<string, unknown>): number {
  const storms = answers?.storms;
  return Array.isArray(storms) ? storms.length : 0;
}

function pickedHardWin(answers: Record<string, unknown>): boolean {
  const goodday = answers?.goodday;
  return Array.isArray(goodday) && goodday.includes("Honestly, it's hard to see a win there");
}

function wantsOneOnOne(answers: Record<string, unknown>): boolean {
  // Post-season screen 5 asks "Do you want a one-on-one with Dana before summer?" — we don't
  // have a guaranteed exact key name, so check a few likely ones defensively.
  const candidates = ["oneOnOne", "one_on_one", "wantsOneOnOne", "talkToDana"];
  for (const key of candidates) {
    const v = answers?.[key];
    if (typeof v === "string" && v.toLowerCase() === "yes") return true;
    if (Array.isArray(v) && v.map(String).some((x) => x.toLowerCase() === "yes")) return true;
  }
  return false;
}

export function computeFlags(
  playerCheckins: CheckinLite[],
  scoreByCheckin: Map<string, ScoreLite>
): { reasons: FlagReason[]; latestCheckin: CheckinLite | null } {
  const sorted = [...playerCheckins].sort(
    (a, b) => CHECKPOINT_ORDER.indexOf(a.checkpoint) - CHECKPOINT_ORDER.indexOf(b.checkpoint)
  );
  const latest = sorted[sorted.length - 1] ?? null;
  const prior = sorted[sorted.length - 2] ?? null;
  if (!latest) return { reasons: [], latestCheckin: null };

  const reasons: FlagReason[] = [];
  const s = scoreByCheckin.get(latest.id);

  if (s && typeof s.belonging === "number" && s.belonging <= 2) reasons.push("belonging_low");

  if (prior) {
    const ps = scoreByCheckin.get(prior.id);
    if (s && ps) {
      const dropped =
        (typeof s.agency === "number" && typeof ps.agency === "number" && ps.agency - s.agency >= 2) ||
        (typeof s.competence === "number" && typeof ps.competence === "number" && ps.competence - s.competence >= 2) ||
        (typeof s.belonging === "number" && typeof ps.belonging === "number" && ps.belonging - s.belonging >= 2);
      if (dropped) reasons.push("dropped_2plus");
    }
  }

  if (pickedHardWin(latest.answers)) reasons.push("hard_to_see_win");
  if (stormCount(latest.answers) >= 3) reasons.push("three_storms");
  if (wantsOneOnOne(latest.answers)) reasons.push("wants_one_on_one");

  if (s) {
    const gapTeam = s.gap_team ?? 0;
    const gapFuture = s.gap_future ?? 0;
    if (Math.abs(gapTeam) >= 1.5 || Math.abs(gapFuture) >= 1.5) reasons.push("gap_1_5plus");
  }

  return { reasons, latestCheckin: latest };
}
