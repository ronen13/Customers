import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api.js"

const C = { navy:"#0f2744", accent:"#2563eb", accentBg:"#eff6ff", surface:"#fff", bg:"#f1f5f9", border:"#e2e8f0", text:"#0f172a", muted:"#64748b" }
const S = {
  complete:     { label:"הושלם",        color:"#15803d", bg:"#f0fdf4", border:"#86efac", icon:"✓" },
  pending:      { label:"בתהליך",       color:"#92400e", bg:"#fffbeb", border:"#fcd34d", icon:"◔" },
  missing:      { label:"חסר מסמכים",  color:"#b91c1c", bg:"#fef2f2", border:"#fca5a5", icon:"!" },
  review:       { label:"בבדיקה",      color:"#1d4ed8", bg:"#eff6ff", border:"#93c5fd", icon:"⟳" },
  not_relevant: { label:"לא רלוונטי",  color:"#64748b", bg:"#f8fafc", border:"#cbd5e1", icon:"–" },
}

function pct(ch) {
  const rel = Object.values(ch).filter(c=>c.status!=="not_relevant")
  return rel.length ? Math.round(rel.filter(c=>c.status==="complete").length/rel.length*100) : 0
}
function missing(ch) { return Object.entries(ch).filter(([,v])=>v.status==="missing") }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("he-IL",{day:"2-digit",month:"2-digit",year:"numeric"}) : "" }
function daysLeft(d) { return d ? Math.ceil((new Date(d)-new Date())/86400000) : null }

function buildMailto(c) {
  const miss = missing(c.chapters)
  const lines = miss.map(([ch,v])=>"• "+ch+(v.note?"\n  פרוט: "+v.note:"")).join("\n")
  const drive = c.googleDriveUrl ? "\nתיקיית Google Drive:\n"+c.googleDriveUrl+"\n" : ""
  const subj = encodeURIComponent("השלמת מסמכים – "+c.grantName)
  const body = encodeURIComponent("שלום,\n\nלצורך המשך טיפול בבקשת המענק \""+c.grantName+"\", נדרשים המסמכים הבאים:\n\n"+lines+"\n\nאנא העלה את המסמכים דרך הפורטל:\n"+c.portalUrl+"\n"+drive+"\nמועד הגשה: "+fmtDate(c.deadline)+"\n\nבברכה")
  return "mailto:"+c.email+"?subject="+subj+"&body="+body
}

function btn(v) {
  const b = {display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",border:"none",fontFamily:"inherit",transition:"all .15s"}
  if(v==="primary")   return {...b,background:C.accent,color:"#fff"}
  if(v==="danger")    return {...b,background:"#fef2f2",color:"#b91c1c",border:"1px solid #fca5a5"}
  if(v==="secondary") return {...b,background:C.accentBg,color:C.accent,border:"1px solid #bfdbfe"}
  if(v==="red-sm")    return {...b,background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5",padding:"3px 10px",fontSize:12}
  return {...b,background:"transparent",color:C.muted,border:"1px solid "+C.border}
}
function card(ex) { return {background:C.surface,borderRadius:14,border:"1px solid "+C.border,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",overflow:"hidden",...ex} }

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
function Badge({status}) {
  const cfg = S[status]||S.pending
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.color,border:"1px solid "+cfg.border,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}><span style={{fontSize:10}}>{cfg.icon}</span>{cfg.label}</span>
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function Bar({p}) {
  const color = p===100?"#15803d":p>=60?"#2563eb":p>=30?"#d97706":"#dc2626"
  return <div style={{width:"100%",background:"#e2e8f0",borderRadius:99,height:7,overflow:"hidden"}}><div style={{width:p+"%",background:color,height:"100%",borderRadius:99,transition:"width .4s"}} /></div>
}

// ─── CLIENT CARD ──────────────────────────────────────────────────────────────
function ClientCard({client, onOpen, onDelete}) {
  const [hov, setHov] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const p = pct(client.chapters)
  const miss = missing(client.chapters).length
  const rev = Object.values(client.chapters).filter(c=>c.status==="review").length
  const url = window.location.origin+"/client/"+client.token
  const days = daysLeft(client.deadline)

  return (
    <div onClick={onOpen} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setConfirm(false)}}
      style={{...card(),padding:"18px 22px",cursor:"pointer",display:"flex",flexDirection:"column",gap:12,position:"relative",boxShadow:hov?"0 4px 18px rgba(37,99,235,.13)":"0 1px 4px rgba(0,0,0,0.06)",transform:hov?"translateY(-2px)":"none",transition:"all .18s"}}>
      
      {/* Delete button */}
      {!confirm
        ? <button onClick={e=>{e.stopPropagation();setConfirm(true)}} style={{position:"absolute",top:10,left:10,background:"transparent",border:"none",color:hov?"#ef4444":"#d1d5db",cursor:"pointer",fontSize:15,padding:4,lineHeight:1,transition:"color .15s"}}>✕</button>
        : <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:8,left:8,background:"#fff",border:"1px solid #fca5a5",borderRadius:8,padding:"6px 10px",display:"flex",gap:6,alignItems:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.12)",zIndex:10}}>
            <span style={{fontSize:12,color:"#b91c1c",fontWeight:700}}>למחוק?</span>
            <button onClick={e=>{e.stopPropagation();onDelete(client.id)}} style={btn("red-sm")}>כן</button>
            <button onClick={e=>{e.stopPropagation();setConfirm(false)}} style={{...btn("ghost"),padding:"3px 10px",fontSize:12}}>ביטול</button>
          </div>
      }

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,paddingLeft:26}}>
        <div>
          <div style={{fontWeight:800,fontSize:16}}>{client.name}</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>{client.grantName}</div>
        </div>
        {client.deadline && (
          <span style={{display:"inline-flex",alignItems:"center",gap:5,borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700,background:days<0?"#fef2f2":days<=14?"#fff7ed":"#f0fdf4",color:days<0?"#b91c1c":days<=14?"#c2410c":"#15803d",whiteSpace:"nowrap"}}>
            📅 {fmtDate(client.deadline)} · {days<0?"עבר":days===0?"היום!":days+" ימים"}
          </span>
        )}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{flex:1}}><Bar p={p} /></div>
        <span style={{fontSize:13,fontWeight:700,color:C.muted,minWidth:34}}>{p}%</span>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {miss>0 && <span style={{background:"#fef2f2",color:"#b91c1c",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>{miss} חסרים</span>}
        {rev>0  && <span style={{background:"#eff6ff",color:"#1d4ed8",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>{rev} בבדיקה</span>}
        {client.googleDriveUrl && <span style={{background:"#f0fdf4",color:"#15803d",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:600}}>📁 Drive</span>}
      </div>

      {/* Client link */}
      <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",borderRadius:8,padding:"8px 12px",border:"1px solid "+C.border}}>
        <span style={{fontSize:11,color:C.muted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",direction:"ltr",textAlign:"left"}}>{url}</span>
        <button onClick={()=>{navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
          style={{...btn("secondary"),padding:"3px 10px",fontSize:11,flexShrink:0}}>{copied?"✓ הועתק":"📋 העתק"}</button>
      </div>
    </div>
  )
}

// ─── ADMIN DETAIL ─────────────────────────────────────────────────────────────
function Detail({client, onBack, onSave}) {
  const [d, setD] = useState(()=>JSON.parse(JSON.stringify(client)))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState("admin")
  const [newCh, setNewCh] = useState("")
  const [copied, setCopied] = useState(false)
  const url = window.location.origin+"/client/"+client.token
  const p = pct(d.chapters)
  const miss = missing(d.chapters)

  function setF(f,v) { setD(x=>({...x,[f]:v}));setSaved(false) }
  function setCh(ch,f,v) { setD(x=>({...x,chapters:{...x.chapters,[ch]:{...x.chapters[ch],[f]:v}}}));setSaved(false) }
  function addCh() { const n=newCh.trim(); if(!n||d.chapters[n]) return; setD(x=>({...x,chapters:{...x.chapters,[n]:{status:"pending",note:""}}}));setNewCh("") }
  function delCh(ch) { setD(x=>{const c={...x.chapters};delete c[ch];return{...x,chapters:c}}) }
  async function save() { setSaving(true);await onSave(d);setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500) }
  function copyUrl() { navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000) }
  const days = daysLeft(d.deadline)

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Heebo',sans-serif",direction:"rtl",color:C.text}}>
      {/* Header */}
      <div style={{background:C.navy,color:"#fff",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,boxShadow:"0 2px 8px rgba(0,0,0,0.18)"}}>
        <div><div style={{fontSize:17,fontWeight:800}}>מערכת ניהול מענקים</div></div>
        <button onClick={onBack} style={{...btn("ghost"),color:"#fff",border:"1px solid rgba(255,255,255,0.3)"}}>← חזרה</button>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>
        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,gap:12,flexWrap:"wrap"}}>
          <div>
            <h2 style={{margin:0,fontSize:22,fontWeight:800}}>{d.name}</h2>
            <div style={{color:C.muted,fontSize:14,marginTop:3}}>{d.grantName}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {/* Toggle */}
            <div style={{display:"flex",background:"#e2e8f0",borderRadius:8,padding:3}}>
              {[["admin","🗂 ניהול"],["client","👁 לקוח"]].map(([v,lbl])=>(
                <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,transition:"all .15s",background:view===v?(v==="admin"?C.accent:C.accentBg):"transparent",color:view===v?(v==="admin"?"#fff":C.accent):C.muted}}>{lbl}</button>
              ))}
            </div>
            {miss.length>0 && <a href={buildMailto(d)} style={{...btn("danger"),textDecoration:"none"}}>✉ מייל ({miss.length})</a>}
            {d.googleDriveUrl && <a href={d.googleDriveUrl} target="_blank" rel="noreferrer" style={{...btn("secondary"),textDecoration:"none"}}>📁 Drive</a>}
            <button onClick={save} disabled={saving} style={{...btn("primary"),opacity:saving?0.7:1}}>{saving?"שומר...":saved?"✓ נשמר!":"💾 שמור"}</button>
          </div>
        </div>

        {/* Client URL bar */}
        <div style={{...card({marginBottom:20,padding:"14px 20px"}),display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:700,color:C.muted,whiteSpace:"nowrap"}}>🔗 קישור ללקוח:</span>
          <span style={{fontSize:13,color:C.accent,flex:1,direction:"ltr",textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{url}</span>
          <button onClick={copyUrl} style={{...btn("secondary"),flexShrink:0}}>{copied?"✓ הועתק!":"📋 העתק"}</button>
          <a href={url} target="_blank" rel="noreferrer" style={{...btn("ghost"),textDecoration:"none",flexShrink:0}}>↗ פתח</a>
        </div>

        {view==="admin" ? (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {/* Client info */}
            <div style={card({padding:"20px 24px"})}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:16,borderBottom:"1px solid "+C.border,paddingBottom:10}}>פרטי לקוח</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["שם מלא","name","text"],["אימייל","email","email"],["טלפון","phone","text"],["שם המענק","grantName","text"],["מועד הגשה","deadline","date"],["קישור לפורטל","portalUrl","url"]].map(([lbl,f,t])=>(
                  <label key={f} style={{display:"flex",flexDirection:"column",gap:5}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.muted}}>{lbl}</span>
                    <input type={t} value={d[f]||""} onChange={e=>setF(f,e.target.value)}
                      style={{border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",background:"#fafafa",direction:t==="url"||t==="email"?"ltr":"rtl",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}} />
                  </label>
                ))}
                <label style={{display:"flex",flexDirection:"column",gap:5,gridColumn:"1 / -1"}}>
                  <span style={{fontSize:12,fontWeight:700,color:C.muted}}>📁 קישור לתיקיית Google Drive</span>
                  <div style={{display:"flex",gap:8}}>
                    <input type="url" value={d.googleDriveUrl||""} onChange={e=>setF("googleDriveUrl",e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      style={{border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",background:"#fafafa",direction:"ltr",fontFamily:"inherit",flex:1,boxSizing:"border-box"}} />
                    {d.googleDriveUrl && <a href={d.googleDriveUrl} target="_blank" rel="noreferrer" style={{...btn("secondary"),textDecoration:"none"}}>📁 פתח</a>}
                  </div>
                </label>
              </div>
            </div>

            {/* Progress */}
            <div style={card({padding:"18px 24px"})}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontWeight:800,fontSize:15}}>התקדמות</span>
                <span style={{fontWeight:800,fontSize:20,color:p===100?"#15803d":C.accent}}>{p}%</span>
              </div>
              <Bar p={p} />
              <div style={{display:"flex",gap:16,marginTop:14,flexWrap:"wrap"}}>
                {Object.entries(S).map(([key,cfg])=>{
                  const n=Object.values(d.chapters).filter(c=>c.status===key).length
                  return n>0?<span key={key} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:cfg.color,fontWeight:600}}><span style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:4,padding:"1px 6px"}}>{n}</span>{cfg.label}</span>:null
                })}
              </div>
            </div>

            {/* Chapters */}
            <div style={card()}>
              <div style={{padding:"16px 24px",borderBottom:"1px solid "+C.border,fontWeight:800,fontSize:15,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <span>פרקי הבקשה</span>
                <div style={{display:"flex",gap:8}}>
                  <input value={newCh} onChange={e=>setNewCh(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCh()}
                    placeholder="הוסף פרק..." style={{border:"1px solid "+C.border,borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",direction:"rtl",width:160,fontFamily:"inherit"}} />
                  <button onClick={addCh} style={btn("secondary")}>+ הוסף</button>
                </div>
              </div>
              {Object.entries(d.chapters).map(([ch,val],i,arr)=>(
                <div key={ch} style={{display:"grid",gridTemplateColumns:"1fr 150px 1fr auto",alignItems:"center",gap:14,padding:"14px 24px",borderBottom:i<arr.length-1?"1px solid "+C.border:"none",background:val.status==="missing"?"#fffafa":"transparent"}}>
                  <div style={{fontWeight:600,fontSize:14}}>{ch}</div>
                  <select value={val.status} onChange={e=>setCh(ch,"status",e.target.value)}
                    style={{border:"1px solid "+(S[val.status]||S.pending).border,background:(S[val.status]||S.pending).bg,color:(S[val.status]||S.pending).color,borderRadius:8,padding:"6px 10px",fontSize:13,fontWeight:700,outline:"none",cursor:"pointer",direction:"rtl",fontFamily:"inherit"}}>
                    {Object.entries(S).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input placeholder={val.status==="missing"?"פרט מסמכים חסרים...":"הערה"} value={val.note}
                    onChange={e=>setCh(ch,"note",e.target.value)}
                    style={{border:"1px solid "+(val.status==="missing"?"#fca5a5":C.border),borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",background:"#fafafa",direction:"rtl",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}} />
                  <button onClick={()=>delCh(ch)} style={{background:"transparent",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:20,padding:"0 4px",lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Client preview */
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{background:"linear-gradient(135deg,#0f2744,#1e4db7)",borderRadius:16,padding:"28px 32px",color:"#fff"}}>
              <div style={{fontSize:13,opacity:0.6,marginBottom:6}}>הפורטל האישי שלך</div>
              <h1 style={{margin:"0 0 4px",fontSize:24,fontWeight:800}}>שלום, {d.name}</h1>
              <div style={{opacity:0.75,fontSize:14}}>{d.grantName}</div>
              <div style={{marginTop:22,display:"flex",gap:28,flexWrap:"wrap"}}>
                <div><div style={{fontSize:11,opacity:0.6,marginBottom:3}}>התקדמות</div><div style={{fontSize:30,fontWeight:900}}>{p}%</div></div>
                {d.deadline && <div>
                  <div style={{fontSize:11,opacity:0.6,marginBottom:3}}>מועד הגשה</div>
                  <div style={{fontSize:16,fontWeight:700}}>{fmtDate(d.deadline)}</div>
                  <div style={{fontSize:12,opacity:0.65}}>{days<0?"עבר המועד":days===0?"היום!":"נותרו "+days+" ימים"}</div>
                </div>}
                {miss.length>0 && <div><div style={{fontSize:11,opacity:0.6,marginBottom:3}}>מסמכים חסרים</div><div style={{fontSize:30,fontWeight:900,color:"#fca5a5"}}>{miss.length}</div></div>}
              </div>
              <div style={{marginTop:16,background:"rgba(255,255,255,0.18)",borderRadius:99,height:8,overflow:"hidden"}}>
                <div style={{width:p+"%",background:"#fff",height:"100%",borderRadius:99}} />
              </div>
            </div>
            {miss.length>0 && (
              <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:14,padding:"18px 24px"}}>
                <div style={{fontWeight:800,color:"#b91c1c",marginBottom:12,fontSize:15}}>⚠️ מסמכים חסרים</div>
                {miss.map(([ch,v])=>(
                  <div key={ch} style={{background:"#fff",borderRadius:10,padding:"12px 16px",border:"1px solid #fecaca",marginBottom:8}}>
                    <div style={{fontWeight:700,fontSize:14}}>{ch}</div>
                    {v.note && <div style={{color:"#b91c1c",fontSize:13,marginTop:4}}>{v.note}</div>}
                  </div>
                ))}
              </div>
            )}
            <div style={card()}>
              <div style={{padding:"16px 24px",borderBottom:"1px solid "+C.border,fontWeight:800,fontSize:15}}>סטטוס פרקים</div>
              {Object.entries(d.chapters).map(([ch,val],i,arr)=>(
                <div key={ch} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",gap:12,borderBottom:i<arr.length-1?"1px solid "+C.border:"none"}}>
                  <span style={{fontWeight:600,fontSize:14}}>{ch}</span>
                  <Badge status={val.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function Admin() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const nav = useNavigate()

  useEffect(()=>{
    api.list()
      .then(setClients)
      .catch(()=>{ localStorage.removeItem("tk"); nav("/login") })
      .finally(()=>setLoading(false))
  },[nav])

  async function handleCreate() {
    const nc = await api.create()
    setClients(cs=>[nc,...cs])
    setSelected(nc)
  }
  async function handleSave(updated) {
    const saved = await api.update(updated.id, updated)
    setClients(cs=>cs.map(c=>c.id===saved.id?saved:c))
    setSelected(saved)
  }
  async function handleDelete(id) {
    await api.del(id)
    setClients(cs=>cs.filter(c=>c.id!==id))
  }

  if (selected) return <Detail client={selected} onBack={()=>setSelected(null)} onSave={handleSave} />

  const filtered = clients.filter(c=>c.name.includes(search)||c.grantName.includes(search)||c.email.includes(search))

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Heebo',sans-serif",direction:"rtl",color:C.text}}>
      <div style={{background:C.navy,color:"#fff",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,boxShadow:"0 2px 8px rgba(0,0,0,0.18)"}}>
        <div>
          <div style={{fontSize:17,fontWeight:800}}>מערכת ניהול מענקים</div>
          <div style={{fontSize:12,opacity:0.6}}>{clients.length} תיקים פעילים</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={handleCreate} style={btn("primary")}>+ לקוח חדש</button>
          <button onClick={()=>{localStorage.removeItem("tk");nav("/login")}} style={{...btn("ghost"),color:"#fff",border:"1px solid rgba(255,255,255,0.3)"}}>יציאה</button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
          {[
            {label:'סה"כ תיקים',value:clients.length,color:C.accent},
            {label:"מסמכים חסרים",value:clients.filter(c=>missing(c.chapters).length>0).length,color:"#b91c1c"},
            {label:"מועד קרוב",value:clients.filter(c=>{const d=daysLeft(c.deadline);return d!==null&&d>=0&&d<=14}).length,color:"#c2410c"},
            {label:"הושלמו 100%",value:clients.filter(c=>pct(c.chapters)===100).length,color:"#15803d"},
          ].map(s=>(
            <div key={s.label} style={{...card(),padding:"16px 20px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:s.color}}>{s.value}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  חפש לפי שם, מענק, אימייל..."
          style={{width:"100%",boxSizing:"border-box",border:"1px solid "+C.border,borderRadius:10,padding:"10px 16px",fontSize:14,outline:"none",background:"#fff",direction:"rtl",marginBottom:18,fontFamily:"inherit"}} />

        {loading
          ? <div style={{textAlign:"center",padding:60,color:C.muted,fontSize:16}}>טוען...</div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
              {filtered.map(c=><ClientCard key={c.id} client={c} onOpen={()=>setSelected(c)} onDelete={handleDelete} />)}
              {filtered.length===0 && <div style={{gridColumn:"1/-1",textAlign:"center",color:C.muted,padding:40}}>לא נמצאו תיקים</div>}
            </div>
        }
      </div>
    </div>
  )
}
