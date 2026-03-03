import { useState } from "react";

const DEFAULT_CHAPTERS = [
  "טופס בקשה ראשי",
  "תקציב מפורט",
  "תכנית עסקית",
  "אישורי רשויות",
  "דוחות כספיים",
  "אישור ניהול תקין",
  "המלצות ואסמכתאות",
  "דוח התקדמות",
];

const STATUS_CFG = {
  complete:     { label: "הושלם",        color: "#15803d", bg: "#f0fdf4", border: "#86efac", icon: "✓" },
  pending:      { label: "בתהליך",       color: "#92400e", bg: "#fffbeb", border: "#fcd34d", icon: "◔" },
  missing:      { label: "חסר מסמכים",  color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", icon: "!" },
  review:       { label: "בבדיקה",      color: "#1d4ed8", bg: "#eff6ff", border: "#93c5fd", icon: "⟳" },
  not_relevant: { label: "לא רלוונטי",  color: "#64748b", bg: "#f8fafc", border: "#cbd5e1", icon: "–" },
};

const INITIAL_CLIENTS = [
  {
    id: 1,
    name: "עמותת אור לכל",
    email: "contact@orlechol.org.il",
    phone: "03-1234567",
    grantName: "קרן התרבות הלאומית 2025",
    deadline: "2025-05-15",
    portalUrl: "https://grants-portal.example.com/client/1",
    chapters: {
      "טופס בקשה ראשי":    { status: "complete",     note: "" },
      "תקציב מפורט":       { status: "missing",      note: "חסר: פירוט סעיפי שכר, הצעות מחיר לציוד" },
      "תכנית עסקית":       { status: "pending",      note: "" },
      "אישורי רשויות":     { status: "missing",      note: "חסר: אישור עירייה, רישיון עסק מעודכן" },
      "דוחות כספיים":      { status: "complete",     note: "" },
      "אישור ניהול תקין":  { status: "complete",     note: "" },
      "המלצות ואסמכתאות": { status: "review",       note: "" },
      "דוח התקדמות":       { status: "not_relevant", note: "" },
    },
  },
  {
    id: 2,
    name: 'סטארטאפ גרין-טק בע"מ',
    email: "info@greentech.co.il",
    phone: "052-9876543",
    grantName: "מסלול תנופה — רשות החדשנות",
    deadline: "2025-04-01",
    portalUrl: "https://grants-portal.example.com/client/2",
    chapters: {
      "טופס בקשה ראשי":    { status: "complete",     note: "" },
      "תקציב מפורט":       { status: "complete",     note: "" },
      "תכנית עסקית":       { status: "complete",     note: "" },
      "אישורי רשויות":     { status: "complete",     note: "" },
      'דוחות כספיים':      { status: "missing",      note: 'חסר: דוח רו"ח מאושר לשנת 2024' },
      "אישור ניהול תקין":  { status: "not_relevant", note: "" },
      "המלצות ואסמכתאות": { status: "pending",      note: "" },
      "דוח התקדמות":       { status: "review",       note: "" },
    },
  },
];

function daysUntil(d) { return Math.ceil((new Date(d) - new Date()) / 86400000); }
function fmtDate(d) { return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function getProgress(chapters) {
  const rel = Object.values(chapters).filter(c => c.status !== "not_relevant");
  const done = rel.filter(c => c.status === "complete").length;
  return rel.length ? Math.round((done / rel.length) * 100) : 0;
}
function getMissing(chapters) {
  return Object.entries(chapters).filter(([, v]) => v.status === "missing");
}
function buildMailto(client) {
  const missing = getMissing(client.chapters);
  const lines = missing.map(([ch, v]) => `• ${ch}${v.note ? `\n  פרוט: ${v.note}` : ""}`).join("\n");
  const subject = encodeURIComponent(`השלמת מסמכים – ${client.grantName}`);
  const body = encodeURIComponent(
`שלום,

לצורך המשך טיפול בבקשת המענק "${client.grantName}", נדרשים המסמכים הבאים:

${lines}

אנא העלה את המסמכים דרך הפורטל האישי שלך:
${client.portalUrl}

מועד הגשה אחרון: ${fmtDate(client.deadline)}

בברכה`
  );
  return `mailto:${client.email}?subject=${subject}&body=${body}`;
}

const C = {
  navy: "#0f2744", navyDark: "#091c33",
  accent: "#2563eb", accentBg: "#eff6ff",
  surface: "#ffffff", bg: "#f1f5f9",
  border: "#e2e8f0", text: "#0f172a", muted: "#64748b",
};

function btn(variant = "primary") {
  const base = { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", border:"none", transition:"all .15s", fontFamily:"inherit" };
  if (variant === "primary")   return { ...base, background: C.accent, color: "#fff" };
  if (variant === "danger")    return { ...base, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" };
  if (variant === "secondary") return { ...base, background: C.accentBg, color: C.accent, border: "1px solid #bfdbfe" };
  return { ...base, background: "transparent", color: C.muted, border: `1px solid ${C.border}` };
}

function card(extra = {}) {
  return { background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", ...extra };
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:700 }}>
      <span style={{ fontSize:10 }}>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

function DeadlinePill({ deadline }) {
  const d = daysUntil(deadline);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700,
      background: d < 0 ? "#fef2f2" : d <= 14 ? "#fff7ed" : "#f0fdf4",
      color: d < 0 ? "#b91c1c" : d <= 14 ? "#c2410c" : "#15803d",
    }}>
      📅 {fmtDate(deadline)} · {d < 0 ? "עבר מועד" : d === 0 ? "היום!" : `${d} ימים`}
    </span>
  );
}

function ProgressBar({ pct }) {
  const color = pct === 100 ? "#15803d" : pct >= 60 ? "#2563eb" : pct >= 30 ? "#d97706" : "#dc2626";
  return (
    <div style={{ width:"100%", background:"#e2e8f0", borderRadius:99, height:7, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, background:color, height:"100%", borderRadius:99, transition:"width .4s" }} />
    </div>
  );
}

// ── CLIENT CARD (list) ────────────────────────────────────────────────────────
function ClientCard({ client, onOpen }) {
  const [hov, setHov] = useState(false);
  const pct = getProgress(client.chapters);
  const missCnt = getMissing(client.chapters).length;
  const reviewCnt = Object.values(client.chapters).filter(c => c.status === "review").length;
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...card(), padding:"18px 22px", cursor:"pointer", display:"flex", flexDirection:"column", gap:12,
        boxShadow: hov ? "0 4px 18px rgba(37,99,235,.13)" : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-2px)" : "none", transition:"all .18s" }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16 }}>{client.name}</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>{client.grantName}</div>
        </div>
        <DeadlinePill deadline={client.deadline} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}><ProgressBar pct={pct} /></div>
        <span style={{ fontSize:13, fontWeight:700, color:C.muted, minWidth:36, textAlign:"left" }}>{pct}%</span>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {missCnt > 0 && <span style={{ background:"#fef2f2", color:"#b91c1c", borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{missCnt} חסרים</span>}
        {reviewCnt > 0 && <span style={{ background:"#eff6ff", color:"#1d4ed8", borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{reviewCnt} בבדיקה</span>}
      </div>
    </div>
  );
}

// ── ADMIN DETAIL ──────────────────────────────────────────────────────────────
function AdminDetail({ data, setField, setChapterField, addChapter, setAddChapter, handleAddChapter, handleRemoveChapter, pct, missing }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Info */}
      <div style={card({ padding:"20px 24px" })}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:16, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>פרטי לקוח</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[["שם מלא","name","text"],["אימייל","email","email"],["טלפון","phone","text"],["שם המענק","grantName","text"],["מועד הגשה","deadline","date"],["קישור לפורטל","portalUrl","url"]].map(([label,field,type]) => (
            <label key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.muted }}>{label}</span>
              <input type={type} value={data[field]} onChange={e => setField(field, e.target.value)}
                style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", background:"#fafafa", direction:"rtl", fontFamily:"inherit", width:"100%", boxSizing:"border-box" }} />
            </label>
          ))}
        </div>
      </div>

      {/* Progress summary */}
      <div style={card({ padding:"18px 24px" })}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontWeight:800, fontSize:15 }}>התקדמות כללית</span>
          <span style={{ fontWeight:800, fontSize:20, color: pct===100?"#15803d":C.accent }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
        <div style={{ display:"flex", gap:16, marginTop:14, flexWrap:"wrap" }}>
          {Object.entries(STATUS_CFG).map(([key,cfg]) => {
            const n = Object.values(data.chapters).filter(c => c.status===key).length;
            return n > 0 ? <span key={key} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:cfg.color, fontWeight:600 }}><span style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:4, padding:"1px 6px" }}>{n}</span>{cfg.label}</span> : null;
          })}
        </div>
      </div>

      {/* Chapters */}
      <div style={card()}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, fontWeight:800, fontSize:15, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span>פרקי הבקשה</span>
          <div style={{ display:"flex", gap:8 }}>
            <input value={addChapter} onChange={e => setAddChapter(e.target.value)} onKeyDown={e => e.key==="Enter" && handleAddChapter()}
              placeholder="הוסף פרק חדש..." style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, outline:"none", direction:"rtl", width:180, fontFamily:"inherit" }} />
            <button onClick={handleAddChapter} style={btn("secondary")}>+ הוסף</button>
          </div>
        </div>
        {Object.entries(data.chapters).map(([ch, val], i, arr) => (
          <div key={ch} style={{
            display:"grid", gridTemplateColumns:"1fr 150px 1fr auto", alignItems:"center", gap:14, padding:"14px 24px",
            borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none",
            background: val.status==="missing" ? "#fffafa" : "transparent",
          }}>
            <div style={{ fontWeight:600, fontSize:14 }}>{ch}</div>
            <select value={val.status} onChange={e => setChapterField(ch,"status",e.target.value)}
              style={{ border:`1px solid ${STATUS_CFG[val.status].border}`, background:STATUS_CFG[val.status].bg, color:STATUS_CFG[val.status].color, borderRadius:8, padding:"6px 10px", fontSize:13, fontWeight:700, outline:"none", cursor:"pointer", direction:"rtl", fontFamily:"inherit" }}>
              {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input placeholder={val.status==="missing" ? "פרט מסמכים חסרים..." : "הערה (אופציונלי)"}
              value={val.note} onChange={e => setChapterField(ch,"note",e.target.value)}
              style={{ border:`1px solid ${val.status==="missing"?"#fca5a5":C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, outline:"none", background:"#fafafa", direction:"rtl", width:"100%", boxSizing:"border-box", fontFamily:"inherit" }} />
            <button onClick={() => handleRemoveChapter(ch)}
              style={{ background:"transparent", border:"none", color:"#cbd5e1", cursor:"pointer", fontSize:20, padding:"0 4px", lineHeight:1 }} title="הסר פרק">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CLIENT-FACING VIEW ────────────────────────────────────────────────────────
function ClientFacing({ data, pct, missing }) {
  const days = daysUntil(data.deadline);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ background:`linear-gradient(135deg, ${C.navy} 0%, #1e4db7 100%)`, borderRadius:16, padding:"28px 32px", color:"#fff" }}>
        <div style={{ fontSize:13, opacity:0.6, marginBottom:6 }}>הפורטל האישי שלך</div>
        <h1 style={{ margin:"0 0 4px", fontSize:24, fontWeight:800 }}>שלום, {data.name}</h1>
        <div style={{ opacity:0.75, fontSize:14 }}>{data.grantName}</div>
        <div style={{ marginTop:22, display:"flex", gap:28, flexWrap:"wrap" }}>
          <div><div style={{ fontSize:11, opacity:0.6, marginBottom:3 }}>התקדמות</div><div style={{ fontSize:30, fontWeight:900 }}>{pct}%</div></div>
          <div><div style={{ fontSize:11, opacity:0.6, marginBottom:3 }}>מועד הגשה</div><div style={{ fontSize:16, fontWeight:700 }}>{fmtDate(data.deadline)}</div><div style={{ fontSize:12, opacity:0.65 }}>{days<0?"עבר המועד":days===0?"היום!":`נותרו ${days} ימים`}</div></div>
          {missing.length > 0 && <div><div style={{ fontSize:11, opacity:0.6, marginBottom:3 }}>מסמכים חסרים</div><div style={{ fontSize:30, fontWeight:900, color:"#fca5a5" }}>{missing.length}</div></div>}
        </div>
        <div style={{ marginTop:16, background:"rgba(255,255,255,0.18)", borderRadius:99, height:8, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, background:"#fff", height:"100%", borderRadius:99, transition:"width .6s" }} />
        </div>
      </div>

      {missing.length > 0 && (
        <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:14, padding:"18px 24px" }}>
          <div style={{ fontWeight:800, color:"#b91c1c", marginBottom:12, fontSize:15 }}>⚠️ נדרשת פעולה — מסמכים חסרים</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {missing.map(([ch,v]) => (
              <div key={ch} style={{ background:"#fff", borderRadius:10, padding:"12px 16px", border:"1px solid #fecaca" }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{ch}</div>
                {v.note && <div style={{ color:"#b91c1c", fontSize:13, marginTop:4 }}>{v.note}</div>}
              </div>
            ))}
          </div>
          <a href={data.portalUrl} target="_blank" rel="noreferrer"
            style={{ ...btn("danger"), marginTop:14, textDecoration:"none" }}>
            📎 העלאת מסמכים לפורטל
          </a>
        </div>
      )}

      <div style={card()}>
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, fontWeight:800, fontSize:15 }}>סטטוס פרקים</div>
        {Object.entries(data.chapters).map(([ch,val],i,arr) => (
          <div key={ch} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", gap:12, borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
            <span style={{ fontWeight:600, fontSize:14 }}>{ch}</span>
            <StatusBadge status={val.status} />
          </div>
        ))}
      </div>
      <div style={{ textAlign:"center" }}>
        <a href={data.portalUrl} target="_blank" rel="noreferrer" style={{ color:C.accent, fontSize:13, fontWeight:600, textDecoration:"none" }}>🔗 כניסה לפורטל האישי</a>
      </div>
    </div>
  );
}

// ── CLIENT DETAIL PAGE ────────────────────────────────────────────────────────
function ClientDetail({ client, onBack, onSave }) {
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(client)));
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("admin");
  const [addChapter, setAddChapter] = useState("");
  const pct = getProgress(data.chapters);
  const missing = getMissing(data.chapters);

  function setField(f, v) { setData(d => ({ ...d, [f]: v })); setSaved(false); }
  function setChapterField(ch, f, v) { setData(d => ({ ...d, chapters: { ...d.chapters, [ch]: { ...d.chapters[ch], [f]: v } } })); setSaved(false); }
  function handleAddChapter() {
    const name = addChapter.trim();
    if (!name || data.chapters[name]) return;
    setData(d => ({ ...d, chapters: { ...d.chapters, [name]: { status: "pending", note: "" } } }));
    setAddChapter("");
  }
  function handleRemoveChapter(ch) { setData(d => { const c = { ...d.chapters }; delete c[ch]; return { ...d, chapters: c }; }); }
  function handleSave() { onSave(data); setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Heebo','Assistant',sans-serif", direction:"rtl", color:C.text }}>
      <div style={{ background:C.navy, color:"#fff", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
        <div><div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5 }}>מערכת ניהול מענקים</div><div style={{ fontSize:12, opacity:0.6 }}>פורטל ניהול תיקים</div></div>
        <button onClick={onBack} style={{ ...btn("ghost"), color:"#fff", border:"1px solid rgba(255,255,255,0.3)" }}>← חזרה</button>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, gap:12, flexWrap:"wrap" }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:800 }}>{data.name}</h2>
            <div style={{ color:C.muted, fontSize:14, marginTop:3 }}>{data.grantName}</div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={btn(view==="admin"?"primary":"ghost")} onClick={() => setView("admin")}>🗂 ניהול</button>
            <button style={btn(view==="client"?"secondary":"ghost")} onClick={() => setView("client")}>👁 תצוגת לקוח</button>
            {missing.length > 0 && (
              <a href={buildMailto(data)} style={{ ...btn("danger"), textDecoration:"none" }}>
                ✉ מייל מסמכים חסרים ({missing.length})
              </a>
            )}
            <button onClick={handleSave} style={btn("primary")}>{saved ? "✓ נשמר!" : "💾 שמור"}</button>
          </div>
        </div>

        {view === "admin"
          ? <AdminDetail data={data} setField={setField} setChapterField={setChapterField}
              addChapter={addChapter} setAddChapter={setAddChapter}
              handleAddChapter={handleAddChapter} handleRemoveChapter={handleRemoveChapter}
              pct={pct} missing={missing} />
          : <ClientFacing data={data} pct={pct} missing={missing} />
        }
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  function saveClient(updated) { setClients(cs => cs.map(c => c.id === updated.id ? updated : c)); setSelected(updated); }

  function addClient() {
    const id = Date.now();
    const nc = {
      id, name: "לקוח חדש", email: "", phone: "", grantName: "שם המענק",
      deadline: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
      portalUrl: `https://grants-portal.example.com/client/${id}`,
      chapters: Object.fromEntries(DEFAULT_CHAPTERS.map(c => [c, { status: "pending", note: "" }])),
    };
    setClients(cs => [...cs, nc]);
    setSelected(nc);
  }

  if (selected) return <ClientDetail client={selected} onBack={() => setSelected(null)} onSave={saveClient} />;

  const filtered = clients.filter(c => c.name.includes(search) || c.grantName.includes(search) || c.email.includes(search));

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Heebo','Assistant',sans-serif", direction:"rtl", color:C.text }}>
      <div style={{ background:C.navy, color:"#fff", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, boxShadow:"0 2px 8px rgba(0,0,0,0.18)" }}>
        <div><div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5 }}>מערכת ניהול מענקים</div><div style={{ fontSize:12, opacity:0.6 }}>{clients.length} תיקים פעילים</div></div>
        <button onClick={addClient} style={btn("primary")}>+ לקוח חדש</button>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:24 }}>
          {[
            { label:'סה"כ תיקים', value: clients.length, color: C.accent },
            { label: "מסמכים חסרים", value: clients.filter(c => getMissing(c.chapters).length > 0).length, color: "#b91c1c" },
            { label: "מועד קרוב (14 יום)", value: clients.filter(c => { const d=daysUntil(c.deadline); return d>=0&&d<=14; }).length, color: "#c2410c" },
            { label: "הושלמו 100%", value: clients.filter(c => getProgress(c.chapters)===100).length, color: "#15803d" },
          ].map(stat => (
            <div key={stat.label} style={{ ...card(), padding:"16px 20px", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:900, color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  חפש לפי שם, מענק, אימייל..."
          style={{ width:"100%", boxSizing:"border-box", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 16px", fontSize:14, outline:"none", background:"#fff", direction:"rtl", marginBottom:18, fontFamily:"inherit" }} />

        {/* Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:14 }}>
          {filtered.map(c => <ClientCard key={c.id} client={c} onOpen={() => setSelected(c)} />)}
          {filtered.length === 0 && <div style={{ gridColumn:"1/-1", textAlign:"center", color:C.muted, padding:40 }}>לא נמצאו תיקים</div>}
        </div>
      </div>
    </div>
  );
}
