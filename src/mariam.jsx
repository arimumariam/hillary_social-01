import { useState, useEffect, useCallback } from "react";

/* ── BRAND CONSTANTS ── */
const NAVY = "#0B1C3F", GOLD = "#C9A84C", CREAM = "#FAF7F2";
const WHITE = "#FFFFFF", SLATE = "#4A5568", MIST = "#E8EDF5";
const TEAL = "#1B6B77", GOLD_PALE = "#F5E9C8";

const HILLARY_BRAND = {
  name: "Hillary Abindabyamu",
  tagline: "Civil Engineer × SDG Architect × Climate Poet",
  headline: "Sustainable Infrastructure for the Global South & Europe | COST Action CA24110 | Board Chair, Rolfes SDG Academy",
  location: "Neuburg an der Donau, Germany (Originally Uganda)",
  roles: "COST Action CA24110 researcher · Board Chair Rolfes SDG Academy · RIBA Europe Student Member · UNDP UNV Online Volunteer · Elected Faculty Rep THI Ingolstadt · UNICEF Germany Volunteer · Research Associate Albert-Hofmann-Institut",
  pillars: [
    { id: 1, emoji: "🏗", title: "Sovereign Sustainable Infrastructure", desc: "Low-carbon construction as strategic sovereignty for the Global South. Bio-based materials, COST Action research, C2C in Africa, SDG 9 & 11." },
    { id: 2, emoji: "🌐", title: "Digital SDG Education", desc: "Youth-led platforms democratising systems-thinking. Rolfes SDG Academy, data justice, youth leadership, policy dialogue." },
    { id: 3, emoji: "🎙", title: "Human Architecture of Climate Justice", desc: "Poetry, narrative, and testimony bridging climate science and public will. Schanzer Klima Slam winner. Climate poetry as technology." }
  ],
  voice: "Authoritative yet deeply human. Systems thinker who writes poetry. Speaks from field experience across Uganda and Germany. Never self-promotional — always reader-first. Uses precise data alongside personal narrative.",
  audience: "Sustainability professionals, civil engineers, UN/NGO policymakers, academic researchers, youth climate leaders, African infrastructure developers",
  cadence: "3 Educational Carousels + 2 High-Stakes Polls + 1 Visionary Circular per week",
  postDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  linkedin: "linkedin.com/in/abindabyamu-hillary-sustainable",
  email: "abindabyamuh@gmail.com"
};

/* ── API CALL ── */
async function callClaude(system, user) {
  // Client should never contain secrets. Configure a server-side proxy and set
  // VITE_API_PROXY to that URL (e.g. https://my-proxy.example.com/anthropic).
  // If no proxy is configured, we return an informative error so the developer
  // doesn't accidentally bake a secret into the client bundle.
  try {
    const proxy = import.meta.env.VITE_API_PROXY || "";
    if (!proxy) {
      // Fail fast and clearly — client must call a proxy that holds the secret.
      return "Error: No API proxy configured. Set VITE_API_PROXY to your serverless proxy URL.";
    }

    const res = await fetch(proxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: user }] })
    });
    const d = await res.json();
    // Expect proxy to forward Anthropic's response shape, or to forward its own JSON
    return d?.content?.[0]?.text || d?.text || JSON.stringify(d) || "(No response)";
  } catch (e) {
    return `Error: ${e?.message || e}`;
  }
}

/* ── STORAGE ── */
async function save(key, value) {
  try {
    // Prefer window.storage if available, otherwise fall back to localStorage
    if (window?.storage?.set) {
      await window.storage.set(key, JSON.stringify(value));
    } else if (window?.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}
async function load(key, fallback = null) {
  try {
    if (window?.storage?.get) {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : fallback;
    } else if (window?.localStorage) {
      const v = window.localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    }
    return fallback;
  } catch { return fallback; }
}

/* ── SHARED UI COMPONENTS ── */
const Tag = ({ label, color = NAVY }) => (
  <span style={{ display: "inline-block", padding: "3px 10px", background: color === GOLD ? GOLD_PALE : MIST, color: color, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, marginRight: 6, marginBottom: 4 }}>
    {label}
  </span>
);

const Btn = ({ onClick, children, variant = "primary", disabled, small }) => {
  const styles = {
    primary: { background: GOLD, color: NAVY, border: "none" },
    secondary: { background: "transparent", color: GOLD, border: `1px solid ${GOLD}` },
    ghost: { background: "transparent", color: WHITE, border: `1px solid rgba(255,255,255,0.2)` },
    danger: { background: "#8B2635", color: WHITE, border: "none" }
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      padding: small ? "6px 14px" : "10px 22px",
      fontFamily: "monospace", fontSize: small ? 10 : 11,
      letterSpacing: 1, textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, borderRadius: 2, fontWeight: 600, transition: "opacity 0.2s"
    }}>
      {children}
    </button>
  );
};

const Label = ({ children }) => (
  <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>
    ◆ {children}
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: WHITE, padding: 24, marginBottom: 16, borderLeft: `3px solid ${GOLD}`, ...style }}>
    {children}
  </div>
);

const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: "50%", background: GOLD,
        animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`
      }} />
    ))}
    <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
  </span>
);

/* ═══════════════════════════════════════════════════════
   MODULE 1: HOME / ORCHESTRATOR
═══════════════════════════════════════════════════════ */
function HomeModule({ brand, posts, streak, setActiveModule }) {
  const modules = [
    { id: "brand", icon: "◈", label: "Brand Onboarding", desc: "Identity, voice & strategy", status: "ready", color: TEAL },
    { id: "calendar", icon: "▦", label: "Content Calendar", desc: "Monthly post schedule", status: posts.length > 0 ? "done" : "ready", color: NAVY },
    { id: "captions", icon: "✍", label: "Caption Writer", desc: "Ready-to-post copy", status: "ready", color: "#5B4FCF" },
    { id: "creative", icon: "◉", label: "Creative Designer", desc: "Visual briefs & concepts", status: "ready", color: "#8B2635" },
    { id: "review", icon: "◎", label: "Performance Review", desc: "Analytics & optimisation", status: "ready", color: GOLD }
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 40px", position: "relative", overflow: "hidden", marginBottom: 32 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <Label>Social Media Command Centre</Label>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300, color: WHITE, lineHeight: 1.2, marginBottom: 12, position: "relative" }}>
          Welcome back,<br /><em style={{ color: GOLD }}>Hillary.</em>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 32, maxWidth: 500 }}>
          Your AI-powered LinkedIn growth system. Orchestrate all 5 agents below to build your 5,000-follower presence.
        </div>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { num: streak, label: "Day Streak" },
            { num: posts.length, label: "Posts Planned" },
            { num: posts.filter(p => p.caption).length, label: "Captions Ready" },
            { num: "90", label: "Day Sprint" }
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div style={{ padding: "0 40px" }}>
        <Label>Agent Directory</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 40 }}>
          {modules.map(m => (
            <div key={m.id} onClick={() => setActiveModule(m.id)} style={{
              background: WHITE, padding: 24, cursor: "pointer", borderTop: `3px solid ${m.color}`,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 28, color: m.color }}>{m.icon}</span>
                <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: m.status === "done" ? "#2D6A2D" : SLATE, background: m.status === "done" ? "#E8F5E8" : MIST, padding: "3px 8px" }}>
                  {m.status === "done" ? "✓ ACTIVE" : "READY"}
                </span>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: SLATE }}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div style={{ background: NAVY, padding: 32, marginBottom: 40 }}>
          <Label>Workflow Flow</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", rowGap: 12 }}>
            {["Brand Profile", "→", "Calendar", "→", "Captions", "→", "Creatives", "→", "Review", "→", "Next Month"].map((s, i) => (
              <span key={i} style={{
                fontFamily: "monospace", fontSize: s === "→" ? 18 : 11, letterSpacing: s === "→" ? 0 : 1,
                color: s === "→" ? "rgba(201,168,76,0.4)" : GOLD,
                background: s === "→" ? "transparent" : "rgba(201,168,76,0.08)",
                padding: s === "→" ? "0 8px" : "6px 14px",
                border: s === "→" ? "none" : `1px solid rgba(201,168,76,0.2)`
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
