"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  const isUci = /^[^@\s]+@uci\.edu$/i.test(email.trim());
  const isAdmin = email.trim().toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  const valid = isUci || isAdmin;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setMsg(isAdmin ? "" : "Use your UCI email — it has to end in @uci.edu.");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMsg("Something went wrong sending the link. Try again in a minute.");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>SIX ROTATIONS</div>
        <h1 style={styles.h1}>Sign in</h1>
        {status === "sent" ? (
          <p style={styles.lede}>
            Check your email — we sent a sign-in link to <b>{email.trim()}</b>. Tap it on this phone to
            continue.
          </p>
        ) : (
          <form onSubmit={send} style={styles.form}>
            <p style={styles.lede}>Players, use your UCI email. No password — we&apos;ll email you a link.</p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@uci.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            {msg && <p style={styles.err}>{msg}</p>}
            <button type="submit" disabled={status === "sending" || !email} style={styles.btn}>
              {status === "sending" ? "Sending…" : "Send me a sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f6fa",
    fontFamily: "Public Sans, system-ui, sans-serif",
    padding: 20,
  },
  card: {
    maxWidth: 420,
    width: "100%",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #d5dde8",
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  eyebrow: {
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#0064a4",
    fontSize: 13,
  },
  h1: { margin: 0, fontSize: 32, color: "#0d1e33" },
  lede: { color: "#566377", margin: 0, lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    font: "inherit",
    fontSize: 16,
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #d5dde8",
  },
  err: { color: "#c0392b", fontSize: 14, margin: 0 },
  btn: {
    background: "#ffd200",
    color: "#0d1e33",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 18,
    padding: "13px 20px",
    cursor: "pointer",
  },
};
