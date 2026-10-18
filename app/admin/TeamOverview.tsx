"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Card = {
  id: string;
  name: string;
  email: string;
  positions: string[];
  year: string;
  checkpointsSubmitted: string[];
  latestCheckpoint: string | null;
  agency: number | null;
  competence: number | null;
  belonging: number | null;
  priorAgency: number | null;
  priorCompetence: number | null;
  priorBelonging: number | null;
  gapTeam: number | null;
  gapFuture: number | null;
  flagCount: number;
  flagLabels: string[];
};

type ViewMode = "grid" | "table";

function fmt(n: number | null) {
  return n === null ? "—" : n.toFixed(1);
}

function trendArrow(curr: number | null, prior: number | null) {
  if (curr === null || prior === null) return null;
  const diff = curr - prior;
  if (Math.abs(diff) < 0.25) return <span style={{ color: "#8a97a8" }}>→</span>;
  if (diff > 0) return <span style={{ color: "#1a7f37" }}>↑</span>;
  return <span style={{ color: "#c0392b" }}>↓</span>;
}

export default function TeamOverview({ cards, positions }: { cards: Card[]; positions: string[] }) {
  const [view, setView] = useState<ViewMode>("grid");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [checkedInOnly, setCheckedInOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "belonging" | "flags">("name");

  const filtered = useMemo(() => {
    let r = [...cards];
    if (positionFilter !== "all") r = r.filter((c) => c.positions.includes(positionFilter));
    if (flaggedOnly) r = r.filter((c) => c.flagCount > 0);
    if (checkedInOnly) r = r.filter((c) => c.checkpointsSubmitted.length > 0);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      r = r.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    r.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "flags") return b.flagCount - a.flagCount;
      return (a.belonging ?? 99) - (b.belonging ?? 99);
    });
    return r;
  }, [cards, positionFilter, flaggedOnly, checkedInOnly, query, sortKey]);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
        />
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} style={inputStyle}>
          <option value="all">All positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} style={inputStyle}>
          <option value="name">Sort: Name</option>
          <option value="belonging">Sort: Belonging (low first)</option>
          <option value="flags">Sort: Flags (most first)</option>
        </select>
        <label style={checkboxLabel}>
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
        <label style={checkboxLabel}>
          <input type="checkbox" checked={checkedInOnly} onChange={(e) => setCheckedInOnly(e.target.checked)} />
          Checked in only
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "#eaf0f7", borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView("grid")} style={toggleBtn(view === "grid")}>Grid</button>
          <button onClick={() => setView("table")} style={toggleBtn(view === "table")}>Table</button>
        </div>
        <div style={{ fontSize: 13, color: "#566377" }}>{filtered.length} shown</div>
      </div>

      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map((c) => (
            <Link key={c.id} href={`/admin/player/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ ...cardStyle, ...(c.flagCount > 0 ? { borderColor: "#f0b4ac", background: "#fffaf9" } : {}) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name || "(no name)"}</div>
                    <div style={{ fontSize: 12, color: "#566377" }}>
                      {c.positions.join(", ") || "—"}{c.year ? ` · ${c.year}` : ""}
                    </div>
                  </div>
                  {c.flagCount > 0 && (
                    <span style={flagBadge}>{c.flagCount} flag{c.flagCount > 1 ? "s" : ""}</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <MiniStat label="Agency" value={c.agency} trend={trendArrow(c.agency, c.priorAgency)} />
                  <MiniStat label="Competence" value={c.competence} trend={trendArrow(c.competence, c.priorCompetence)} />
                  <MiniStat label="Belonging" value={c.belonging} trend={trendArrow(c.belonging, c.priorBelonging)} />
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: "#566377" }}>
                  {c.checkpointsSubmitted.length ? c.checkpointsSubmitted.join(" · ") : "No check-ins yet"}
                </div>
                {c.flagCount > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#9a3b32" }}>
                    {c.flagLabels[0]}{c.flagCount > 1 ? ` +${c.flagCount - 1} more` : ""}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <EmptyState />}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 820 }}>
            <div style={tableRow("header")}>
              <div style={tableCellHeader}>Player</div>
              <div style={tableCellHeader}>Checked in</div>
              <div style={tableCellHeader}>Agency</div>
              <div style={tableCellHeader}>Competence</div>
              <div style={tableCellHeader}>Belonging</div>
              <div style={tableCellHeader}>Gap · team</div>
              <div style={tableCellHeader}>Gap · future</div>
              <div style={tableCellHeader}>Flags</div>
            </div>
            {filtered.map((c) => (
              <Link key={c.id} href={`/admin/player/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={tableRow(c.flagCount > 0 ? "flagged" : "normal")}>
                  <div style={tableCell}>
                    <div style={{ fontWeight: 600 }}>{c.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#566377" }}>{c.positions.join(", ")}</div>
                  </div>
                  <div style={tableCell}>{c.checkpointsSubmitted.join(", ") || "none yet"}</div>
                  <div style={tableCell}>{fmt(c.agency)}</div>
                  <div style={tableCell}>{fmt(c.competence)}</div>
                  <div style={tableCell}>{fmt(c.belonging)}</div>
                  <div style={{ ...tableCell, fontWeight: Math.abs(c.gapTeam ?? 0) >= 1.5 ? 700 : 400, color: Math.abs(c.gapTeam ?? 0) >= 1.5 ? "#c0392b" : "#0d1e33" }}>{fmt(c.gapTeam)}</div>
                  <div style={{ ...tableCell, fontWeight: Math.abs(c.gapFuture ?? 0) >= 1.5 ? 700 : 400, color: Math.abs(c.gapFuture ?? 0) >= 1.5 ? "#c0392b" : "#0d1e33" }}>{fmt(c.gapFuture)}</div>
                  <div style={tableCell}>{c.flagCount > 0 ? c.flagCount : "—"}</div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && <EmptyState />}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: number | null; trend: React.ReactNode }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "#8a97a8", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        {fmt(value)} {trend}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 32, textAlign: "center", color: "#566377", gridColumn: "1 / -1" }}>
      No players match these filters.
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d5dde8",
  fontSize: 13,
  background: "#fff",
};
const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "#566377",
};
function toggleBtn(active: boolean): React.CSSProperties {
  return {
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#0d1e33" : "#566377",
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
  };
}
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #d5dde8",
  borderRadius: 12,
  padding: 16,
  height: "100%",
};
const flagBadge: React.CSSProperties = {
  background: "#fdecea",
  color: "#9a3b32",
  fontSize: 11,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 20,
  whiteSpace: "nowrap",
};
function tableRow(kind: "header" | "normal" | "flagged"): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "1.6fr 1.2fr 0.8fr 0.9fr 0.8fr 0.8fr 0.8fr 0.6fr",
    alignItems: "center",
    padding: "10px 12px",
    background: kind === "header" ? "transparent" : kind === "flagged" ? "#fdecea" : "#fff",
    borderBottom: "1px solid #d5dde8",
    fontSize: 14,
  };
}
const tableCell: React.CSSProperties = { padding: "4px 6px" };
const tableCellHeader: React.CSSProperties = {
  padding: "4px 6px",
  fontSize: 12,
  color: "#566377",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
