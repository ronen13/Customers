require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'לקוח חדש',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    grant_name TEXT NOT NULL DEFAULT 'שם המענק',
    deadline TEXT NOT NULL DEFAULT '',
    portal_url TEXT NOT NULL DEFAULT '',
    drive_url TEXT NOT NULL DEFAULT '',
    chapters JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`);
  console.log("DB ready");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try { jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
}

function toClient(r) {
  return {
    id: r.id, token: r.token, name: r.name, email: r.email, phone: r.phone,
    grantName: r.grant_name, deadline: r.deadline,
    portalUrl: r.portal_url, googleDriveUrl: r.drive_url,
    chapters: typeof r.chapters === "string" ? JSON.parse(r.chapters) : (r.chapters || {}),
  };
}

app.post("/api/auth/login", (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "סיסמה שגויה" });
  res.json({ token: jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "30d" }) });
});

app.get("/api/admin/clients", auth, async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM clients ORDER BY created_at DESC");
  res.json(rows.map(toClient));
});

app.post("/api/admin/clients", auth, async (_req, res) => {
  const ch = {
    "טופס בקשה ראשי": { status:"pending", note:"" },
    "תקציב מפורט": { status:"pending", note:"" },
    "תכנית עסקית": { status:"pending", note:"" },
    "אישורי רשויות": { status:"pending", note:"" },
    "דוחות כספיים": { status:"pending", note:"" },
    "אישור ניהול תקין": { status:"pending", note:"" },
    "המלצות ואסמכתאות": { status:"pending", note:"" },
    "דוח התקדמות": { status:"pending", note:"" }
  };
  const dl = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);
  const { rows } = await pool.query(
    "INSERT INTO clients (name,email,phone,grant_name,deadline,portal_url,drive_url,chapters) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
    ["לקוח חדש","","","שם המענק",dl,"","",JSON.stringify(ch)]
  );
  res.json(toClient(rows[0]));
});

app.put("/api/admin/clients/:id", auth, async (req, res) => {
  const c = req.body;
  const { rows } = await pool.query(
    "UPDATE clients SET name=$1,email=$2,phone=$3,grant_name=$4,deadline=$5,portal_url=$6,drive_url=$7,chapters=$8 WHERE id=$9 RETURNING *",
    [c.name,c.email,c.phone,c.grantName,c.deadline,c.portalUrl,c.googleDriveUrl,JSON.stringify(c.chapters),req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error:"Not found" });
  res.json(toClient(rows[0]));
});

app.delete("/api/admin/clients/:id", auth, async (req, res) => {
  await pool.query("DELETE FROM clients WHERE id=$1", [req.params.id]);
  res.json({ ok:true });
});

app.get("/api/client/:token", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM clients WHERE token=$1", [req.params.token]);
  if (!rows.length) return res.status(404).json({ error:"לא נמצא" });
  const c = toClient(rows[0]);
  res.json({ name:c.name, grantName:c.grantName, deadline:c.deadline, portalUrl:c.portalUrl, googleDriveUrl:c.googleDriveUrl, chapters:c.chapters });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

initDB()
  .then(() => app.listen(PORT, () => console.log("Server running on port " + PORT)))
  .catch(err => { console.error("DB error:", err.message); process.exit(1); });
