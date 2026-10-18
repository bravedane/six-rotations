"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Note = {
  id: string;
  date: string;
  note: string;
  source: "dana" | "kniff";
};

const SOURCE_LABEL: Record<string, string> = {
  dana: "Dana",
  kniff: "Coach Kniffin",
};

export default function NotesSection({ playerId, notes }: { playerId: string; notes: Note[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"dana" | "kniff">("dana");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, note: text, source }),
      });
      if (!res.ok) throw new Error("save failed");
      setText("");
      router.refresh();
    } catch {
      setError("Couldn't save that note. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {notes.length === 0 && <p style={{ color: "#566377", fontSize: 14 }}>No notes yet.</p>}
      {notes.map((n) => (
        <div key={n.id} style={{ fontSize: 14, marginBottom: 10, borderBottom: "1px solid #eaf0f7", paddingBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
            <span style={badgeStyle(n.source)}>{SOURCE_LABEL[n.source] || n.source}</span>
            <span style={{ color: "#8a97a8", fontSize: 12 }}>{n.date}</span>
          </div>
          <div>{n.note}</div>
        </div>
      ))}

      <div style={{ marginTop: 16, borderTop: "1px solid #eaf0f7", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setSource("dana")}
            style={sourceToggle(source === "dana")}
          >
            From Dana
          </button>
          <button
            type="button"
            onClick={() => setSource("kniff")}
            style={sourceToggle(source === "kniff")}
          >
            Kniff Notes
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={source === "kniff" ? "What Kniff shared about this player…" : "Your own note…"}
          style={{
            width: "100%",
            minHeight: 70,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #d5dde8",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />
        {error && <p style={{ color: "#c0392b", fontSize: 13, margin: "4px 0" }}>{error}</p>}
        <button
          type="button"
          onClick={addNote}
          disabled={saving || !text.trim()}
          style={{
            marginTop: 8,
            border: "none",
            background: saving || !text.trim() ? "#eaf0f7" : "#ffd200",
            color: "#0d1e33",
            fontWeight: 700,
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            cursor: saving || !text.trim() ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Add note"}
        </button>
      </div>
    </div>
  );
}

function badgeStyle(source: string): React.CSSProperties {
  const isKniff = source === "kniff";
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    background: isKniff ? "#eaf3ea" : "#eaf0f7",
    color: isKniff ? "#1a7f37" : "#0064a4",
  };
}

function sourceToggle(active: boolean): React.CSSProperties {
  return {
    border: "1px solid " + (active ? "#0064a4" : "#d5dde8"),
    background: active ? "#0064a4" : "#fff",
    color: active ? "#fff" : "#566377",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 20,
    cursor: "pointer",
  };
}
