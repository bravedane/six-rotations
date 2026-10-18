import Link from "next/link";
import { loadRoster, latestCheckin, priorCheckin, CHECKPOINT_LABEL } from "@/lib/adminData";
import { computeFlags, FLAG_LABEL } from "@/lib/flags";
import TeamOverview from "./TeamOverview";

export default async function TeamPage() {
  const players = await loadRoster();

  const cards = players.map((p) => {
    const latest = latestCheckin(p);
    const prior = priorCheckin(p);
    const scoreByCheckin = new Map(
      p.checkins.filter((c) => c.score).map((c) => [c.id, { checkin_id: c.id, ...c.score! }])
    );
    const { reasons } = computeFlags(
      p.checkins.map((c) => ({ id: c.id, season: "", checkpoint: c.checkpoint, submitted_at: c.submitted_at, answers: c.answers })),
      scoreByCheckin
    );

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      positions: p.positions,
      year: p.year,
      checkpointsSubmitted: p.checkins.map((c) => CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint),
      latestCheckpoint: latest ? CHECKPOINT_LABEL[latest.checkpoint] || latest.checkpoint : null,
      agency: latest?.score?.agency ?? null,
      competence: latest?.score?.competence ?? null,
      belonging: latest?.score?.belonging ?? null,
      priorAgency: prior?.score?.agency ?? null,
      priorCompetence: prior?.score?.competence ?? null,
      priorBelonging: prior?.score?.belonging ?? null,
      gapTeam: latest?.score?.gap_team ?? null,
      gapFuture: latest?.score?.gap_future ?? null,
      flagCount: reasons.length,
      flagLabels: reasons.map((r) => FLAG_LABEL[r]),
    };
  });

  const allPositions = Array.from(new Set(players.flatMap((p) => p.positions))).sort();

  const teamAvg = (key: "agency" | "competence" | "belonging") => {
    const vals = cards.map((c) => c[key]).filter((v): v is number => v !== null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 30, marginBottom: 4 }}>Team</h1>
        <p style={{ color: "#566377", marginTop: 0, maxWidth: 680 }}>
          Every athlete, one view. Filter by position or flag, scan agency / competence /
          belonging at a glance, and tap into anyone for his full record.{" "}
          <Link href="/admin/talk-to-first" style={{ color: "#0064a4", fontWeight: 600 }}>
            See who to talk to first →
          </Link>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24, maxWidth: 560 }}>
        <TeamStat label="Agency" value={teamAvg("agency")} />
        <TeamStat label="Competence" value={teamAvg("competence")} />
        <TeamStat label="Belonging" value={teamAvg("belonging")} />
      </div>

      <TeamOverview cards={cards} positions={allPositions} />
    </div>
  );
}

function TeamStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d5dde8", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#566377" }}>
        Team {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value === null ? "—" : value.toFixed(1)}</div>
    </div>
  );
}
