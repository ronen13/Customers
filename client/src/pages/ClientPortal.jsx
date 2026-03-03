import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api.js"

const S = {
  complete:     { label:"הושלם",        color:"#15803d", bg:"#f0fdf4", border:"#86efac", icon:"✓" },
  pending:      { label:"בתהליך",       color:"#92400e", bg:"#fffbeb", border:"#fcd34d", icon:"◔" },
  missing:      { label:"חסר מסמכים",  color:"#b91c1c", bg:"#fef2f2", border:"#fca5a5", icon:"!" },
  review:       { label:"בבדיקה",      color:"#1d4ed8", bg:"#eff6ff", border:"#93c5fd", icon:"⟳" },
  not_relevant: { label:"לא רלוונטי",  color:"#64748b", bg:"#f8fafc", border:"#cbd5e1", icon:"–" },
}

function pct(ch) {
  const rel = Object.values(ch).filter(c=>c.status!=="not_relevant")
  const done = rel.filter(c=>c.status==="complete").length
  return rel.length ? Math.round(done/rel.length*100) : 0
}
function missing(ch) { return Object.entries(ch).filter(([,v])=>v.status==="missing") }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("he-IL",{day:"2-digit",month:"2-digit",year:"numeric"}) : "" }

export default function ClientPortal() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.clientData(token).then(setData).catch(()=>setErr("הקישור אינו תקין"))
  }, [token])

  if (err) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f2744,#1e4db7)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"48px 40px",textAlign:"center",maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:12}}>🔍</div>
        <h2 style={{fontWeight:800,marginBottom:8}}>קישור לא נמצא</h2>
        <p style={{color:"#64748b",fontSize:14}}>{err}</p>
      </div>
    </div>
  )

  if (!data) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif"}}>
      <div style={{fontSize:24,color:"#64748b"}}>טוען...</div>
    </div>
  )

  const p = pct(data.chapters)
  const miss = missing(data.chapters)
  const days = data.deadline ? Math.ceil((new Date(data.deadline)-new Date())/86400000) : null

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Heebo',sans-serif",direction:"rtl",color:"#0f172a"}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0f2744,#1e4db7)",padding:"32px 24px 90px",color:"#fff"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{fontSize:13,opacity:0.6,marginBottom:8}}>🏛️ פורטל מענקים</div>
          <h1 style={{margin:"0 0 6px",fontSize:28,fontWeight:900}}>שלום, {data.name}</h1>
          <div style={{opacity:0.8,fontSize:15,marginBottom:24}}>{data.grantName}</div>
          <div style={{display:"flex",gap:32,flexWrap:"wrap",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,opacity:0.6,marginBottom:4}}>התקדמות</div>
              <div style={{fontSize:36,fontWeight:900}}>{p}%</div>
            </div>
            {data.deadline && (
              <div>
                <div style={{fontSize:11,opacity:0.6,marginBottom:4}}>מועד הגשה</div>
                <div style={{fontSize:20,fontWeight:700}}>{fmtDate(data.deadline)}</div>
                <div style={{fontSize:13,opacity:0.7,marginTop:2}}>
                  {days===null?"":days<0?"⚠️ עבר המועד":days===0?"⏰ היום!":"נותרו "+days+" ימים"}
                </div>
              </div>
            )}
            {miss.length>0 && (
              <div>
                <div style={{fontSize:11,opacity:0.6,marginBottom:4}}>פעולה נדרשת</div>
                <div style={{fontSize:36,fontWeight:900,color:"#fca5a5"}}>{miss.length}</div>
              </div>
            )}
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:10,overflow:"hidden"}}>
            <div style={{width:p+"%",background:"#fff",height:"100%",borderRadius:99,transition:"width .8s"}} />
          </div>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"-60px auto 0",padding:"0 20px 60px"}}>
        {/* Missing alert */}
        {miss.length>0 && (
          <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:16,padding:"20px 24px",marginBottom:20,boxShadow:"0 4px 16px rgba(239,68,68,.12)"}}>
            <div style={{fontWeight:800,color:"#b91c1c",marginBottom:14,fontSize:16}}>⚠️ נדרשת פעולה — מסמכים חסרים</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {miss.map(([ch,v]) => (
                <div key={ch} style={{background:"#fff",borderRadius:10,padding:"12px 16px",border:"1px solid #fecaca"}}>
                  <div style={{fontWeight:700,fontSize:14}}>{ch}</div>
                  {v.note && <div style={{color:"#b91c1c",fontSize:13,marginTop:4}}>{v.note}</div>}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
              {data.portalUrl && <a href={data.portalUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fef2f2",color:"#b91c1c",border:"1px solid #fca5a5",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,textDecoration:"none"}}>📎 העלאת מסמכים</a>}
              {data.googleDriveUrl && <a href={data.googleDriveUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,textDecoration:"none"}}>📁 Google Drive</a>}
            </div>
          </div>
        )}

        {/* All done */}
        {miss.length===0 && p===100 && (
          <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:16,padding:"20px 24px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{fontWeight:800,color:"#15803d",fontSize:16}}>הכל הושלם! הבקשה מוכנה להגשה</div>
          </div>
        )}

        {/* Chapters */}
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",marginBottom:20}}>
          <div style={{padding:"16px 24px",borderBottom:"1px solid #e2e8f0",fontWeight:800,fontSize:15}}>סטטוס פרקים</div>
          {Object.entries(data.chapters).map(([ch,val],i,arr) => {
            const cfg = S[val.status]||S.pending
            return (
              <div key={ch} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 24px",gap:12,borderBottom:i<arr.length-1?"1px solid #e2e8f0":"none",background:val.status==="missing"?"#fffafa":val.status==="complete"?"#fafffe":"transparent"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{ch}</div>
                  {val.status==="missing"&&val.note && <div style={{fontSize:12,color:"#b91c1c",marginTop:3}}>{val.note}</div>}
                </div>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,background:cfg.bg,color:cfg.color,border:"1px solid "+cfg.border,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
                  <span style={{fontSize:10}}>{cfg.icon}</span>{cfg.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Links */}
        {(data.portalUrl||data.googleDriveUrl) && (
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"16px 24px"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#64748b",marginBottom:12}}>קישורים שימושיים</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {data.portalUrl && <a href={data.portalUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,textDecoration:"none"}}>🔗 הפורטל שלי</a>}
              {data.googleDriveUrl && <a href={data.googleDriveUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f0fdf4",color:"#15803d",border:"1px solid #86efac",borderRadius:8,padding:"8px 16px",fontWeight:700,fontSize:13,textDecoration:"none"}}>📁 Google Drive</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
