export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f3f6fa",
        fontFamily: "Public Sans, system-ui, sans-serif",
        color: "#0d1e33",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", color: "#0064a4" }}>
            SIX ROTATIONS
          </div>
          <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="/admin" style={navStyle}>Team</a>
            <a href="/admin/roster" style={navStyle}>Roster</a>
            <a href="/admin/talk-to-first" style={navStyle}>Talk to first</a>
            <a href="/admin/paste" style={navStyle}>Paste a texted answer</a>
            <a href="/checkin" style={{ ...navStyle, color: "#9a5f00" }}>Preview player check-in →</a>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  color: "#0064a4",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 14,
};
