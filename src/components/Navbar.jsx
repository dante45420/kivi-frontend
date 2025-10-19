import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import '../styles/globals.css'
import { useState } from 'react'
import { clearToken } from '../api/auth'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    // Disparar evento para actualizar el estado de autenticación
    window.dispatchEvent(new Event('auth-change'))
    navigate('/')
  }

  return (
    <header style={{ background:'#000', color:'#fff' }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:800, letterSpacing:0.5 }}>🥝 Kivi</div>
        <nav className="nav-desktop" style={{ gap:10, alignItems:'center' }}>
          <NavLink to="/productos" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>Productos</NavLink>
          <NavLink to="/pedidos" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>Pedidos</NavLink>
          <NavLink to="/compras" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>Compras</NavLink>
          <NavLink to="/precios" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>Precios</NavLink>
          <NavLink to="/contabilidad" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>Contabilidad</NavLink>
          <NavLink to="/admin/kpis" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>📊 KPIs</NavLink>
          <NavLink to="/admin/proveedores" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>🏪 Proveedores</NavLink>
          <NavLink to="/admin/merchants" className={({isActive})=>`chip ${isActive?'active':''}`} style={{ background:'#fff', color:'#000', textDecoration:'none' }}>🏢 Merchants</NavLink>
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={handleLogout} className="chip" style={{ background:'#eee', color:'#000', border:'none', cursor:'pointer' }}>Salir →</button>
          <button className="button ghost nav-toggle" onClick={()=>setOpen(v=>!v)} aria-label="menu" style={{ background:'#000', color:'#fff', border:'1px solid #444', padding:'6px 10px' }}>☰</button>
        </div>
      </div>
      {open && (
        <div className="nav-mobile" style={{ borderTop:'1px solid #222', background:'#000' }}>
          <div style={{ maxWidth:960, margin:'0 auto', padding:'8px 12px', display:'grid', gap:8, justifyItems:'stretch' }} onClick={()=>setOpen(false)}>
            <NavLink to="/productos" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>Productos</NavLink>
            <NavLink to="/pedidos" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>Pedidos</NavLink>
            <NavLink to="/compras" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>Compras</NavLink>
            <NavLink to="/precios" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>Precios</NavLink>
            <NavLink to="/contabilidad" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>Contabilidad</NavLink>
            <NavLink to="/admin/kpis" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>📊 KPIs</NavLink>
            <NavLink to="/admin/proveedores" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>🏪 Proveedores</NavLink>
            <NavLink to="/admin/merchants" className={({isActive})=>`mobile-link ${isActive?'active':''}`} style={({isActive})=>({ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #222', background: isActive?'#000':'#fff', color: isActive?'#fff':'#000', margin:'0 0' })}>🏢 Merchants</NavLink>
            <button onClick={handleLogout} style={{ display:'block', width:'100%', textAlign:'center', textDecoration:'none', padding:'12px 14px', borderRadius:999, border:'1px solid #d32f2f', background:'#d32f2f', color:'#fff', margin:'0 0', cursor:'pointer' }}>Cerrar Sesión</button>
          </div>
        </div>
      )}
      <style>{`
        @media (min-width: 720px){
          .nav-desktop{ display:flex }
          .nav-mobile{ display:none }
          .nav-toggle{ display:none }
        }
      `}</style>
    </header>
  )
}
