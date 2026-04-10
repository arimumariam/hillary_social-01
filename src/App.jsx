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
  try {
    const proxy = import.meta.env.VITE_API_PROXY || "";
    if (!proxy) {
      return "Error: No API proxy configured. Set VITE_API_PROXY to your serverless proxy URL.";
    }

    const res = await fetch(proxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system, messages: [{ role: "user", content: user }] })
    });
    const d = await res.json();
    return d?.content?.[0]?.text || d?.text || JSON.stringify(d) || "(No response)";
  } catch (e) {
    return `Error: ${e?.message || e}`;
  }
}

/* ── STORAGE ── */
async function save(key, value) {
  try {
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

/* ═══════════════════════════════════════════════════════
   MODULE 2: BRAND ONBOARDING
═══════════════════════════════════════════════════════ */
function BrandModule({ brand, setBrand }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(brand);
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const refineWithAI = async () => {
    setLoading(true);
    const result = await callClaude(
      "You are a senior brand strategist specialising in LinkedIn authority building for sustainability and engineering professionals. Your tone is precise, strategic, and inspiring. Output in plain text only — no markdown headers or bullet points with dashes, use → instead.",
      `Analyse this brand profile and provide a 3-paragraph strategic refinement: What is working brilliantly, what one phrase should be his north-star positioning statement, and what single biggest change to his voice would accelerate authority fastest.\n\nBrand: ${JSON.stringify(draft, null, 2)}`
    );
    setAiOutput(result);
    setLoading(false);
  };

  const save_ = async () => {
    setBrand(draft);
    await save("brand-profile", draft);
    setEditing(false);
  };

  const Field = ({ label, field, multiline }) => (
    <div style={{ marginBottom: 20 }}>
      <Label>{label}</Label>
      {editing
        ? multiline
          ? <textarea value={draft[field]} onChange={e => setDraft(p => ({ ...p, [field]: e.target.value }))}
            rows={4} style={{ width: "100%", padding: 12, border: `1px solid ${MIST}`, fontFamily: "inherit", fontSize: 13, color: NAVY, resize: "vertical", background: CREAM }} />
          : <input value={draft[field]} onChange={e => setDraft(p => ({ ...p, [field]: e.target.value }))}
            style={{ width: "100%", padding: 12, border: `1px solid ${MIST}`, fontFamily: "inherit", fontSize: 13, color: NAVY, background: CREAM }} />
        : <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, padding: "12px 0", borderBottom: `1px solid ${MIST}` }}>{brand[field]}</div>
      }
    </div>
  );

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Label>Agent 01 · Brand Onboarding</Label>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: NAVY, margin: 0 }}>
            Your <em>Brand</em> Identity
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editing
            ? <><Btn onClick={save_}>Save Profile</Btn><Btn variant="secondary" onClick={() => { setEditing(false); setDraft(brand); }}>Cancel</Btn></>
            : <Btn variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Btn>
          }
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
        <div>
          <Card>
            <Field label="Full Name" field="name" />
            <Field label="Tagline" field="tagline" />
            <Field label="LinkedIn Headline" field="headline" multiline />
            <Field label="Location" field="location" />
          </Card>
        </div>
        <div>
          <Card>
            <Field label="Current Roles" field="roles" multiline />
            <Field label="Target Audience" field="audience" multiline />
            <Field label="Brand Voice" field="voice" multiline />
            <Field label="Publishing Cadence" field="cadence" />
          </Card>
        </div>
      </div>

      {/* Content Pillars */}
      <div style={{ marginBottom: 32 }}>
        <Label>Content Pillars</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {brand.pillars.map(p => (
            <div key={p.id} style={{ background: WHITE, padding: 24, borderTop: `3px solid ${GOLD}` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{p.emoji}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Refinement */}
      <div style={{ background: NAVY, padding: 32 }}>
        <Label>AI Brand Consultant</Label>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: WHITE, marginBottom: 16 }}>Get a strategic brand assessment</div>
        <Btn onClick={refineWithAI} disabled={loading}>
          {loading ? "Analysing..." : "Run Brand Refinement Analysis"}
        </Btn>
        {loading && <div style={{ marginTop: 16 }}><LoadingDots /></div>}
        {aiOutput && (
          <div style={{ marginTop: 24, padding: 24, background: "rgba(255,255,255,0.05)", borderLeft: `3px solid ${GOLD}` }}>
            <Label>Strategic Assessment</Label>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiOutput}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULE 3: CONTENT CALENDAR
═══════════════════════════════════════════════════════ */
const POST_TYPES = {
  carousel: { label: "Carousel", color: NAVY, bg: "#E8EDF5", short: "C" },
  poll: { label: "Poll", color: TEAL, bg: "#E8F4F6", short: "P" },
  circular: { label: "Visionary", color: "#8B2635", bg: "#F8ECEE", short: "V" }
};

const MONTH_TEMPLATE = [
  { day: "Mon Apr 13", type: "carousel", pillar: 1, topic: "What COST Action CA24110 reveals about bio-based cement vs OPC" },
  { day: "Wed Apr 15", type: "poll", pillar: 2, topic: "Poll: Biggest barrier to SDG data equity in Global South?" },
  { day: "Thu Apr 17", type: "carousel", pillar: 2, topic: "5 SDG tools no district-level policymaker knows exist" },
  { day: "Sat Apr 19", type: "circular", pillar: 3, topic: "The night I won the Klima Slam: what poetry changes that data cannot" },
  { day: "Mon Apr 21", type: "carousel", pillar: 1, topic: "C2C design applied to laterite and compressed earth — a field note" },
  { day: "Tue Apr 22", type: "poll", pillar: 1, topic: "Poll: Should African universities teach C2C or LEED first?" },
  { day: "Thu Apr 24", type: "carousel", pillar: 3, topic: "What UNDP Liberia taught me about plastic waste as a governance gap" },
  { day: "Sat Apr 26", type: "circular", pillar: 2, topic: "Open letter to EU engineering faculties on what they systematically exclude" },
  { day: "Mon Apr 28", type: "poll", pillar: 3, topic: "Poll: Can an engineer be a poet? Vote — then read why it matters" },
  { day: "Tue Apr 29", type: "carousel", pillar: 1, topic: "The 2030 Challenge reframed: what it means for African infrastructure" },
  { day: "Thu May 1", type: "carousel", pillar: 2, topic: "How Rolfes SDG Academy runs a global cohort with near-zero budget" },
  { day: "Sat May 3", type: "circular", pillar: 1, topic: "Why the Global South must lead, not follow, the sustainable construction revolution" },
  { day: "Mon May 5", type: "poll", pillar: 1, topic: "Poll: German motorway vs Uganda earth road — which has bigger carbon footprint?" },
  { day: "Wed May 7", type: "carousel", pillar: 3, topic: "Indigenous knowledge systems and 21st century infrastructure design" },
  { day: "Thu May 8", type: "carousel", pillar: 2, topic: "What 100 policymakers taught me in one Harvard-affiliated workshop" },
  { day: "Sat May 10", type: "circular", pillar: 3, topic: "Letters from the construction site of a sustainable century — Part I" },
  { day: "Mon May 12", type: "poll", pillar: 2, topic: "Poll: Can youth-led organisations outperform established NGOs on SDG delivery?" },
  { day: "Wed May 14", type: "carousel", pillar: 1, topic: "BREEAM vs EU Taxonomy vs Level(s): which framework fits Africa?" }
];

function CalendarModule({ brand, posts, setPosts }) {
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);

  const generateCalendar = async () => {
    setGenerating(true);
    const result = await callClaude(
      `You are a LinkedIn content strategist for ${brand.name}, a civil engineering student and SDG leader. Generate exactly 3 additional post ideas (beyond the 18 already planned) for his LinkedIn. Return ONLY a JSON array of 3 objects with fields: day (string date), type (carousel/poll/circular), pillar (1/2/3), topic (1 sentence). No markdown, no extra text, pure JSON array.`,
      `Brand pillars: ${brand.pillars.map(p => p.title).join(", ")}. Cadence: ${brand.cadence}. Generate 3 bonus posts for mid-May 2026.`
    );
    try {
      const clean = result.replace(/```json|```/g, "").trim();
      const extra = JSON.parse(clean);
      const merged = [...MONTH_TEMPLATE, ...extra].map((p, i) => ({ ...p, id: i, caption: null, creative: null }));
      setPosts(merged);
      await save("content-calendar", merged);
    } catch {
      const merged = MONTH_TEMPLATE.map((p, i) => ({ ...p, id: i, caption: null, creative: null }));
      setPosts(merged);
      await save("content-calendar", merged);
    }
    setGenerating(false);
  };

  const initialLoad = () => {
    if (posts.length === 0) {
      const merged = MONTH_TEMPLATE.map((p, i) => ({ ...p, id: i, caption: null, creative: null }));
      setPosts(merged);
    }
  };

  useEffect(() => { initialLoad(); }, []);

  const byPillar = (n) => posts.filter(p => p.pillar === n);

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Label>Agent 02 · Content Calendar</Label>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: NAVY, margin: 0 }}>
            April–May <em>2026</em>
          </h2>
          <div style={{ fontSize: 13, color: SLATE, marginTop: 8 }}>{posts.length} posts planned · 3-2-1 cadence</div>
        </div>
        <Btn onClick={generateCalendar} disabled={generating}>
          {generating ? "Generating..." : "Generate Bonus Posts with AI"}
        </Btn>
      </div>

      {/* Type Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        {Object.entries(POST_TYPES).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, background: v.color, borderRadius: 2 }} />
            <span style={{ fontFamily: "monospace", fontSize: 11, color: SLATE }}>{v.label}</span>
          </div>
        ))}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, marginLeft: 8 }}>
          · Pillar 1=🏗 2=🌐 3=🎙
        </div>
      </div>

      {/* Post List */}
      <div style={{ display: "grid", gap: 8, marginBottom: 40 }}>
        {posts.map((post, i) => {
          const pt = POST_TYPES[post.type];
          const pillar = brand.pillars.find(p => p.id === post.pillar);
          return (
            <div key={i} onClick={() => setSelected(selected === i ? null : i)} style={{
              background: WHITE, padding: 16, cursor: "pointer",
              borderLeft: `4px solid ${pt.color}`,
              transition: "box-shadow 0.2s",
              boxShadow: selected === i ? `0 0 0 2px ${GOLD}` : "none"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: pt.color, background: pt.bg, padding: "2px 8px", letterSpacing: 1 }}>
                    {pt.short} · P{post.pillar}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: SLATE }}>{post.day}</span>
                  <span style={{ fontSize: 13, color: NAVY, fontWeight: 500 }}>{post.topic}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {post.caption && <span style={{ fontFamily: "monospace", fontSize: 9, color: "#2D6A2D", background: "#E8F5E8", padding: "2px 8px" }}>✓ CAPTION</span>}
                  {post.creative && <span style={{ fontFamily: "monospace", fontSize: 9, color: TEAL, background: "#E8F4F6", padding: "2px 8px" }}>✓ BRIEF</span>}
                </div>
              </div>
              {selected === i && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${MIST}` }}>
                  <div style={{ fontSize: 13, color: SLATE }}><strong>Pillar:</strong> {pillar?.title} {pillar?.emoji}</div>
                  <div style={{ fontSize: 13, color: SLATE }}><strong>Format:</strong> {pt.label} · Best day: {post.day}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pillar breakdown */}
      <div style={{ background: NAVY, padding: 32 }}>
        <Label>Pillar Distribution</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {brand.pillars.map(p => (
            <div key={p.id} style={{ background: "rgba(255,255,255,0.05)", padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{p.emoji}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: GOLD, letterSpacing: 2, marginBottom: 6 }}>PILLAR {p.id}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: WHITE, marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: GOLD }}>{byPillar(p.id).length}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>POSTS PLANNED</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULE 4: CAPTION WRITER
═══════════════════════════════════════════════════════ */
function CaptionModule({ brand, posts, setPosts }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCaption, setActiveCaption] = useState("");

  const generateCaption = async (post) => {
    setLoading(true);
    setActiveCaption("");
    const pillar = brand.pillars.find(p => p.id === post.pillar);
    const result = await callClaude(
      `You are the ghostwriter for ${brand.name}: ${brand.tagline}. His voice: ${brand.voice}. 
Write a LinkedIn post in his authentic voice. Follow these rules: Open with a bold declarative statement (never "I am excited to"). Use short punchy paragraphs. Bring in one specific data point or field experience. End with a reflection or question that positions him as a thought leader, not a student. Include 5 relevant hashtags at the end. For carousels, add slide structure markers (→ Slide 2: etc.). For polls, include the poll options. For visionary circulars, write 600-800 words. Output ONLY the post text, nothing else.`,
      `Write a ${post.type} post for: "${post.topic}". Content pillar: ${pillar?.title}. His current roles: ${brand.roles}`
    );
    setActiveCaption(result);
    const updated = posts.map(p => p.id === post.id ? { ...p, caption: result } : p);
    setPosts(updated);
    await save("content-calendar", updated);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <Label>Agent 03 · Caption Writer</Label>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: NAVY, marginBottom: 8 }}>
        Ready-to-Post <em>Copy</em>
      </h2>
      <p style={{ fontSize: 14, color: SLATE, marginBottom: 32 }}>Select a post from your calendar to generate a full LinkedIn caption in Hillary's voice.</p>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
        {/* Post selector */}
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {posts.map((post, i) => {
            const pt = POST_TYPES[post.type];
            return (
              <div key={i} onClick={() => { setSelectedPost(post); setActiveCaption(post.caption || ""); }}
                style={{
                  padding: 16, cursor: "pointer", marginBottom: 4,
                  background: selectedPost?.id === post.id ? NAVY : WHITE,
                  borderLeft: `3px solid ${pt.color}`,
                  transition: "background 0.15s"
                }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1, color: selectedPost?.id === post.id ? GOLD : pt.color, marginBottom: 4 }}>
                  {pt.label} · {post.day}
                </div>
                <div style={{ fontSize: 13, color: selectedPost?.id === post.id ? WHITE : NAVY, lineHeight: 1.4 }}>{post.topic}</div>
                {post.caption && <div style={{ fontFamily: "monospace", fontSize: 9, color: "#2D6A2D", marginTop: 6 }}>✓ Generated</div>}
              </div>
            );
          })}
        </div>

        {/* Caption output */}
        <div>
          {!selectedPost ? (
            <div style={{ background: MIST, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, letterSpacing: 2 }}>← SELECT A POST</div>
            </div>
          ) : (
            <div>
              <div style={{ background: WHITE, padding: 20, marginBottom: 12, borderTop: `3px solid ${POST_TYPES[selectedPost.type].color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Label>{POST_TYPES[selectedPost.type].label} · Pillar {selectedPost.pillar}</Label>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: NAVY }}>{selectedPost.topic}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, marginTop: 4 }}>{selectedPost.day}</div>
                  </div>
                  <Btn onClick={() => generateCaption(selectedPost)} disabled={loading}>
                    {loading ? "Writing..." : activeCaption ? "Regenerate" : "Generate Caption"}
                  </Btn>
                </div>
              </div>

              {loading && <div style={{ padding: 24, background: WHITE, display: "flex", alignItems: "center", gap: 12 }}>
                <LoadingDots />
                <span style={{ fontFamily: "monospace", fontSize: 11, color: SLATE }}>Writing in Hillary's voice...</span>
              </div>}

              {activeCaption && !loading && (
                <div style={{ background: WHITE, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Label>Generated Caption</Label>
                    <Btn small variant="secondary" onClick={() => navigator.clipboard?.writeText(activeCaption)}>Copy to Clipboard</Btn>
                  </div>
                  <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.85, whiteSpace: "pre-wrap", borderLeft: `3px solid ${GOLD}`, paddingLeft: 20, maxHeight: 420, overflowY: "auto" }}>
                    {activeCaption}
                  </div>
                  <div style={{ marginTop: 20, padding: 16, background: MIST, display: "flex", gap: 24 }}>
                    {[
                      { label: "Format", val: POST_TYPES[selectedPost.type].label },
                      { label: "Best Time", val: selectedPost.type === "circular" ? "Sun 8am CET" : selectedPost.type === "poll" ? "Wed 8am CET" : "Tue 7am CET" },
                      { label: "Est. Reach", val: selectedPost.type === "circular" ? "15K–60K" : selectedPost.type === "poll" ? "20K–80K" : "8K–25K" }
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: GOLD }}>{m.label}</div>
                        <div style={{ fontFamily: "monospace", fontSize: 12, color: NAVY, marginTop: 2 }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULE 5: CREATIVE DESIGNER
═══════════════════════════════════════════════════════ */
function CreativeModule({ brand, posts, setPosts }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState("");

  const generateBrief = async (post) => {
    setLoading(true);
    setBrief("");
    const pillar = brand.pillars.find(p => p.id === post.pillar);
    const result = await callClaude(
      `You are a senior creative director specialising in LinkedIn visual content for sustainability leaders. Generate a detailed visual brief for a LinkedIn post. Include: 1) Overall Visual Concept (2 sentences), 2) Color Palette (3 specific hex colors with names), 3) Typography Direction, 4) Layout Structure (describe slide-by-slide for carousels, or single frame for other types), 5) Key Visual Element or Hero Image concept, 6) Brand Elements to include. Be specific, precise, and visually imaginative. Plain text, use → for bullet points.`,
      `Post type: ${post.type}. Topic: "${post.topic}". Pillar: ${pillar?.title}. Brand colours: Navy (#0B1C3F) and Gold (#C9A84C). Hillary is a Black male civil engineer from Uganda studying in Germany. The aesthetic should feel global, authoritative, and human — not corporate.`
    );
    setBrief(result);
    const updated = posts.map(p => p.id === post.id ? { ...p, creative: result } : p);
    setPosts(updated);
    await save("content-calendar", updated);
    setLoading(false);
  };

  const PALETTES = [
    ["#0B1C3F", "#C9A84C", "#FAF7F2"],
    ["#1B6B77", "#E8C97A", "#FFFFFF"],
    ["#0B1C3F", "#8B2635", "#C9A84C"],
  ];

  return (
    <div style={{ padding: 40 }}>
      <Label>Agent 04 · Creative Designer</Label>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: NAVY, marginBottom: 8 }}>
        Visual <em>Briefs</em>
      </h2>
      <p style={{ fontSize: 14, color: SLATE, marginBottom: 32 }}>Generate on-brand visual direction for each post. Share with a designer or use as a Canva brief.</p>

      {/* Brand Palette */}
      <div style={{ background: NAVY, padding: 28, marginBottom: 32 }}>
        <Label>Hillary's Brand Palette</Label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["#0B1C3F", "Deep Navy"], ["#C9A84C", "Signature Gold"], ["#FAF7F2", "Ivory Cream"], ["#1B6B77", "SDG Teal"], ["#8B2635", "Climate Red"], ["#E8EDF5", "Steel Mist"]].map(([hex, name]) => (
            <div key={hex} style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: hex, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 4 }} />
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>{hex}</div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {posts.map((post, i) => {
            const pt = POST_TYPES[post.type];
            return (
              <div key={i} onClick={() => { setSelectedPost(post); setBrief(post.creative || ""); }}
                style={{ padding: 16, cursor: "pointer", marginBottom: 4, background: selectedPost?.id === post.id ? NAVY : WHITE, borderLeft: `3px solid ${pt.color}`, transition: "background 0.15s" }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: selectedPost?.id === post.id ? GOLD : pt.color, marginBottom: 4 }}>{pt.label} · {post.day}</div>
                <div style={{ fontSize: 13, color: selectedPost?.id === post.id ? WHITE : NAVY, lineHeight: 1.4 }}>{post.topic}</div>
                {post.creative && <div style={{ fontFamily: "monospace", fontSize: 9, color: TEAL, marginTop: 6 }}>✓ Brief Ready</div>}
              </div>
            );
          })}
        </div>

        <div>
          {!selectedPost ? (
            <div style={{ background: MIST, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, letterSpacing: 2 }}>← SELECT A POST</div>
            </div>
          ) : (
            <div>
              <div style={{ background: WHITE, padding: 20, marginBottom: 12, borderTop: `3px solid ${GOLD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Label>{POST_TYPES[selectedPost.type].label}</Label>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: NAVY }}>{selectedPost.topic}</div>
                </div>
                <Btn onClick={() => generateBrief(selectedPost)} disabled={loading}>
                  {loading ? "Designing..." : brief ? "Regenerate" : "Generate Brief"}
                </Btn>
              </div>

              {loading && <div style={{ padding: 24, background: WHITE, display: "flex", gap: 12, alignItems: "center" }}>
                <LoadingDots />
                <span style={{ fontFamily: "monospace", fontSize: 11, color: SLATE }}>Designing visual concept...</span>
              </div>}

              {brief && !loading && (
                <div style={{ background: WHITE, padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <Label>Creative Brief</Label>
                    <Btn small variant="secondary" onClick={() => navigator.clipboard?.writeText(brief)}>Copy Brief</Btn>
                  </div>
                  <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.85, whiteSpace: "pre-wrap", borderLeft: `3px solid ${GOLD}`, paddingLeft: 20 }}>{brief}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULE 6: PERFORMANCE REVIEW
═══════════════════════════════════════════════════════ */
function ReviewModule({ brand, posts }) {
  const [metrics, setMetrics] = useState({ impressions: "", reactions: "", comments: "", followers: "", topPost: "", notes: "" });
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load("performance-metrics", null).then(d => { if (d) setMetrics(d); });
    load("performance-analysis", "").then(d => { if (d) setAnalysis(d); });
  }, []);

  const runReview = async () => {
    setLoading(true);
    await save("performance-metrics", metrics);
    const result = await callClaude(
      `You are a senior LinkedIn analytics consultant for ${brand.name}. Analyse monthly performance metrics and provide: 1) What worked and why (2 paragraphs), 2) What underperformed and the likely cause (1 paragraph), 3) Top 3 concrete optimisation recommendations for next month, 4) The "Intellectual Moat Score" — a 1-10 rating of how much his content is establishing him as a global authority vs just generating engagement. Be precise, data-driven, and strategic. Plain text, use → for recommendations.`,
      `Month: April/May 2026. Metrics: Total impressions: ${metrics.impressions || "N/A"}, Reactions: ${metrics.reactions || "N/A"}, Comments: ${metrics.comments || "N/A"}, New followers: ${metrics.followers || "N/A"}, Best performing post: ${metrics.topPost || "N/A"}. Additional notes: ${metrics.notes || "none"}. Posts published: ${posts.length}. Content pillars used: Sovereign Sustainable Infrastructure, Digital SDG Education, Human Architecture of Climate Justice.`
    );
    setAnalysis(result);
    await save("performance-analysis", result);
    setSaved(true);
    setLoading(false);
  };

  const Field = ({ label, field, placeholder, multiline }) => (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      {multiline
        ? <textarea value={metrics[field]} onChange={e => setMetrics(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} rows={3}
          style={{ width: "100%", padding: 12, border: `1px solid ${MIST}`, fontFamily: "inherit", fontSize: 13, color: NAVY, resize: "vertical", background: CREAM }} />
        : <input value={metrics[field]} onChange={e => setMetrics(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
          style={{ width: "100%", padding: 12, border: `1px solid ${MIST}`, fontFamily: "inherit", fontSize: 13, color: NAVY, background: CREAM }} />
      }
    </div>
  );

  return (
    <div style={{ padding: 40 }}>
      <Label>Agent 05 · Performance Review</Label>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: NAVY, marginBottom: 8 }}>
        Monthly <em>Analysis</em>
      </h2>
      <p style={{ fontSize: 14, color: SLATE, marginBottom: 32 }}>Enter your LinkedIn analytics for the month. The AI will identify patterns, diagnose underperformance, and set strategy for next month.</p>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 32 }}>
        <div>
          <Card>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Input Metrics</div>
            <Field label="Total Impressions" field="impressions" placeholder="e.g. 48,000" />
            <Field label="Total Reactions (Likes)" field="reactions" placeholder="e.g. 1,200" />
            <Field label="Total Comments" field="comments" placeholder="e.g. 340" />
            <Field label="New Followers Gained" field="followers" placeholder="e.g. 287" />
            <Field label="Best Performing Post Topic" field="topPost" placeholder="e.g. Bio-based cement carousel" multiline />
            <Field label="Notes / Observations" field="notes" placeholder="Any observations, DMs received, notable engagement..." multiline />
            <div style={{ marginTop: 8 }}>
              <Btn onClick={runReview} disabled={loading}>
                {loading ? "Analysing..." : "Run Performance Review"}
              </Btn>
            </div>
          </Card>

          {/* Progress to 5K */}
          <div style={{ background: NAVY, padding: 24, marginTop: 16 }}>
            <Label>Progress to 5,000 Followers</Label>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              Enter new followers above to track
            </div>
            {metrics.followers && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Month 1</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: GOLD }}>{metrics.followers} / 5,000</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (parseInt(metrics.followers) / 5000) * 100)}%`, background: GOLD, borderRadius: 3 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {loading && (
            <div style={{ background: WHITE, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <LoadingDots />
              <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, letterSpacing: 2 }}>RUNNING DEEP ANALYSIS...</div>
            </div>
          )}

          {analysis && !loading && (
            <div style={{ background: WHITE, padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <Label>Strategic Analysis</Label>
                {saved && <span style={{ fontFamily: "monospace", fontSize: 9, color: "#2D6A2D", background: "#E8F5E8", padding: "3px 8px" }}>✓ SAVED</span>}
              </div>
              <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.85, whiteSpace: "pre-wrap", borderLeft: `3px solid ${GOLD}`, paddingLeft: 20, marginBottom: 24 }}>
                {analysis}
              </div>
              <div style={{ background: MIST, padding: 16 }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: SLATE, letterSpacing: 1 }}>
                  This analysis is saved and will inform next month's content calendar. Run the Content Calendar agent next to apply learnings.
                </div>
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div style={{ background: MIST, padding: 40, display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: SLATE, letterSpacing: 2, marginBottom: 12 }}>AWAITING METRICS INPUT</div>
                <div style={{ fontSize: 13, color: SLATE }}>Enter your monthly LinkedIn data and run the review</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function SocialMediaManager() {
  const [active, setActive] = useState("home");
  const [brand, setBrand] = useState(HILLARY_BRAND);
  const [posts, setPosts] = useState([]);
  const [streak, setStreak] = useState(3);

  // Load persisted data
  useEffect(() => {
    load("brand-profile", HILLARY_BRAND).then(d => setBrand(d));
    load("content-calendar", []).then(d => { if (d.length > 0) setPosts(d); });
    load("post-streak", 3).then(d => setStreak(d));
  }, []);

  const modules = [
    { id: "home", icon: "⌂", label: "Command Centre" },
    { id: "brand", icon: "◈", label: "Brand Profile" },
    { id: "calendar", icon: "▦", label: "Content Calendar" },
    { id: "captions", icon: "✍", label: "Caption Writer" },
    { id: "creative", icon: "◉", label: "Creative Designer" },
    { id: "review", icon: "◎", label: "Performance Review" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", background: CREAM }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0B1C3F; } ::-webkit-scrollbar-thumb { background: #C9A84C; }
        input, textarea { outline: none; }
        input:focus, textarea:focus { border-color: #C9A84C !important; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: NAVY, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 3, color: GOLD, marginBottom: 8 }}>◆ SOCIAL OS</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: WHITE, fontWeight: 300, lineHeight: 1.3 }}>Hillary<br /><em style={{ color: GOLD }}>Abindabyamu</em></div>
        </div>

        {/* Streak */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(201,168,76,0.12)", padding: "6px 10px", borderRadius: 2 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, color: GOLD, fontWeight: 700 }}>{streak}</span>
          </div>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 2, color: GOLD }}>DAY STREAK</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>🔥 Keep posting!</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {modules.map(m => (
            <div key={m.id} onClick={() => setActive(m.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", cursor: "pointer",
              background: active === m.id ? "rgba(201,168,76,0.12)" : "transparent",
              borderLeft: active === m.id ? `2px solid ${GOLD}` : "2px solid transparent",
              transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 16, color: active === m.id ? GOLD : "rgba(255,255,255,0.4)" }}>{m.icon}</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 1, color: active === m.id ? WHITE : "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                {m.label}
              </span>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 1, lineHeight: 1.6 }}>
            Goal: 5,000 followers<br />Sprint: 90 days<br />Posts ready: {posts.filter(p => p.caption).length}/{posts.length}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Top bar */}
        <div style={{ background: WHITE, padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${MIST}`, position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, color: NAVY }}>
            {modules.find(m => m.id === active)?.label?.toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="https://www.linkedin.com/in/abindabyamu-hillary-sustainable/" target="_blank" rel="noreferrer"
              style={{ fontFamily: "monospace", fontSize: 10, color: NAVY, letterSpacing: 1, textDecoration: "none", padding: "6px 14px", border: `1px solid ${MIST}`, display: "flex", alignItems: "center", gap: 6 }}>
              ↗ LinkedIn Profile
            </a>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: SLATE }}>April 2026 · Month 1 Sprint</div>
          </div>
        </div>

        {/* Module content */}
        {active === "home" && <HomeModule brand={brand} posts={posts} streak={streak} setActiveModule={setActive} />}
        {active === "brand" && <BrandModule brand={brand} setBrand={setBrand} />}
        {active === "calendar" && <CalendarModule brand={brand} posts={posts} setPosts={setPosts} />}
        {active === "captions" && <CaptionModule brand={brand} posts={posts} setPosts={setPosts} />}
        {active === "creative" && <CreativeModule brand={brand} posts={posts} setPosts={setPosts} />}
        {active === "review" && <ReviewModule brand={brand} posts={posts} />}
      </div>
    </div>
  );
}
