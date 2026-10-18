"use client";

import { useState } from "react";

const SEASON = process.env.NEXT_PUBLIC_SEASON || "2026-27";

// Parses a pasted "SIX ROTATIONS CHECK-IN" text summary (the exact format the
// Copy My Answers button produces) back into the same answers shape submit_checkin expects.
function parseSummary(text: string): { email: string; name: string; answers: Record<string, unknown> } | null {
  if (!/SIX ROTATIONS CHECK-IN/i.test(text)) return null;

  const lines = text.split("\n");
  const get = (label: string) => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith(label.toLowerCase()));
    return line ? line.split(":").slice(1).join(":").trim() : "";
  };
  const list = (s: string) =>
    s && s !== "—" ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

  const nameLine = lines[0] || "";
  const name = nameLine.split("—")[1]?.trim() || "";

  const emailMatch = text.match(/[^\s]+@uci\.edu/i);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  const posYear = get("Position");
  const [positionPart, yearPart] = posYear.split("|").map((s) => s.trim());
  const position = positionPart ? list(positionPart.replace(/^Position:?\s*/i, "")) : [];
  const year = yearPart ? list(yearPart.replace(/^Year:?\s*/i, "")) : [];

  const sdtLine = lines.find((l) => /^Agency/.test(l.trim())) || "";
  const sdtNums = sdtLine.match(/(\d)\/5/g) || [];
  const sdt = {
    agency: sdtNums[0] ? parseInt(sdtNums[0]) : undefined,
    competence: sdtNums[1] ? parseInt(sdtNums[1]) : undefined,
    belonging: sdtNums[2] ? parseInt(sdtNums[2]) : undefined,
  };

  const scoreNames = [
    ["Sleep", "sleep"],
    ["Fuel", "fuel"],
    ["Hydration", "water"],
    ["Strength/power", "strength"],
    ["Recovery/mobility", "recovery"],
    ["Focus", "focus"],
    ["Composure", "composure"],
    ["Connection", "connection"],
  ];
  const scores: Record<string, number> = {};
  scoreNames.forEach(([label, key]) => {
    const line = lines.find((l) => l.trim().startsWith(label + ":"));
    if (line) {
      const v = line.split(":")[1]?.trim();
      if (v && v !== "—") scores[key] = parseInt(v);
    }
  });

  const selfLine = lines.find((l) => /^SELF-GRADE/.test(l.trim())) || "";
  const selfNums = selfLine.match(/(\d)\/5/g) || [];
  const self = {
    team: selfNums[0] ? parseInt(selfNums[0]) : undefined,
    future: selfNums[1] ? parseInt(selfNums[1]) : undefined,
  };

  const answers: Record<string, unknown> = {
    name,
    email,
    position,
    year,
    words: list(get("Teammates would say")),
    why: list(get("WHY I PLAY")),
    sdt,
    goodday: list(get("A WIN WHEN I DON'T PLAY")),
    scores,
    wants: list(get("WHAT I WANT TO OWN")),
    going: list(get("WHERE I'M GOING")),
    knownfor: get("WHAT I WANT THEM TO SAY"),
    adv: list(get("UNFAIR ADVANTAGES")),
    gaps: list(get("GAPS")),
    gapcost: get("IF I FILLED ONE"),
    drift: list(get("WHERE THE DRIFT CREEPS IN")),
    storms: list(get("STORMS")),
    habits: list(get("HABITS I'D TRY")),
    load: list(get("CAPACITY").split("|")[0] || ""),
    when: list((get("CAPACITY").split("|")[1] || "").replace(/^\s*BEST TIME:?\s*/i, "")),
    push: list(get("PUSH ME LIKE THIS")),
    self,
  };

  return { email, name, answers };
}

export default function PastePage() {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseSummary>>(null);
  const [checkpoint, setCheckpoint] = useState("preseason");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");

  function handleParse() {
    const result = parseSummary(raw);
    if (!result || !result.email) {
      setMsg("Couldn't find a UCI email and the SIX ROTATIONS CHECK-IN header in that text. Paste the whole message, starting from \"SIX ROTATIONS CHECK-IN\".");
      setParsed(null);
      return;
    }
    setMsg("");
    setParsed(result);
  }

  async function handleSave() {
    if (!parsed) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/admin-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.email,
          checkpoint,
          season: SEASON,
          answers: parsed.answers,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "save failed");
      }
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Something went wrong saving this.");
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Paste a texted answer</h1>
      <p style={{ color: "#566377", marginTop: 0, maxWidth: 640 }}>
        If a player texts you his answers (starting with &quot;SIX ROTATIONS CHECK-IN&quot;, from the
        Copy My Answers button on the old survey link), paste the whole text below. It&apos;s scored
        exactly like any other check-in and shows up on his record and the roster.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 6 }}>
          Which check-in is this?
        </label>
        <select
          value={checkpoint}
          onChange={(e) => setCheckpoint(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #d5dde8" }}
        >
          <option value="preseason">Campaign Pre-Launch Check-In</option>
          <option value="december">December — Midseason Check-In</option>
          <option value="postseason">Post-season — Season in Review</option>
        </select>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste the full texted answer here, starting with SIX ROTATIONS CHECK-IN —"
        style={{
          width: "100%",
          minHeight: 220,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #d5dde8",
          fontFamily: "monospace",
          fontSize: 13,
        }}
      />

      {msg && <p style={{ color: "#c0392b", fontSize: 14 }}>{msg}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={handleParse} style={btnOutline}>
          Preview
        </button>
        {parsed && (
          <button onClick={handleSave} disabled={status === "saving" || status === "saved"} style={btnPrimary}>
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save this check-in"}
          </button>
        )}
      </div>

      {parsed && (
        <div style={{ marginTop: 20, background: "#fff", border: "1px solid #d5dde8", borderRadius: 10, padding: 16 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Preview</h2>
          <p style={{ fontSize: 14 }}>
            <b>Name:</b> {parsed.name || "—"} <br />
            <b>Email:</b> {parsed.email}
          </p>
          <pre style={{ fontSize: 12, background: "#f3f6fa", padding: 12, borderRadius: 8, overflowX: "auto" }}>
            {JSON.stringify(parsed.answers, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const btnOutline: React.CSSProperties = {
  border: "1px solid #d5dde8",
  background: "#fff",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  cursor: "pointer",
};
const btnPrimary: React.CSSProperties = {
  border: "none",
  background: "#ffd200",
  color: "#0d1e33",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
