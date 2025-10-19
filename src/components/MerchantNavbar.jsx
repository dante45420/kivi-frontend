import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import '../styles/globals.css'
import { useState } from 'react'
import { clearToken, getUserData } from '../api/auth'

export default function MerchantNavbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const userData = getUserData()

  function handleLogout() {
    clearToken()
    // Disparar evento para actualizar el estado de autenticación
    window.dispatchEvent(new Event('auth-change'))
    navigate('/login')
  }

  return (
    <header style={{ background:'#000', color:'#fff', borderBottom:'1px solid #222' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontWeight:800, fontSize:18, letterSpacing:0.5 }}>🥝 Kivi B2B</div>
          {userData && (
            <div style={{ fontSize:12, opacity:0.7, fontWeight:500 }}>
              {userData.business_name || userData.email}
            </div>
          )}
        </div>
        <nav className="nav-desktop" style={{ display:'flex', gap:24, alignItems:'center' }}>
          <NavLink to="/merchant/dashboard" style={({isActive}) => ({ color:'#fff', textDecoration:'none', fontSize:14, fontWeight:500, opacity: isActive ? 1 : 0.7, transition:'opacity 0.2s' })}>Catálogo</NavLink>
          <NavLink to="/merchant/orders" style={({isActive}) => ({ color:'#fff', textDecoration:'none', fontSize:14, fontWeight:500, opacity: isActive ? 1 : 0.7, transition:'opacity 0.2s' })}>Mis Pedidos</NavLink>
          <button onClick={handleLogout} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'6px 16px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:500, transition:'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.target.style.background = 'transparent'}>Salir</button>
        </nav>
        <button className="nav-toggle" onClick={()=>setOpen(v=>!v)} aria-label="menu" style={{ background:'transparent', color:'#fff', border:'1px solid #444', padding:'8px 12px', cursor:'pointer', borderRadius:6, fontSize:18 }}>☰</button>
      </div>
      {open && (
        <div className="nav-mobile" style={{ borderTop:'1px solid #222', background:'#000' }}>
          <div style={{ maxWidth:960, margin:'0 auto', padding:'8px 12px', display:'grid', gap:8, justifyItems:'stretch' }} onClick={()=>setOpen(false)}>
            <NavLink to="/merchant/dashboard" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>🛒 Catálogo</NavLink>
            <NavLink to="/merchant/orders" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>📦 Mis Pedidos</NavLink>
            <button onClick={handleLogout} style={{ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #d32f2f', background:'#d32f2f', color:'#fff', margin:'0 0', cursor:'pointer' }}>Cerrar Sesión</button>
          </div>
        </div>
      )}
      <style>{`
        @media (min-width: 1100px){
          .nav-desktop{ display:flex !important }
          .nav-mobile{ display:none !important }
          .nav-toggle{ display:none !important }
        }
        @media (max-width: 1099px){
          .nav-desktop{ display:none !important }
        }
      `}</style>
    </header>
  )
}

