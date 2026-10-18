import Link from "next/link";
import { loadRoster, latestCheckin, CHECKPOINT_LABEL } from "@/lib/adminData";
import { computeFlags, FLAG_LABEL } from "@/lib/flags";

export default async function TalkToFirstPage() {
  const players = await loadRoster();

  const rows = players
    .map((p) => {
      const scoreByCheckin = new Map(
        p.checkins.filter((c) => c.score).map((c) => [c.id, { checkin_id: c.id, ...c.score! }])
      );
      const { reasons, latestCheckin: lc } = computeFlags(
        p.checkins.map((c) => ({ id: c.id, season: "", checkpoint: c.checkpoint, submitted_at: c.submitted_at, answers: c.answers })),
        scoreByCheckin
      );
      return { player: p, reasons, latest: lc };
    })
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const latestOf = (id: string) => latestCheckin(players.find((p) => p.id === id)!);

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Who to talk to first</h1>
      <p style={{ color: "#566377", marginTop: 0, marginBottom: 20, maxWidth: 680 }}>
        These are prompts for care, not grades. Each name below tripped at least one signal from
        his most recent check-in. The reason is shown so you know what to lead with.
      </p>

      {rows.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "#566377", background: "#fff", border: "1px solid #d5dde8", borderRadius: 12 }}>
          Nobody is flagged right now.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(({ player, reasons }) => {
          const latest = latestOf(player.id);
          return (
            <Link key={player.id} href={`/admin/player/${player.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{player.name || "(no name)"}</div>
                    <div style={{ fontSize: 12, color: "#566377" }}>
                      {player.positions.join(", ") || "—"}
                      {latest ? ` · ${CHECKPOINT_LABEL[latest.checkpoint] || latest.checkpoint}` : ""}
                    </div>
                  </div>
                  <span style={countBadge}>{reasons.length} signal{reasons.length > 1 ? "s" : ""}</span>
                </div>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 14, color: "#9a3b32" }}>
                  {reasons.map((r) => (
                    <li key={r}>{FLAG_LABEL[r]}</li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fffaf9",
  border: "1px solid #f0b4ac",
  borderRadius: 12,
  padding: 16,
};
const countBadge: React.CSSProperties = {
  background: "#fdecea",
  color: "#9a3b32",
  fontSize: 12,
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: 20,
  whiteSpace: "nowrap",
};
