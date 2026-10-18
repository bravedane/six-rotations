import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const CHECKPOINT_LABEL: Record<string, string> = {
  preseason: "Campaign Pre-Launch Check-In",
  december: "December — Midseason Check-In",
  postseason: "Post-season — Season in Review",
};
const CHECKPOINT_ORDER = ["preseason", "december", "postseason"];

function fmt(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : Number(n).toFixed(1);
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, name, uci_email, created_at")
    .eq("id", id)
    .single();

  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, season, checkpoint, submitted_at, source, answers")
    .eq("player_id", id)
    .order("submitted_at", { ascending: true });

  const checkinIds = (checkins || []).map((c) => c.id);
  const { data: scores } = checkinIds.length
    ? await supabase.from("core_scores").select("*").in("checkin_id", checkinIds)
    : { data: [] };
  const { data: picks } = checkinIds.length
    ? await supabase.from("core_picks").select("*").in("checkin_id", checkinIds)
    : { data: [] };
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("player_id", id)
    .order("chosen_at");
  const { data: notes } = await supabase
    .from("coach_notes")
    .select("*")
    .eq("player_id", id)
    .order("date", { ascending: false });

  const scoreByCheckin = new Map((scores || []).map((s) => [s.checkin_id, s]));
  const picksByCheckin = new Map<string, { kind: string; value: string }[]>();
  (picks || []).forEach((p) => {
    const arr = picksByCheckin.get(p.checkin_id) || [];
    arr.push(p);
    picksByCheckin.set(p.checkin_id, arr);
  });

  const sortedCheckins = [...(checkins || [])].sort(
    (a, b) => CHECKPOINT_ORDER.indexOf(a.checkpoint) - CHECKPOINT_ORDER.indexOf(b.checkpoint)
  );

  if (!player) {
    return <p>Player not found.</p>;
  }

  return (
    <div>
      <Link href="/admin" style={{ color: "#0064a4", fontSize: 14 }}>
        ← Back to roster
      </Link>
      <h1 style={{ fontSize: 30, marginBottom: 2, marginTop: 8 }}>{player.name || "(no name)"}</h1>
      <p style={{ color: "#566377", marginTop: 0 }}>{player.uci_email}</p>

      <section style={card}>
        <h2 style={h2}>Agency · Competence · Belonging, over time</h2>
        {sortedCheckins.length === 0 && <p style={muted}>No check-ins yet.</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Checkpoint</th>
                <th style={th}>Agency</th>
                <th style={th}>Competence</th>
                <th style={th}>Belonging</th>
                <th style={th}>Self · team</th>
                <th style={th}>Standard</th>
                <th style={th}>Gap</th>
                <th style={th}>Self · future</th>
                <th style={th}>Standard</th>
                <th style={th}>Gap</th>
              </tr>
            </thead>
            <tbody>
              {sortedCheckins.map((c) => {
                const s = scoreByCheckin.get(c.id);
                const flagged =
                  Math.abs(s?.gap_team ?? 0) >= 1.5 || Math.abs(s?.gap_future ?? 0) >= 1.5;
                return (
                  <tr key={c.id} style={{ background: flagged ? "#fdecea" : "transparent" }}>
                    <td style={td}>
                      {c.season} · {CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint}
                      {c.source === "pasted" && (
                        <span style={{ fontSize: 11, color: "#566377" }}> (pasted)</span>
                      )}
                    </td>
                    <td style={td}>{fmt(s?.agency)}</td>
                    <td style={td}>{fmt(s?.competence)}</td>
                    <td style={td}>{fmt(s?.belonging)}</td>
                    <td style={td}>{fmt(s?.self_team)}</td>
                    <td style={td}>{fmt(s?.standard_team)}</td>
                    <td style={{ ...td, fontWeight: Math.abs(s?.gap_team ?? 0) >= 1.5 ? 700 : 400 }}>
                      {fmt(s?.gap_team)}
                    </td>
                    <td style={td}>{fmt(s?.self_future)}</td>
                    <td style={td}>{fmt(s?.standard_future)}</td>
                    <td style={{ ...td, fontWeight: Math.abs(s?.gap_future ?? 0) >= 1.5 ? 700 : 400 }}>
                      {fmt(s?.gap_future)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Where you're at (1–5)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Checkpoint</th>
                <th style={th}>Sleep</th>
                <th style={th}>Fuel</th>
                <th style={th}>Hydration</th>
                <th style={th}>Strength</th>
                <th style={th}>Recovery</th>
                <th style={th}>Focus</th>
                <th style={th}>Composure</th>
                <th style={th}>Connection</th>
              </tr>
            </thead>
            <tbody>
              {sortedCheckins.map((c) => {
                const s = scoreByCheckin.get(c.id);
                return (
                  <tr key={c.id}>
                    <td style={td}>{CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint}</td>
                    <td style={td}>{fmt(s?.sleep)}</td>
                    <td style={td}>{fmt(s?.fuel)}</td>
                    <td style={td}>{fmt(s?.water)}</td>
                    <td style={td}>{fmt(s?.strength)}</td>
                    <td style={td}>{fmt(s?.recovery)}</td>
                    <td style={td}>{fmt(s?.focus)}</td>
                    <td style={td}>{fmt(s?.composure)}</td>
                    <td style={td}>{fmt(s?.connection)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Drift &amp; storms named, by checkpoint</h2>
        {sortedCheckins.map((c) => {
          const cp = picksByCheckin.get(c.id) || [];
          const drift = cp.filter((p) => p.kind === "drift").map((p) => p.value);
          const storms = cp.filter((p) => p.kind === "storm").map((p) => p.value);
          return (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint}</div>
              <div style={{ fontSize: 14, color: "#566377" }}>
                Drift: {drift.length ? drift.join(", ") : "—"}
                <br />
                Storms: {storms.length ? storms.join(", ") : "—"}
              </div>
            </div>
          );
        })}
      </section>

      <section style={card}>
        <h2 style={h2}>Habits chosen</h2>
        {(habits || []).length === 0 && <p style={muted}>None chosen yet.</p>}
        {(habits || []).map((h) => (
          <div key={h.id} style={{ fontSize: 14, marginBottom: 4 }}>
            <b>{h.habit}</b> ({h.need || "—"}) — status: {h.status}
            {h.december_fit ? `, fit: ${h.december_fit}` : ""}
          </div>
        ))}
      </section>

      <section style={card}>
        <h2 style={h2}>Dana's notes</h2>
        {(notes || []).length === 0 && <p style={muted}>No notes yet.</p>}
        {(notes || []).map((n) => (
          <div key={n.id} style={{ fontSize: 14, marginBottom: 8, borderBottom: "1px solid #eaf0f7", paddingBottom: 8 }}>
            <div style={{ color: "#566377", fontSize: 12 }}>{n.date}</div>
            <div>{n.note}</div>
          </div>
        ))}
      </section>

      <section style={card}>
        <h2 style={h2}>Raw answers, by checkpoint</h2>
        {sortedCheckins.map((c) => (
          <details key={c.id} style={{ marginBottom: 10 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
              {CHECKPOINT_LABEL[c.checkpoint] || c.checkpoint} — submitted{" "}
              {new Date(c.submitted_at).toLocaleDateString()}
            </summary>
            <pre style={pre}>{JSON.stringify(c.answers, null, 2)}</pre>
          </details>
        ))}
      </section>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #d5dde8",
  borderRadius: 10,
  padding: 18,
  marginBottom: 16,
};
const h2: React.CSSProperties = { fontSize: 17, marginTop: 0 };
const muted: React.CSSProperties = { color: "#566377", fontSize: 14 };
const table: React.CSSProperties = { borderCollapse: "collapse", width: "100%", fontSize: 13 };
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  color: "#566377",
  fontSize: 11,
  textTransform: "uppercase",
  borderBottom: "1px solid #d5dde8",
};
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #eaf0f7" };
const pre: React.CSSProperties = {
  fontSize: 12,
  background: "#f3f6fa",
  padding: 12,
  borderRadius: 8,
  overflowX: "auto",
};
