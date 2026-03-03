import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api.js"

export default function Login() {
  const [pw, setPw] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setErr("")
    try {
      const { token } = await api.login(pw)
      localStorage.setItem("tk", token)
      nav("/admin")
    } catch(e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f2744,#1e4db7)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Heebo',sans-serif",direction:"rtl"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:380,boxShadow:"0 24px 64px rgba(0,0,0,0.25)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:48,marginBottom:12}}>🏛️</div>
          <h1 style={{fontSize:22,fontWeight:900,color:"#0f172a",margin:0}}>כניסת מנהל</h1>
          <p style={{color:"#64748b",fontSize:14,marginTop:6}}>מערכת ניהול מענקים</p>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:16}}>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            placeholder="סיסמת ניהול" autoFocus
            style={{border:"1.5px solid "+(err?"#fca5a5":"#e2e8f0"),borderRadius:10,padding:"12px 16px",fontSize:15,outline:"none",fontFamily:"inherit",direction:"rtl"}} />
          {err && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#b91c1c",fontWeight:600}}>⚠️ {err}</div>}
          <button type="submit" disabled={loading||!pw}
            style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:700,cursor:loading||!pw?"not-allowed":"pointer",opacity:loading||!pw?0.6:1,fontFamily:"inherit"}}>
            {loading?"מתחבר...":"כניסה →"}
          </button>
        </form>
      </div>
    </div>
  )
}
