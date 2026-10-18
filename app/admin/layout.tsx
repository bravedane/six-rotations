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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 80px" }}>
        <nav style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <a href="/admin" style={navStyle}>Roster</a>
          <a href="/admin/paste" style={navStyle}>Paste a texted answer</a>
        </nav>
        {children}
      </div>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  color: "#0064a4",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 15,
};
