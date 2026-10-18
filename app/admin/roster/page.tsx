import { loadRoster, latestCheckin, CHECKPOINT_LABEL } from "@/lib/adminData";
import RosterTable, { RosterRow } from "../RosterTable";

export default async function RosterPage() {
  const players = await loadRoster();

  const rows: RosterRow[] = players.map((p) => {
    const latest = latestCheckin(p);
    const s = latest?.score ?? null;
    const gapTeam = s?.gap_team ?? null;
    const gapFuture = s?.gap_future ?? null;
    const flagged = Math.abs(gapTeam ?? 0) >= 1.5 || Math.abs(gapFuture ?? 0) >= 1.5;

    return {
      playerId: p.id,
      name: p.name,
      email: p.email,
      checkpointsSubmitted: p.checkins.map((c) => CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint),
      checkpoint: latest ? CHECKPOINT_LABEL[latest.checkpoint] || latest.checkpoint : null,
      submittedAt: latest?.submitted_at ?? null,
      selfTeam: s?.self_team ?? null,
      standardTeam: s?.standard_team ?? null,
      gapTeam,
      selfFuture: s?.self_future ?? null,
      standardFuture: s?.standard_future ?? null,
      gapFuture,
      flagged,
    };
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Roster — the full numbers</h1>
      <p style={{ color: "#566377", marginTop: 0, marginBottom: 20, maxWidth: 680 }}>
        Latest check-in per player. Self-grade vs. standard score, and the gap between them. A gap
        of 1.5 or more in either direction is flagged — a conversation starter, not a verdict. Tap a
        player for his full record.
      </p>
      <RosterTable rows={rows} />
    </div>
  );
}
