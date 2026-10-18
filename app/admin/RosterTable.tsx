"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type RosterRow = {
  playerId: string;
  name: string;
  email: string;
  checkpointsSubmitted: string[];
  checkpoint: string | null;
  submittedAt: string | null;
  selfTeam: number | null;
  standardTeam: number | null;
  gapTeam: number | null;
  selfFuture: number | null;
  standardFuture: number | null;
  gapFuture: number | null;
  flagged: boolean;
};

type SortKey = "name" | "gapTeam" | "gapFuture" | "submittedAt";

function fmt(n: number | null) {
  return n === null || n === undefined ? "—" : n.toFixed(1);
}

export default function RosterTable({ rows }: { rows: RosterRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [dir, setDir] = useState<1 | -1>(1);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const sorted = useMemo(() => {
    let r = [...rows];
    if (flaggedOnly) r = r.filter((x) => x.flagged);
    r.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (sortKey === "submittedAt") {
        av = a.submittedAt || "";
        bv = b.submittedAt || "";
      } else {
        const abs = (x: RosterRow) =>
          Math.max(Math.abs(x.gapTeam ?? 0), Math.abs(x.gapFuture ?? 0));
        av = sortKey === "gapTeam" ? Math.abs(a.gapTeam ?? -999) : abs(a);
        bv = sortKey === "gapTeam" ? Math.abs(b.gapTeam ?? -999) : abs(b);
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return r;
  }, [rows, sortKey, dir, flaggedOnly]);

  function headerClick(key: SortKey) {
    if (sortKey === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setDir(1);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: "#566377" }}>
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
          />
          Flagged only (gap of 1.5 or more)
        </label>
        <div style={{ fontSize: 13, color: "#566377" }}>{sorted.length} shown</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 820 }}>
          <div style={rowStyle("header")}>
            <Th label="Player" onClick={() => headerClick("name")} />
            <div style={cellHeader}>Checked in</div>
            <div style={cellHeader}>Self · team</div>
            <div style={cellHeader}>Standard · team</div>
            <Th label="Gap · team" onClick={() => headerClick("gapTeam")} />
            <div style={cellHeader}>Self · future</div>
            <div style={cellHeader}>Standard · future</div>
            <Th label="Gap · future" onClick={() => headerClick("gapFuture")} />
          </div>
          {sorted.map((r) => (
            <Link
              key={r.playerId}
              href={`/admin/player/${r.playerId}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={rowStyle(r.flagged ? "flagged" : "normal")}>
                <div style={cell}>
                  <div style={{ fontWeight: 600 }}>{r.name || "—"}</div>
                  <div style={{ fontSize: 12, color: "#566377" }}>{r.email}</div>
                </div>
                <div style={cell}>
                  {r.checkpointsSubmitted.length ? r.checkpointsSubmitted.join(", ") : "none yet"}
                </div>
                <div style={cell}>{fmt(r.selfTeam)}</div>
                <div style={cell}>{fmt(r.standardTeam)}</div>
                <div style={{ ...cell, fontWeight: Math.abs(r.gapTeam ?? 0) >= 1.5 ? 700 : 400, color: Math.abs(r.gapTeam ?? 0) >= 1.5 ? "#c0392b" : "#0d1e33" }}>
                  {fmt(r.gapTeam)}
                </div>
                <div style={cell}>{fmt(r.selfFuture)}</div>
                <div style={cell}>{fmt(r.standardFuture)}</div>
                <div style={{ ...cell, fontWeight: Math.abs(r.gapFuture ?? 0) >= 1.5 ? 700 : 400, color: Math.abs(r.gapFuture ?? 0) >= 1.5 ? "#c0392b" : "#0d1e33" }}>
                  {fmt(r.gapFuture)}
                </div>
              </div>
            </Link>
          ))}
          {sorted.length === 0 && (
            <div style={{ padding: 24, color: "#566377", textAlign: "center" }}>No check-ins yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cellHeader,
        all: "unset",
        cursor: "pointer",
        fontWeight: 700,
      }}
    >
      {label} ↕
    </button>
  );
}

function rowStyle(kind: "header" | "normal" | "flagged"): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr 0.8fr 0.9fr 0.8fr 0.8fr 0.9fr 0.8fr",
    alignItems: "center",
    padding: "10px 12px",
    background: kind === "header" ? "transparent" : kind === "flagged" ? "#fdecea" : "#fff",
    borderBottom: "1px solid #d5dde8",
    fontSize: 14,
  };
}
const cell: React.CSSProperties = { padding: "4px 6px" };
const cellHeader: React.CSSProperties = { padding: "4px 6px", fontSize: 12, color: "#566377", textTransform: "uppercase", letterSpacing: "0.04em" };
